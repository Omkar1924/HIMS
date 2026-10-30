
import { useEffect, useMemo, useState } from "react";
import {
  getTemplates,
  getDoctors,
  searchPatients,
  createReport,
} from "../api/ApiReporting";
import ReportBuilder from "./ReportBuilder";
import TemplatePreview from "./TemplatePreview";
import SectionsEditor from "./SectionsEditor";
import SaveAsTemplate from "./SaveAsTemplate";
import {
  CATEGORIES,
  guessCategory,
  parseSections,
  patientName,
  serializeSections,
  errMsg,
} from "./reportUtils";
import "../style/reports.css";
import "../style/templateManager.css";

export default function DoctorReports() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [patient, setPatient] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState("");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [sections, setSections] = useState([]);
  const [category, setCategory] = useState("");
  const [testName, setTestName] = useState("");
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTemplates = () =>
    getTemplates()
      .then((data) =>
        setTemplates(
          Array.isArray(data)
            ? data
            : data?.templates ?? data?.content ?? data?.data ?? []
        )
      )
      .catch((e) => setError(errMsg(e)));

  useEffect(() => {
    getDoctors()
      .then((data) => setDoctors(Array.isArray(data) ? data : []))
      .catch(() => setDoctors([]));

    loadTemplates();
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((t) => String(t.id) === templateId) ?? null,
    [templates, templateId]
  );

  const chooseTemplate = (id) => {
    setTemplateId(id);

    const template = templates.find((item) => String(item.id) === id);

    if (!template) {
      setSections([]);
      setCategory("");
      setTestName("");
      return;
    }

    setSections(
      parseSections(
        template.sectionsJson ??
          template.templateStructure ??
          template.structureJson ??
          template.structure
      )
    );

    setCategory(guessCategory(template.category));
    setTestName(template.testName || template.name || "");
  };

  const search = async (event) => {
    event.preventDefault();
    setError("");

    if (!query.trim()) {
      setError("Enter a patient name or UHID.");
      return;
    }

    try {
      setLoading(true);
      const data = await searchPatients(query.trim());
      setResults(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const create = async () => {
    setError("");

    if (!patient || !selectedTemplate) {
      setError("Please select a patient and template.");
      return;
    }

    if (!category) {
      setError("Choose the department (Radiology or Lab).");
      return;
    }

    if (sections.some((section) => !section.heading?.trim())) {
      setError("Every section needs a heading.");
      return;
    }

    try {
      setLoading(true);

      const report = await createReport({
        templateId: selectedTemplate.id,
        category,
        testName:
          testName.trim() ||
          selectedTemplate.testName ||
          selectedTemplate.name,
        patientUhid: patient.uhid,
        referringDoctorId: doctorId ? Number(doctorId) : null,
        contentJson: serializeSections(sections),
        createdBy: "doctor",
      });

      if (!report?.id) {
        throw new Error("The server did not return a report ID.");
      }

      setReportId(report.id);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    if (!selectedTemplate) {
      setError("Please select a report template before printing.");
      return;
    }

    if (!patient) {
      setError("Please select a patient before printing.");
      return;
    }

    setError("");

    // Print CSS targets only the report preview.
    window.print();
  };

  if (reportId) {
    return (
      <ReportBuilder
        reportId={reportId}
        onBack={() => setReportId(null)}
      />
    );
  }

  const previewTemplate = selectedTemplate
    ? {
        ...selectedTemplate,
        category: category || selectedTemplate.category,
        testName:
          testName || selectedTemplate.testName || selectedTemplate.name,
      }
    : null;

  return (
    <div className="rp-page rp-doctor-reports-page">
      <header className="rp-report-heading rp-noprint">
        <div>
          <h1 className="rp-title">Doctor Reports</h1>
          <p className="rp-muted">
            Select a patient and a saved template, adjust or add sections,
            then create the report.
          </p>
        </div>
      </header>

      {error && (
        <div className="rp-error rp-error-box rp-noprint">
          {error}
        </div>
      )}

      <div className="rp-doctor-workspace">
        <section className="rp-card rp-pad rp-doctor-form rp-noprint">
          <h3>1. Patient</h3>

          <form className="rp-search-row" onSubmit={search}>
            <input
              className="rp-input"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Patient name or UHID"
            />

            <button
              type="submit"
              className="rp-btn rp-btn-primary"
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </form>

          {results.length > 0 && (
            <ul className="rp-results">
              {results.map((item, index) => (
                <li key={item.uhid ?? item.id ?? index}>
                  <div>
                    <strong>{patientName(item)}</strong>
                    <div className="rp-muted">
                      UHID: {item.uhid || "—"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rp-btn"
                    onClick={() => {
                      setPatient({
                        ...item,
                        name: patientName(item),
                      });
                      setResults([]);
                    }}
                  >
                    Select
                  </button>
                </li>
              ))}
            </ul>
          )}

          {patient && (
            <div className="rp-selected">
              <strong>{patient.name}</strong>
              <div>UHID: {patient.uhid}</div>

              <button
                type="button"
                className="rp-btn rp-mt"
                onClick={() => setPatient(null)}
              >
                Change patient
              </button>
            </div>
          )}

          <hr className="rp-divider" />

          <h3>2. Referring doctor</h3>

          <label className="rp-label" htmlFor="referring-doctor">
            Select doctor
          </label>

          <select
            id="referring-doctor"
            className="rp-input rp-mb"
            value={doctorId}
            onChange={(event) => setDoctorId(event.target.value)}
          >
            <option value="">Patient's own doctor</option>

            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.doctorName || doctor.name || `Doctor ${doctor.id}`}
              </option>
            ))}
          </select>

          <h3>3. Report template</h3>

          <label className="rp-label" htmlFor="report-template">
            Choose template
          </label>

          <select
            id="report-template"
            className="rp-input"
            value={templateId}
            onChange={(event) => chooseTemplate(event.target.value)}
          >
            <option value="">Select a saved template</option>

            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
                {template.category ? ` (${template.category})` : ""}
              </option>
            ))}
          </select>

          {selectedTemplate && (
            <>
              <div className="rp-se-row rp-mt">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <label
                    className="rp-label"
                    htmlFor="report-test-name"
                  >
                    Test name
                  </label>

                  <input
                    id="report-test-name"
                    className="rp-input"
                    value={testName}
                    onChange={(event) => setTestName(event.target.value)}
                  />
                </div>

                <div style={{ width: 160, flexShrink: 0 }}>
                  <label
                    className="rp-label"
                    htmlFor="report-category"
                  >
                    Send to
                  </label>

                  <select
                    id="report-category"
                    className="rp-input"
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                  >
                    <option value="">Select…</option>

                    {CATEGORIES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <hr className="rp-divider" />

              <h3>4. Sections</h3>

              <p className="rp-muted">
                Pre-filled from the template. Change what differs for this
                patient, remove what you don’t need, or add your own section.
              </p>

              <SectionsEditor
                sections={sections}
                onChange={setSections}
                mode="report"
              />

              <hr className="rp-divider" />

              <SaveAsTemplate
                sections={sections}
                category={category}
                testName={testName}
                onSaved={loadTemplates}
              />
            </>
          )}

          <div className="rp-se-row rp-mt">
            <button
              type="button"
              className="rp-btn rp-btn-primary rp-create-report"
              disabled={loading || !patient || !selectedTemplate}
              onClick={create}
            >
              {loading ? "Creating..." : "Create report"}
            </button>

            <button
              type="button"
              className="rp-btn"
              disabled={!patient || !selectedTemplate}
              onClick={printReport}
            >
              Print / save as PDF
            </button>
          </div>
        </section>

        <section className="rp-doctor-preview rp-doctor-print-preview">
          {previewTemplate ? (
            <TemplatePreview
              key={previewTemplate.id}
              template={previewTemplate}
              sections={sections}
              patient={patient}
              editable={false}
              flow
            />
          ) : (
            <div className="rp-card rp-pad rp-empty rp-noprint">
              <h3>Report preview</h3>
              <p>Select a template to see the report here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
