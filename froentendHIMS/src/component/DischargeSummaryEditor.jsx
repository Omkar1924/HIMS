import { useEffect, useRef, useState } from "react";

import {
  getDischargeSummary,
  updateDischargeSummary,
  submitDischargeSummary,
  returnDischargeSummary,
  approveDischargeSummary,
  spellCheck,
  dsErrMsg,
} from "../api/ApiDischarge";

import DischargeDocument from "./DischargeDocument";
import {
  parseSections,
  serializeSections,
  renderSections,
} from "./DischargeUtils";

import "../style/reports.css";
import "../style/templateManager.css";
import "../style/discharge.css";

export default function DischargeSummaryEditor({
  summaryId,
  role = "NURSE",
  onBack,
}) {
  const [summary, setSummary] = useState(null);
  const [sections, setSections] = useState([]);
  const [meta, setMeta] = useState({
    admissionDate: "",
    dischargeDate: "",
    preparedBy: "",
  });
  const [notices, setNotices] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Remembers text the user undid, so it is not auto-corrected again.
  const skipRef = useRef({});

  const applySummary = (s) => {
    setSummary(s);
    setSections(parseSections(s.sectionsJson));
    setMeta({
      admissionDate: s.admissionDate ?? "",
      dischargeDate: s.dischargeDate ?? "",
      preparedBy: s.preparedBy ?? "",
    });
  };

  useEffect(() => {
    (async () => {
      try {
        applySummary(await getDischargeSummary(summaryId));
      } catch (e) {
        setError(dsErrMsg(e));
      }
    })();
  }, [summaryId]);

  const status = summary?.status;
  const locked = status === "APPROVED";
  const roleCanEdit =
    role === "DOCTOR" ? status === "PENDING_REVIEW" : status === "DRAFT";
  const canEditSection = (s) =>
    roleCanEdit && (role === "DOCTOR" || s.filledBy !== "DOCTOR");

  const setField = (i, j, patch) =>
    setSections((prev) =>
      prev.map((s, si) =>
        si !== i
          ? s
          : {
              ...s,
              fields: s.fields.map((f, fj) =>
                fj === j ? { ...f, ...patch } : f,
              ),
            },
      ),
    );

  const clearNotice = (k) =>
    setNotices((n) => {
      if (!n[k]) return n;
      const copy = { ...n };
      delete copy[k];
      return copy;
    });

  // Auto-correct spelling when the nurse leaves a field.
  const checkSpelling = async (i, j, text) => {
    const k = `${i}.${j}`;
    if (!text || !text.trim() || skipRef.current[k] === text) return;

    try {
      const res = await spellCheck(text);
      if (res?.changes?.length && res.corrected !== text) {
        setField(i, j, { value: res.corrected });
        setNotices((n) => ({
          ...n,
          [k]: { before: text, changes: res.changes },
        }));
      }
    } catch {
      // Spell check is a helper only; ignore failures.
    }
  };

  const undoSpelling = (i, j) => {
    const k = `${i}.${j}`;
    const notice = notices[k];
    if (!notice) return;
    skipRef.current[k] = notice.before;
    setField(i, j, { value: notice.before });
    clearNotice(k);
  };

  const buildPayload = () => ({
    admissionDate: meta.admissionDate || null,
    dischargeDate: meta.dischargeDate || null,
    preparedBy: meta.preparedBy,
    sectionsJson: serializeSections(sections),
  });

  const run = async (action, okMessage) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await action();
      if (result) applySummary(result);
      setMessage(okMessage);
    } catch (e) {
      setError(dsErrMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(() => updateDischargeSummary(summaryId, buildPayload()), "Saved.");

  const submit = () =>
    run(async () => {
      await updateDischargeSummary(summaryId, buildPayload());
      return submitDischargeSummary(summaryId);
    }, "Submitted to the doctor for review.");

  const approve = () => {
    if (!window.confirm("Approve and lock this discharge summary?")) return;
    run(
      () =>
        approveDischargeSummary(summaryId, {
          sectionsJson: serializeSections(sections),
        }),
      "Approved. The summary is now locked.",
    );
  };

  const sendBack = () => {
    const remark = window.prompt("Remark for the nurse (what needs correction):");
    if (remark === null) return;
    run(
      () => returnDischargeSummary(summaryId, remark),
      "Returned to the nurse.",
    );
  };

  if (!summary) {
    return (
      <div className="rp-page">
        {error ? <div className="rp-error rp-error-box">{error}</div> : "Loading..."}
      </div>
    );
  }

  const rendered =
    locked && summary.renderedJson
      ? parseSections(summary.renderedJson)
      : renderSections(sections);

  return (
    <div className="rp-page">
      <div className="rp-row rp-template-toolbar rp-noprint">
        <div>
          <h2 className="rp-title">Discharge Summary {summary.summaryNo}</h2>
          <p className="rp-muted">
            {summary.patient?.name} • UHID {summary.patient?.uhid} •{" "}
            <span className={`ds-status ds-status-${status}`}>
              {status.replace("_", " ")}
            </span>
          </p>
        </div>
        <span className="rp-spacer" />
        <button type="button" className="rp-btn" disabled={busy} onClick={onBack}>
          ← Back to list
        </button>
      </div>

      {error && <div className="rp-error rp-error-box rp-noprint">{error}</div>}
      {message && <div className="rp-ok rp-message rp-noprint">{message}</div>}

      {role === "NURSE" && status === "DRAFT" && summary.reviewRemark && (
        <div className="ds-banner rp-noprint">
          <b>Doctor's remark:</b> {summary.reviewRemark}
        </div>
      )}

      <div className="rp-template-workspace">
        <section className="rp-card rp-pad rp-noprint">
          <h3>Guided Questions</h3>

          <div className="rp-template-category-row">
            <div>
              <label className="rp-label">Admission date</label>
              <input
                type="date"
                className="rp-input"
                disabled={!roleCanEdit}
                value={meta.admissionDate}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, admissionDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="rp-label">Discharge date</label>
              <input
                type="date"
                className="rp-input"
                disabled={!roleCanEdit}
                value={meta.dischargeDate}
                onChange={(e) =>
                  setMeta((m) => ({ ...m, dischargeDate: e.target.value }))
                }
              />
            </div>
          </div>

          <label className="rp-label">Prepared / entered by</label>
          <input
            className="rp-input rp-mb"
            disabled={!roleCanEdit}
            value={meta.preparedBy}
            onChange={(e) =>
              setMeta((m) => ({ ...m, preparedBy: e.target.value }))
            }
            placeholder="Nurse name"
          />

          {sections.map((section, i) => {
            const editable = canEditSection(section);

            return (
              <div className="ds-section-card" key={section.id}>
                <div className="ds-section-head">
                  <h4>{section.heading}</h4>
                  {section.filledBy === "DOCTOR" && (
                    <span className="rp-tag">Doctor to complete</span>
                  )}
                </div>

                {section.fields.map((f, j) => {
                  const k = `${i}.${j}`;
                  const notice = notices[k];
                  const showText =
                    f.inputType !== "YES_NO_TEXT" || f.yes === true;

                  return (
                    <div className="ds-q" key={f.key}>
                      <label className="rp-label">{f.question}</label>
                      {f.helperText && (
                        <div className="ds-helper">{f.helperText}</div>
                      )}

                      {f.inputType === "YES_NO_TEXT" && (
                        <div className="ds-yesno">
                          <label>
                            <input
                              type="radio"
                              name={`yn-${k}`}
                              disabled={!editable}
                              checked={f.yes === true}
                              onChange={() => setField(i, j, { yes: true })}
                            />{" "}
                            Yes
                          </label>
                          <label>
                            <input
                              type="radio"
                              name={`yn-${k}`}
                              disabled={!editable}
                              checked={f.yes === false}
                              onChange={() => setField(i, j, { yes: false })}
                            />{" "}
                            No
                          </label>
                        </div>
                      )}

                      {showText && (
                        <textarea
                          className="rp-input ds-ta"
                          rows={3}
                          disabled={!editable}
                          value={f.value ?? ""}
                          onChange={(e) => {
                            setField(i, j, { value: e.target.value });
                            clearNotice(k);
                          }}
                          onBlur={(e) => checkSpelling(i, j, e.target.value)}
                          placeholder={
                            f.inputType === "YES_NO_TEXT" ? "Details" : ""
                          }
                        />
                      )}

                      {notice && (
                        <div className="ds-notice">
                          Auto-corrected:{" "}
                          {notice.changes
                            .map((c) => `${c.original} → ${c.corrected}`)
                            .join(", ")}{" "}
                          <button
                            type="button"
                            className="ds-link"
                            onClick={() => undoSpelling(i, j)}
                          >
                            Undo
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div className="rp-row rp-mt">
            {role === "NURSE" && status === "DRAFT" && (
              <>
                <button type="button" className="rp-btn" disabled={busy} onClick={save}>
                  Save Draft
                </button>
                <button
                  type="button"
                  className="rp-btn rp-btn-primary"
                  disabled={busy}
                  onClick={submit}
                >
                  Submit for Review
                </button>
              </>
            )}

            {role === "DOCTOR" && status === "PENDING_REVIEW" && (
              <>
                <button type="button" className="rp-btn" disabled={busy} onClick={save}>
                  Save Changes
                </button>
                <button
                  type="button"
                  className="rp-btn rp-btn-primary"
                  disabled={busy}
                  onClick={approve}
                >
                  Approve &amp; Finalize
                </button>
                <button
                  type="button"
                  className="rp-btn rp-btn-danger"
                  disabled={busy}
                  onClick={sendBack}
                >
                  Return to Nurse
                </button>
              </>
            )}
          </div>

          {!roleCanEdit && !locked && (
            <p className="rp-muted rp-mt">
              {role === "DOCTOR"
                ? "Waiting for the nurse to submit this summary."
                : "Submitted. Waiting for the doctor's review."}
            </p>
          )}
        </section>

        <section className="rp-template-live-preview">
          <DischargeDocument
            header={{
              centreName: summary.centreName,
              centreAddress: summary.centreAddress,
              centrePhone: summary.centrePhone,
              logoUrl: summary.logoUrl,
              documentTitle: summary.documentTitle,
            }}
            patient={summary.patient}
            doctor={summary.doctor}
            admissionDate={meta.admissionDate}
            dischargeDate={meta.dischargeDate}
            rendered={rendered}
            preparedBy={meta.preparedBy}
            approvedBy={summary.approvedBy}
            approved={locked}
            onPrint={locked ? () => window.print() : undefined}
          />
        </section>
      </div>
    </div>
  );
}