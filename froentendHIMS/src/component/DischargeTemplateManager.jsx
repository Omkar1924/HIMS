import { useEffect, useState } from "react";

import {
  getDischargeTemplates,
  createDischargeTemplate,
  updateDischargeTemplate,
  deleteDischargeTemplate,
  dsErrMsg,
} from "../api/ApiDischarge";

import { getDoctors, getEmploys } from "../api/ApiPatient";

import DischargeSectionsEditor from "./DischargeSectionsEditor";
import DischargeDocument from "./DischargeDocument";
import {
  defaultSections,
  parseSections,
  serializeSections,
  templateSample,
} from "./DischargeUtils";

import "../style/reports.css";
import "../style/templateManager.css";
import "../style/discharge.css";

const EMPTY_TEMPLATE = {
  name: "",
  templateCode: "",
  documentTitle: "PATIENT DISCHARGE SUMMARY",
  centreName: "",
  centreAddress: "",
  centrePhone: "",
  logoUrl: "",
  layoutJson: "{}",
  active: true,
  createdBy: "",
};

const CREATED_BY_TYPES = [
  { value: "DOCTOR", label: "Doctor" },
  { value: "EMPLOYEE", label: "Employee" },
];

const SAMPLE_PATIENT = {
  name: "[Patient name]",
  uhid: "[UHID]",
  age: "[Age]",
  phone: "[Contact]",
};
const SAMPLE_DOCTOR = { name: "[Consultant]" };

export default function DischargeTemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState({ ...EMPTY_TEMPLATE });
  const [sections, setSections] = useState(defaultSections);
  const [selectedId, setSelectedId] = useState(null);
  const [view, setView] = useState("list");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [employs, setEmploys] = useState([]);
  const [createdByType, setCreatedByType] = useState(null);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  const loadTemplates = async () => {
    try {
      setTemplates(await getDischargeTemplates(true));
    } catch (e) {
      setError(dsErrMsg(e));
    }
  };

  const loadPeople = async () => {
    try {
      const [d, e] = await Promise.all([getDoctors(), getEmploys()]);
      setDoctors(d);
      setEmploys(e);
    } catch (err) {
      // Non-fatal: dropdowns will be empty if fetch fails
      console.warn("Could not load doctors/employs", err);
    }
  };

  useEffect(() => {
    loadTemplates();
    loadPeople();
  }, []);

  const updateField = (field, value) =>
    setDraft((prev) => ({ ...prev, [field]: value }));

  const getAvailablePeople = () => {
    if (createdByType === "DOCTOR") {
      return doctors
        .map((doc) => ({ id: doc.id, name: doc.doctorName || doc.name || "" }))
        .filter((p) => p.name);
    }
    if (createdByType === "EMPLOYEE") {
      return employs
        .map((emp) => ({
          id: emp.id,
          name: [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.userName || "",
        }))
        .filter((p) => p.name);
    }
    return [];
  };

  const editTemplate = (template) => {
    setSelectedId(template.id);
    setDraft({ ...EMPTY_TEMPLATE, ...template });
    setSections(parseSections(template.sectionsJson));
    // Restore which role type and person was selected when the template was saved.
    if (template.doctor) {
      setCreatedByType("DOCTOR");
      setSelectedPersonId(template.doctor.id);
    } else if (template.employee) {
      setCreatedByType("EMPLOYEE");
      setSelectedPersonId(template.employee.id);
    } else {
      setCreatedByType(null);
      setSelectedPersonId(null);
    }
    setError("");
    setMessage("");
    setView("editor");
  };

  const newTemplate = () => {
    setSelectedId(null);
    setDraft({ ...EMPTY_TEMPLATE });
    setSections(defaultSections());
    setCreatedByType(null);
    setSelectedPersonId(null);
    setError("");
    setMessage("");
    setView("editor");
  };

  const backToList = () => {
    if (loading) return;
    setView("list");
    setError("");
  };

  const saveTemplate = async (replace = false) => {
    setError("");
    setMessage("");

    if (!draft.name?.trim()) {
      setError("Template name is required.");
      return;
    }
    if (!draft.createdBy?.trim()) {
      setError("Please select who created the template.");
      return;
    }
    if (sections.length === 0) {
      setError("Add at least one section.");
      return;
    }
    if (sections.some((s) => !s.heading?.trim())) {
      setError("Every section needs a heading.");
      return;
    }
    if (sections.some((s) => s.fields.some((f) => !f.question?.trim()))) {
      setError("Every question needs text.");
      return;
    }

    const payload = {
      ...draft,
      sectionsJson: serializeSections(sections),
      // Send entity references so the backend can set doctor/employee relations.
      doctor: createdByType === "DOCTOR" && selectedPersonId
        ? { id: Number(selectedPersonId) }
        : null,
      employee: createdByType === "EMPLOYEE" && selectedPersonId
        ? { id: Number(selectedPersonId) }
        : null,
    };
    const isEditing = selectedId != null;

    try {
      setLoading(true);

      if (isEditing) {
        await updateDischargeTemplate(selectedId, payload, replace);
      } else {
        await createDischargeTemplate(payload, replace);
      }

      await loadTemplates();
      setView("list");
      setMessage(
        isEditing
          ? "Template updated successfully."
          : "Template created successfully.",
      );
    } catch (e) {
      if (
        e?.response?.status === 409 &&
        !replace &&
        window.confirm("A template with this name already exists. Replace it?")
      ) {
        setLoading(false);
        await saveTemplate(true);
        return;
      }
      setError(dsErrMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async (template) => {
    if (
      !window.confirm(
        `Deactivate "${template.name}"? Existing summaries keep working; nurses will no longer see it.`,
      )
    )
      return;

    try {
      setLoading(true);
      setError("");
      await deleteDischargeTemplate(template.id);
      await loadTemplates();
      setMessage("Template deactivated.");
    } catch (e) {
      setError(dsErrMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const restore = async (template) => {
    try {
      setLoading(true);
      setError("");
      await updateDischargeTemplate(template.id, { ...template, active: true });
      await loadTemplates();
      setMessage("Template restored.");
    } catch (e) {
      setError(dsErrMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const availablePeople = getAvailablePeople();

  const selectedPerson = availablePeople.find((p) => p.id === selectedPersonId);

  return (
    <div className="rp-page">
      <h1 className="rp-title">Discharge Template Manager</h1>

      {view === "list" && (
        <>
          <div className="rp-row rp-template-toolbar">
            <span className="rp-spacer" />
            <button
              type="button"
              className="rp-btn rp-btn-primary"
              onClick={newTemplate}
            >
              + New Template
            </button>
          </div>

          {error && <div className="rp-error rp-error-box">{error}</div>}
          {message && <div className="rp-ok rp-message">{message}</div>}

          <div className="rp-template-list rp-card rp-pad">
            <h3>Saved Templates ({templates.length})</h3>

            {templates.length === 0 ? (
              <div className="rp-empty">No templates found.</div>
            ) : (
              <div className="rp-scroll">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Code</th>
                      <th>Status</th>
                      <th className="rp-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => (
                      <tr key={t.id}>
                        <td>{t.name}</td>
                        <td>{t.templateCode || "—"}</td>
                        <td>
                          <span
                            className={`rp-badge ${
                              t.active === false ? "rp-badge-off" : "rp-badge-on"
                            }`}
                          >
                            {t.active === false ? "Inactive" : "Active"}
                          </span>
                        </td>
                        <td className="rp-right">
                          <button
                            type="button"
                            className="rp-btn"
                            onClick={() => editTemplate(t)}
                          >
                            Edit
                          </button>{" "}
                          {t.active === false ? (
                            <button
                              type="button"
                              className="rp-btn"
                              disabled={loading}
                              onClick={() => restore(t)}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="rp-btn rp-btn-danger"
                              disabled={loading}
                              onClick={() => deactivate(t)}
                            >
                              Deactivate
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

      {view === "editor" && (
        <>
          <div className="rp-row rp-template-toolbar">
            <div>
              <h2 className="rp-title">
                {selectedId != null ? "Edit Template" : "Create New Template"}
              </h2>
              <p className="rp-muted">
                Configure your template and preview it side by side.
              </p>
            </div>

            <span className="rp-spacer" />

            <button
              type="button"
              className="rp-btn"
              disabled={loading}
              onClick={backToList}
            >
              ← Back to Templates
            </button>
          </div>

          {error && <div className="rp-error rp-error-box">{error}</div>}

          <div className="rp-template-workspace">
            <section className="rp-card rp-pad">
              <h3>Template Details</h3>

              <label className="rp-label" htmlFor="dt-name">
                Template name *
              </label>
              <input
                id="dt-name"
                className="rp-input rp-mb"
                value={draft.name ?? ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter template name"
              />

              <div className="rp-template-category-row">
                <div>
                  <label className="rp-label" htmlFor="dt-title">
                    Document title
                  </label>
                  <input
                    id="dt-title"
                    className="rp-input rp-mb"
                    value={draft.documentTitle ?? ""}
                    onChange={(e) => updateField("documentTitle", e.target.value)}
                  />
                </div>
                <div>
                  <label className="rp-label" htmlFor="dt-code">
                    Template code
                  </label>
                  <input
                    id="dt-code"
                    className="rp-input rp-mb"
                    value={draft.templateCode ?? ""}
                    onChange={(e) => updateField("templateCode", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="rp-template-category-row">
                <div>
                  <label className="rp-label" htmlFor="dt-centre">
                    Centre name
                  </label>
                  <input
                    id="dt-centre"
                    className="rp-input rp-mb"
                    value={draft.centreName ?? ""}
                    onChange={(e) => updateField("centreName", e.target.value)}
                    placeholder="Hospital name"
                  />
                </div>
                <div>
                  <label className="rp-label" htmlFor="dt-phone">
                    Centre phone
                  </label>
                  <input
                    id="dt-phone"
                    className="rp-input rp-mb"
                    value={draft.centrePhone ?? ""}
                    onChange={(e) => updateField("centrePhone", e.target.value)}
                    placeholder="Contact details"
                  />
                </div>
              </div>

              <label className="rp-label" htmlFor="dt-address">
                Centre address
              </label>
              <input
                id="dt-address"
                className="rp-input rp-mb"
                value={draft.centreAddress ?? ""}
                onChange={(e) => updateField("centreAddress", e.target.value)}
                placeholder="Hospital address"
              />

              {/* Created by: role type + person selector side by side */}
              <div className="rp-created-by-row">
                <div>
                  <label className="rp-label" htmlFor="dt-created-by-type">
                    Template created by *
                  </label>
                  <div className="rp-category-menu rp-mb" id="dt-created-by-type" role="listbox" style={{ position: "relative" }}>
                    {CREATED_BY_TYPES.map((o) => (
                      <button
                        type="button"
                        key={o.value}
                        className={`rp-category-option${createdByType === o.value ? " active" : ""}`}
                        onClick={() => {
                          setCreatedByType(o.value);
                          setSelectedPersonId(null);
                          updateField("createdBy", "");
                        }}
                        role="option"
                        aria-selected={createdByType === o.value}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {createdByType && (
                  <div>
                    <label className="rp-label" htmlFor="dt-created-by-person">
                      Select {CREATED_BY_TYPES.find((o) => o.value === createdByType)?.label}
                    </label>
                    <div className="rp-category-menu rp-mb" id="dt-created-by-person" role="listbox" style={{ position: "relative" }}>
                      {availablePeople.map((person) => (
                        <button
                          type="button"
                          key={person.id}
                          className={`rp-category-option${selectedPersonId === person.id ? " active" : ""}`}
                          onClick={() => {
                            setSelectedPersonId(person.id);
                            updateField("createdBy", person.name);
                          }}
                          role="option"
                          aria-selected={selectedPersonId === person.id}
                        >
                          {person.name}
                        </button>
                      ))}
                      {availablePeople.length === 0 && (
                        <div className="rp-category-option" style={{ color: "#64748b", cursor: "default" }}>
                          No {CREATED_BY_TYPES.find((o) => o.value === createdByType)?.label.toLowerCase()}s found
                        </div>
                      )}
                    </div>
                    {draft.createdBy && (
                      <p className="rp-muted rp-mb">
                        Template recorded as created by {draft.createdBy}.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <h3 className="rp-mt">Report Sections</h3>
              <p className="rp-muted">
                Each section has one or more guided questions. The nurse's
                answers are placed into the sentence you define.
              </p>

              <DischargeSectionsEditor
                sections={sections}
                onChange={setSections}
              />

              <div className="rp-row rp-mt">
                <button
                  type="button"
                  className="rp-btn rp-btn-primary"
                  disabled={loading}
                  onClick={() => saveTemplate(false)}
                >
                  {loading ? "Saving..." : "Save Template"}
                </button>
                <button
                  type="button"
                  className="rp-btn"
                  disabled={loading}
                  onClick={backToList}
                >
                  Cancel
                </button>
              </div>
            </section>

            <section className="rp-template-live-preview">
              <DischargeDocument
                header={draft}
                patient={SAMPLE_PATIENT}
                doctor={SAMPLE_DOCTOR}
                admissionDate=""
                dischargeDate=""
                rendered={templateSample(sections)}
                preparedBy=""
                onLogoChange={(logoUrl) => updateField("logoUrl", logoUrl)}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
