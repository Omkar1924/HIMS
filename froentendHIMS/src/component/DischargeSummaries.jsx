import { useEffect, useState } from "react";

import {
  getDischargeSummaries,
  getDischargeTemplates,
  createDischargeSummary,
  deleteDischargeSummary,
  dsErrMsg,
} from "../api/ApiDischarge";

import { getPatients, getDoctors } from "../api/ApiPatient";

import DischargeSummaryEditor from "./DischargeSummaryEditor";

import "../style/reports.css";
import "../style/templateManager.css";
import "../style/discharge.css";

const EMPTY_FORM = {
  templateId: "",
  patientUhid: "",
  doctorId: "",
  admissionDate: "",
  dischargeDate: "",
  preparedBy: "",
};

// role: "NURSE" creates and fills summaries, "DOCTOR" reviews and approves them.
export default function DischargeSummaries({ role = "NURSE" }) {
  const [view, setView] = useState("list"); // list | create | editor
  const [summaries, setSummaries] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [statusFilter, setStatusFilter] = useState(
    role === "DOCTOR" ? "PENDING_REVIEW" : "",
  );
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadSummaries = async () => {
    try {
      setSummaries(
        await getDischargeSummaries(statusFilter ? { status: statusFilter } : {}),
      );
    } catch (e) {
      setError(dsErrMsg(e));
    }
  };

  useEffect(() => {
    loadSummaries();
  }, [statusFilter, view]);

  useEffect(() => {
    (async () => {
      try {
        const [templatesList, patientsList, doctorsList] = await Promise.all([
          getDischargeTemplates(false),
          getPatients(),
          getDoctors(),
        ]);
        setTemplates(templatesList);
        setPatients(patientsList);
        setDoctors(doctorsList);
      } catch (e) {
        setError(dsErrMsg(e));
      }
    })();
  }, []);

  const updateForm = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const patientFullName = (p) =>
    [p.firstName, p.middleName, p.lastName]
      .filter((n) => n != null && String(n).trim())
      .map((n) => String(n).trim())
      .join(" ") || p.name || "";

  const selectPatient = (p) => {
    setSelectedPatient(p);
    setPatientSearch("");
    updateForm("patientUhid", p.uhid);
    // Prefer the patient's consultant doctor from the patient record.
    const doctorId = p.doctor?.id ?? p.doctorId;
    if (doctorId && !form.doctorId) updateForm("doctorId", String(doctorId));
  };

  const clearPatientSearch = () => {
    setSelectedPatient(null);
    setPatientSearch("");
    updateForm("patientUhid", "");
    updateForm("doctorId", "");
  };

  // Only search while the user is typing; once a patient is chosen, the box
  // shows the chosen patient (UHID + name) instead of results.
  const searchTerm = selectedPatient ? "" : patientSearch.toLowerCase().trim();
  const patientMatches = searchTerm
    ? patients.filter(
        (p) =>
          String(p.uhid ?? "").toLowerCase().includes(searchTerm) ||
          patientFullName(p).toLowerCase().includes(searchTerm),
      )
    : [];

  const openSummary = (id) => {
    setSelectedId(id);
    setError("");
    setMessage("");
    setView("editor");
  };

  const createSummary = async () => {
    setError("");

    if (!form.templateId) {
      setError("Choose a template.");
      return;
    }
    if (!selectedPatient || !form.patientUhid.trim()) {
      setError("Search for and select a patient.");
      return;
    }
    if (!form.doctorId) {
      setError("Choose the consultant doctor.");
      return;
    }

    try {
      setLoading(true);
      const created = await createDischargeSummary({
        templateId: Number(form.templateId),
        patientUhid: form.patientUhid.trim(),
        doctorId: Number(form.doctorId),
        admissionDate: form.admissionDate || null,
        dischargeDate: form.dischargeDate || null,
        preparedBy: form.preparedBy,
      });
      setForm({ ...EMPTY_FORM });
      setSelectedPatient(null);
      setPatientSearch("");
      openSummary(created.id);
    } catch (e) {
      setError(dsErrMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const removeSummary = async (s) => {
    if (!window.confirm(`Delete summary ${s.summaryNo}?`)) return;
    try {
      setLoading(true);
      setError("");
      await deleteDischargeSummary(s.id);
      await loadSummaries();
      setMessage("Summary deleted.");
    } catch (e) {
      setError(dsErrMsg(e));
    } finally {
      setLoading(false);
    }
  };

  if (view === "editor") {
    return (
      <DischargeSummaryEditor
        summaryId={selectedId}
        role={role}
        onBack={() => setView("list")}
      />
    );
  }

  return (
    <div className="rp-page">
      <h1 className="rp-title">
        Discharge Summaries {role === "DOCTOR" ? "— Doctor Review" : ""}
      </h1>

      {view === "list" && (
        <>
          <div className="rp-row rp-template-toolbar">
            <div className="rp-filter-control">
              <label className="rp-label" htmlFor="ds-status">
                Status
              </label>
              <select
                id="ds-status"
                className="rp-input"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="PENDING_REVIEW">Pending review</option>
                <option value="APPROVED">Approved</option>
              </select>
            </div>

            <span className="rp-spacer" />

            {role === "NURSE" && (
              <button
                type="button"
                className="rp-btn rp-btn-primary"
                onClick={() => {
                  setError("");
                  setView("create");
                }}
              >
                + New Discharge Summary
              </button>
            )}
          </div>

          {error && <div className="rp-error rp-error-box">{error}</div>}
          {message && <div className="rp-ok rp-message">{message}</div>}

          <div className="rp-template-list rp-card rp-pad">
            <h3>Summaries ({summaries.length})</h3>

            {summaries.length === 0 ? (
              <div className="rp-empty">No discharge summaries found.</div>
            ) : (
              <div className="rp-scroll">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>No.</th>
                      <th>Patient</th>
                      <th>Doctor</th>
                      <th>Status</th>
                      <th className="rp-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((s) => (
                      <tr key={s.id}>
                        <td>{s.summaryNo}</td>
                        <td>
                          {s.patient?.name}
                          <br />
                          <small>{s.patient?.uhid}</small>
                        </td>
                        <td>{s.doctor?.name}</td>
                        <td>
                          <span className={`ds-status ds-status-${s.status}`}>
                            {s.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="rp-right">
                          <button
                            type="button"
                            className="rp-btn"
                            onClick={() => openSummary(s.id)}
                          >
                            Open
                          </button>{" "}
                          {role === "NURSE" && s.status !== "APPROVED" && (
                            <button
                              type="button"
                              className="rp-btn rp-btn-danger"
                              disabled={loading}
                              onClick={() => removeSummary(s)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {view === "create" && (
        <div className="rp-card rp-pad" style={{ maxWidth: 620 }}>
          <h3>New Discharge Summary</h3>

          {error && <div className="rp-error rp-error-box">{error}</div>}

          <label className="rp-label" htmlFor="ds-template">
            Template *
          </label>
          <select
            id="ds-template"
            className="rp-input rp-mb"
            value={form.templateId}
            onChange={(e) => updateForm("templateId", e.target.value)}
          >
            <option value="">Select...</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <label className="rp-label" htmlFor="ds-patient-search">
            Patient *
          </label>
          <div className="rp-patient-wrap">
            <input
              id="ds-patient-search"
              className="rp-input rp-mb"
              value={
                selectedPatient
                  ? `${selectedPatient.uhid} — ${patientFullName(selectedPatient)}`
                  : patientSearch
              }
              onChange={selectedPatient ? undefined : (e) => setPatientSearch(e.target.value)}
              onClick={selectedPatient ? clearPatientSearch : undefined}
              readOnly={!!selectedPatient}
              placeholder={selectedPatient ? "" : "Search by UHID or patient name"}
            />
            {patientMatches.length > 0 && (
              <div className="rp-category-menu rp-patient-menu" role="listbox">
                {patientMatches.map((p) => (
                  <button
                    key={p.uhid}
                    type="button"
                    role="option"
                    className="rp-category-option rp-patient-option"
                    onClick={() => selectPatient(p)}
                  >
                    <div className="rp-pname">{patientFullName(p)}</div>
                    <div className="rp-dim">UHID {p.uhid}</div>
                  </button>
                ))}
              </div>
            )}
            {searchTerm && patientMatches.length === 0 && (
              <div className="rp-dim">No matching patients.</div>
            )}
          </div>

          <div className="rp-template-category-row">
            <div>
              <label className="rp-label">Admission date</label>
              <input
                type="date"
                className="rp-input"
                value={form.admissionDate}
                onChange={(e) => updateForm("admissionDate", e.target.value)}
              />
            </div>
            <div>
              <label className="rp-label">Discharge date</label>
              <input
                type="date"
                className="rp-input"
                value={form.dischargeDate}
                onChange={(e) => updateForm("dischargeDate", e.target.value)}
              />
            </div>
          </div>

          <label className="rp-label" htmlFor="ds-doctor">
            Consultant doctor *
          </label>
          <select
            id="ds-doctor"
            className="rp-input rp-mb"
            value={form.doctorId}
            onChange={(e) => updateForm("doctorId", e.target.value)}
          >
            <option value="">Select doctor...</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.doctorName || d.name}
                {d.qualification ? ` (${d.qualification})` : ""}
              </option>
            ))}
          </select>

          <label className="rp-label" htmlFor="ds-nurse">
            Prepared / entered by
          </label>
          <input
            id="ds-nurse"
            className="rp-input rp-mb"
            value={form.preparedBy}
            onChange={(e) => updateForm("preparedBy", e.target.value)}
            placeholder="Nurse name"
          />

          <div className="rp-row rp-mt">
            <button
              type="button"
              className="rp-btn rp-btn-primary"
              disabled={loading}
              onClick={createSummary}
            >
              {loading ? "Creating..." : "Create & Continue"}
            </button>
            <button
              type="button"
              className="rp-btn"
              disabled={loading}
              onClick={() => setView("list")}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}