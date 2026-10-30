
import { useEffect, useState } from "react";
import {
  getReport,
  updateReport,
  sendForReview,
  approveReport,
  reopenReport,
  uploadReportImage,
  deleteReportImage,
  reportImageUrl,
  getDoctors,
  sendToDepartment,
  returnToDoctor,
} from "../api/ApiReporting";

import ImageViewer from "./ImageViewer";
import "../style/reports.css";

const parse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const CENTRE = {
  name: "YOUR CENTRE NAME",
  tagline: "X-Ray | CT-Scan | MRI | USG | Lab",
  address: "Address line, City - PIN",
  contact: "Phone: 0000000000 | email@example.com",
};

const fmt = (date) =>
  date
    ? new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "-";

function Formatted({ text, layout }) {
  const value = text || "";

  if (layout === "bullets") {
    return (
      <ul className="rp-bullets">
        {value
          .split("\n")
          .filter((line) => line.trim())
          .map((line, index) => (
            <li key={index}>{line}</li>
          ))}
      </ul>
    );
  }

  return (
    <div className={`rp-pre ${layout === "bold" ? "rp-bold" : ""}`}>
      {value}
    </div>
  );
}

/*
 * Normalize old and new template formats.
 *
 * New format: { id, heading, layout, content }
 * Old format: { key, title, type, layout }
 *
 * Every section receives a unique storage key.
 */
function normalizeSections(templateStructure) {
  const rawSections = parse(templateStructure, []);

  if (!Array.isArray(rawSections)) {
    return [];
  }

  return rawSections.map((section, index) => {
    const id =
      section.id ??
      section.key ??
      `section-${index}`;

    return {
      ...section,
      id: String(id),
      key: String(id),
      heading:
        section.heading ??
        section.title ??
        `Section ${index + 1}`,
      layout: section.layout ?? "paragraph",
      type: section.type ?? "text",
    };
  });
}

export default function ReportBuilder({
  reportId,
  onBack,
  reviewerMode = false,
  departmentMode = false,
}) {
  const [report, setReport] = useState(null);
  const [values, setValues] = useState({});
  const [doctors, setDoctors] = useState([]);
  const [reviewerId, setReviewerId] = useState("");
  const [comment, setComment] = useState("");
  const [filledBy, setFilledBy] = useState("");
  const [remark, setRemark] = useState("");
  const [viewer, setViewer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [loadError, setLoadError] = useState("");

  const load = async () => {
    try {
      setLoadError("");

      const result = await getReport(reportId);

      setReport(result);

      const savedValues = parse(result.contentJson, {});

      // Older versions could store all sections under "undefined".
      // That value cannot safely be assigned to any individual section.
      if (
        savedValues &&
        typeof savedValues === "object" &&
        !Array.isArray(savedValues)
      ) {
        delete savedValues.undefined;
        setValues(savedValues);
      } else {
        setValues({});
      }

      setComment(result.doctorComment || "");
      setReviewerId(result.reviewingDoctor?.id || "");
      setFilledBy(result.filledBy || "");
      setRemark(result.departmentRemark || "");
    } catch (error) {
      setLoadError(
        error?.response?.data?.message ||
          error.message ||
          "Unable to load report"
      );
    }
  };

  useEffect(() => {
    load();
    getDoctors()
      .then(setDoctors)
      .catch(() => {});
  }, [reportId]);

  const run = async (callback) => {
    setBusy(true);
    setMsg("");

    try {
      await callback();
    } catch (error) {
      setMsg(
        error?.response?.data?.message ||
          error.message ||
          "Something went wrong"
      );
    } finally {
      setBusy(false);
    }
  };

  if (loadError) {
    return (
      <div className="rp-page-md">
        <div className="rp-card rp-pad">
          <p className="rp-error">{loadError}</p>

          <div className="rp-row">
            <button className="rp-btn" onClick={onBack}>
              ← Back
            </button>

            <button
              className="rp-btn rp-btn-primary"
              onClick={load}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rp-page-md">
        <div className="rp-card rp-pad">
          Loading report...
        </div>
      </div>
    );
  }

  const sections = normalizeSections(report.templateStructure);
  const st = report.status;
  const locked = st === "APPROVED";

  const canApprove =
    !departmentMode &&
    (st === "RETURNED_TO_DOCTOR" ||
      (reviewerMode && st === "SENT_FOR_REVIEW"));

  const editable =
    !locked &&
    (departmentMode
      ? st === "SENT_TO_DEPARTMENT"
      : reviewerMode
        ? st === "SENT_FOR_REVIEW" ||
          st === "RETURNED_TO_DOCTOR"
        : st !== "SENT_TO_DEPARTMENT");

  const set = (key, value) => {
    setValues((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const content = () => JSON.stringify(values);

  const save = () =>
    run(async () => {
      const result = await updateReport(reportId, {
        contentJson: content(),
      });

      setReport(result);
      setMsg("Saved");
    });

  const send = () =>
    run(async () => {
      if (!reviewerId) {
        throw new Error("Choose a reviewing doctor");
      }

      await updateReport(reportId, {
        contentJson: content(),
      });

      const result = await sendForReview(
        reportId,
        Number(reviewerId)
      );

      setReport(result);
      setMsg("Sent for review");
    });

  const approve = () =>
    run(async () => {
      await updateReport(reportId, {
        contentJson: content(),
      });

      const result = await approveReport(reportId, comment);

      setReport(result);
      setMsg("Approved");
    });

  const reopen = () =>
    run(async () => {
      const result = await reopenReport(reportId);

      setReport(result);
      setMsg("Reopened as draft");
    });

  const sendDept = () =>
    run(async () => {
      await updateReport(reportId, {
        contentJson: content(),
      });

      const result = await sendToDepartment(
        reportId,
        report.category
      );

      setReport(result);
      setMsg("Sent to department");
    });

  const sendBack = () =>
    run(async () => {
      if (!filledBy.trim()) {
        throw new Error("Enter your name");
      }

      await updateReport(reportId, {
        contentJson: content(),
      });

      const result = await returnToDoctor(
        reportId,
        filledBy,
        remark
      );

      setReport(result);
      setMsg("Sent back to doctor");
    });

  const upload = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    run(async () => {
      for (const file of files) {
        await uploadReportImage(reportId, file, "");
      }

      await load();
      setMsg("Images uploaded");
    });
  };

  const removeImage = (imageId) =>
    run(async () => {
      await deleteReportImage(imageId);
      await load();
      setMsg("Image deleted");
    });

  const imgs = (report.images || []).map((image) => ({
    id: image.id,
    url: reportImageUrl(image.id),
    caption: image.caption,
    fileName: image.fileName,
  }));

  const signer = report.reviewingDoctor || report.referringDoctor;

  const renderedSections = sections.length
    ? sections
    : [
        {
          id: "freeText",
          key: "freeText",
          heading: "Report",
          type: "text",
          layout: "paragraph",
          fields: [],
        },
      ];

  return (
    <div className="rp-page-md">
      <div className="rp-row rp-mb rp-noprint">
        <button className="rp-btn" onClick={onBack}>
          ← Back
        </button>

        <span className="rp-spacer" />

        <button
          className="rp-btn rp-btn-primary"
          onClick={() => window.print()}
        >
          Print
        </button>
      </div>

      <div className="rp-sheet">
        <div className="rp-letterhead">
          <div className="rp-lh-name">{CENTRE.name}</div>
          <div className="rp-lh-tag">{CENTRE.tagline}</div>
          <div className="rp-lh-small">{CENTRE.address}</div>
          <div className="rp-lh-small">{CENTRE.contact}</div>
        </div>

        <div className="rp-patient">
          <div>
            <div className="rp-pname">
              {report.patient?.name}
            </div>

            <div>UHID: {report.patient?.uhid}</div>

            {report.patient?.gender && (
              <div>Sex: {report.patient.gender}</div>
            )}

            {report.patient?.age && (
              <div>Age: {report.patient.age}</div>
            )}
          </div>

          <div>
            <div>
              Report No: <b>{report.reportNo}</b>
            </div>

            <div>Visit: {report.visitType || "-"}</div>

            <div>
              Ref. by:{" "}
              <b>{report.referringDoctor?.name || "-"}</b>
            </div>
          </div>

          <div>
            <div>
              <b>Registered on:</b> {fmt(report.createdAt)}
            </div>

            <div>
              <b>Reported on:</b> {fmt(report.approvedAt)}
            </div>
          </div>
        </div>

        <h2 className="rp-test-title">{report.testName}</h2>

        <div className="rp-noprint rp-muted rp-mb">
          {report.category} · Status:{" "}
          <span className={`rp-badge rp-st-${st}`}>
            {st}
          </span>

          {report.department &&
            ` · Department: ${report.department}`}
        </div>

        {sections.length === 0 && (
          <p className="rp-noprint rp-muted">
            This template has no sections. Showing a free-text box.
          </p>
        )}

        {renderedSections.map((section) => (
          <div className="rp-section" key={section.id}>
            <h3>{section.heading}</h3>

            {section.type === "fields" ? (
              <div className="rp-scroll">
                <table className="rp-result-table">
                  <thead>
                    <tr>
                      <th>Test</th>
                      <th>Result</th>
                      <th>Unit</th>
                      <th>Normal range</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(section.fields || []).map((field) => (
                      <tr key={field.key}>
                        <td>{field.label}</td>

                        <td>
                          <input
                            className="rp-input rp-cell"
                            disabled={!editable}
                            value={values[field.key] ?? ""}
                            onChange={(event) =>
                              set(field.key, event.target.value)
                            }
                          />
                        </td>

                        <td>{field.unit}</td>
                        <td>{field.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
                <textarea
                  className={`rp-input rp-noprint ${
                    section.layout === "bullets"
                      ? "rp-ta-tall"
                      : "rp-ta"
                  }`}
                  disabled={!editable}
                  value={values[section.key] ?? ""}
                  onChange={(event) =>
                    set(section.key, event.target.value)
                  }
                  placeholder={
                    section.layout === "bullets"
                      ? "Enter one bullet point per line"
                      : `Enter ${section.heading.toLowerCase()}`
                  }
                />

                {section.layout === "bullets" && (
                  <div className="rp-hint rp-noprint">
                    Enter one bullet point per line.
                  </div>
                )}

                <div className="rp-print-only">
                  <Formatted
                    text={values[section.key] ?? ""}
                    layout={section.layout}
                  />
                </div>
              </>
            )}
          </div>
        ))}

        {(imgs.length > 0 || editable) && (
          <div className="rp-section">
            <h3>Images</h3>

            <div className="rp-images">
              {imgs.map((image, index) => (
                <div className="rp-img-wrap" key={image.id}>
                  <img
                    src={image.url}
                    alt={image.fileName || "Report image"}
                    onClick={() => setViewer(index)}
                  />

                  {editable && (
                    <button
                      type="button"
                      className="rp-img-del rp-noprint"
                      onClick={() => removeImage(image.id)}
                      disabled={busy}
                      title="Delete image"
                    >
                      ×
                    </button>
                  )}

                  {image.caption && (
                    <div className="rp-hint">
                      {image.caption}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {editable && (
              <div className="rp-mt rp-noprint">
                <label className="rp-label">
                  Upload report images
                </label>

                <input
                  className="rp-input"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={busy}
                  onChange={upload}
                />
              </div>
            )}
          </div>
        )}

        {report.departmentRemark && (
          <div className="rp-section">
            <h3>Department remark</h3>

            <p>
              {report.departmentRemark}
              {report.filledBy && ` (by ${report.filledBy})`}
            </p>
          </div>
        )}

        {canApprove && (
          <div className="rp-section rp-noprint">
            <label className="rp-label">
              Doctor's comment
            </label>

            <textarea
              className="rp-input rp-ta-sm"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </div>
        )}

        {locked && report.doctorComment && (
          <div className="rp-section">
            <h3>Doctor's comment</h3>
            <p>{report.doctorComment}</p>
          </div>
        )}

        {locked && signer && (
          <div className="rp-sign">
            <b>{signer.name}</b>

            {signer.qualification && (
              <div>{signer.qualification}</div>
            )}

            {signer.registrationNo && (
              <div>Reg. No: {signer.registrationNo}</div>
            )}
          </div>
        )}
      </div>

      <div className="rp-actions rp-noprint">
        {departmentMode && editable && (
          <>
            <div>
              <label className="rp-label">Your name *</label>

              <input
                className="rp-input"
                value={filledBy}
                onChange={(event) =>
                  setFilledBy(event.target.value)
                }
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="rp-label">
                Remark (optional)
              </label>

              <input
                className="rp-input"
                value={remark}
                onChange={(event) =>
                  setRemark(event.target.value)
                }
                placeholder="Enter remark"
              />
            </div>

            <div className="rp-row">
              <button
                className="rp-btn"
                disabled={busy}
                onClick={save}
              >
                Save
              </button>

              <button
                className="rp-btn rp-btn-primary"
                disabled={busy}
                onClick={sendBack}
              >
                Send back to doctor
              </button>
            </div>
          </>
        )}

        {!departmentMode && !reviewerMode && editable && (
          <>
            <button
              className="rp-btn"
              disabled={busy}
              onClick={save}
            >
              Save
            </button>

            <button
              className="rp-btn rp-btn-primary"
              disabled={busy}
              onClick={sendDept}
            >
              Send to {report.category} department
            </button>

            <div>
              <label className="rp-label">
                Reviewing doctor
              </label>

              <select
                className="rp-input"
                value={reviewerId}
                onChange={(event) =>
                  setReviewerId(event.target.value)
                }
              >
                <option value="">
                  Select reviewing doctor
                </option>

                {doctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.doctorName || doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="rp-btn rp-btn-primary"
              disabled={busy}
              onClick={send}
            >
              Send for review
            </button>
          </>
        )}

        {reviewerMode && editable && (
          <button
            className="rp-btn"
            disabled={busy}
            onClick={save}
          >
            Save edits
          </button>
        )}

        {canApprove && (
          <button
            className="rp-btn rp-btn-primary"
            disabled={busy}
            onClick={approve}
          >
            Approve
          </button>
        )}

        {locked && !departmentMode && (
          <button
            className="rp-btn rp-btn-danger"
            disabled={busy}
            onClick={reopen}
          >
            Reopen as draft
          </button>
        )}

        {!departmentMode && st === "SENT_TO_DEPARTMENT" && (
          <p className="rp-warn">
            Waiting for the {report.department} department.
          </p>
        )}

        {msg && (
          <p
            className={
              [
                "Saved",
                "Approved",
                "Images uploaded",
                "Image deleted",
              ].includes(msg) ||
              msg.startsWith("Sent") ||
              msg.startsWith("Reopened")
                ? "rp-ok"
                : "rp-error"
            }
          >
            {busy ? "Processing..." : msg}
          </p>
        )}
      </div>

      {viewer !== null && (
        <ImageViewer
          images={imgs}
          startIndex={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
