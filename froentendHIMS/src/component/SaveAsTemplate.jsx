// src/component/SaveAsTemplate.jsx
// "Save this report as a template": reuse the current sections and wording for future reports.
import { useState } from "react";
import { createTemplate } from "../api/ApiReporting";
import { serializeSections, errMsg } from "./reportUtils";
import "../style/templateManager.css";
import "../style/reports.css";


export default function SaveAsTemplate({ sections, category, testName, onSaved }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const save = async (replace = false) => {
    setError("");
    setMessage("");

    if (!name.trim()) return setError("Enter a template name.");
    if (!category) return setError("Choose a category (Radiology or Lab) first.");
    if (sections.length === 0) return setError("Add at least one section.");
    if (sections.some((s) => !s.heading.trim())) return setError("Every section needs a heading.");

    try {
      setBusy(true);
      const saved = await createTemplate(
        {
          name: name.trim(),
          templateCode: code.trim() || null,
          category,
          testName: testName || name.trim(),
          applicableFor: "BOTH",
          active: true,
          defaultTemplate: false,
          sectionsJson: serializeSections(sections),
        },
        replace
      );
      setMessage(`Saved as template “${saved?.name ?? name.trim()}”.`);
      setName("");
      setCode("");
      onSaved?.(saved);
    } catch (e) {
      if (e?.response?.status === 409 && !replace &&
          window.confirm("A template with this name already exists. Replace it?")) {
        setBusy(false);
        return save(true);
      }
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rp-save-template">
      <h4>Save this report as a template</h4>
      <p className="rp-muted">Reuse these sections and wording for future reports.</p>
      <div className="rp-se-row">
        <input
          className="rp-input rp-se-heading"
          placeholder="Template name *  (e.g. CT Brain – follow-up)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="rp-input rp-se-select"
          placeholder="Code (optional)"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="button" className="rp-btn rp-btn-primary" disabled={busy} onClick={() => save(false)}>
          {busy ? "Saving..." : "Save as template"}
        </button>
      </div>
      {error && <div className="rp-error rp-error-box">{error}</div>}
      {message && <div className="rp-ok rp-message">{message}</div>}
    </div>
  );
}
