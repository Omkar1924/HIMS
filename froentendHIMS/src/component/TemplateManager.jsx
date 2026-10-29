import { useEffect, useState } from "react";

import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "../api/ApiReporting";

import TemplatePreview from "./TemplatePreview";
import SectionsEditor from "./SectionsEditor";

import {
  CATEGORIES,
  guessCategory,
  newSection,
  parseSections,
  serializeSections,
  errMsg,
} from "./reportUtils";

import "../style/reports.css";
import "../style/templateManager.css";

const defaultSections = () => [
  newSection({ heading: "Patient Details" }),
  newSection({ heading: "Clinical Details" }),
  newSection({ heading: "Results" }),
  newSection({ heading: "Impression", layout: "bold" }),
];

const EMPTY_TEMPLATE = {
  name: "",
  templateCode: "",
  category: "RADIOLOGY",
  testName: "",
  centreName: "",
  centreAddress: "",
  centrePhone: "",
  logoUrl: "",
  active: true,
};

function normalizeTemplates(data) {
  if (Array.isArray(data)) return data;
  return data?.templates ?? data?.content ?? data?.data ?? [];
}

function normalizeTemplateCategory(value) {
  if (value == null || String(value).trim() === "") return "";

  const normalized = String(value).trim().toUpperCase();
  const match = CATEGORIES.find(
    (category) =>
      String(category.value).trim().toUpperCase() === normalized ||
      String(category.label).trim().toUpperCase() === normalized,
  );

  return match?.value ?? guessCategory(value) ?? String(value).trim();
}

export default function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [draft, setDraft] = useState({ ...EMPTY_TEMPLATE });
  const [sections, setSections] = useState(defaultSections);
  const [layout, setLayout] = useState({});
  const [selectedId, setSelectedId] = useState(null);

  const [view, setView] = useState("list");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editorCategoryOpen, setEditorCategoryOpen] = useState(false);

  const loadTemplates = async () => {
    try {
      const data = await getTemplates(undefined, true);
      setTemplates(normalizeTemplates(data));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const updateField = (field, value) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // Show all templates initially, or filter by selected category.
  const filteredTemplates =
    categoryFilter === "ALL"
      ? templates
      : templates.filter(
          (template) =>
            String(template.category || "").toUpperCase() ===
            categoryFilter.toUpperCase(),
        );

  const editTemplate = (template) => {
    setSelectedId(template.id);

    setDraft({
      ...EMPTY_TEMPLATE,
      ...template,
      category: normalizeTemplateCategory(template.category),
    });

    setSections(
      parseSections(
        template.sectionsJson ??
          template.templateStructure ??
          template.structureJson,
      ),
    );

    try {
      const savedLayout =
        typeof template.layoutJson === "string"
          ? JSON.parse(template.layoutJson)
          : template.layoutJson;

      setLayout(
        savedLayout && typeof savedLayout === "object" ? savedLayout : {},
      );
    } catch {
      setLayout({});
    }

    setJsonMode(false);
    setJsonText("");
    setError("");
    setMessage("");
    setCategoryOpen(false);
    setEditorCategoryOpen(false);
    setView("editor");
  };

  const newTemplate = () => {
    setSelectedId(null);
    setDraft({ ...EMPTY_TEMPLATE });
    setSections(defaultSections());
    setLayout({});
    setJsonMode(false);
    setJsonText("");
    setError("");
    setMessage("");
    setEditorCategoryOpen(false);
    setView("editor");
  };

  const backToList = () => {
    if (loading) return;

    setView("list");
    setError("");
    setMessage("");
    setJsonMode(false);
    setEditorCategoryOpen(false);
  };

  const toggleJson = () => {
    setError("");

    if (!jsonMode) {
      try {
        setJsonText(
          JSON.stringify(JSON.parse(serializeSections(sections)), null, 2),
        );
        setJsonMode(true);
      } catch {
        setError("Unable to convert sections to JSON.");
      }
      return;
    }

    const parsed = parseSections(jsonText);

    if (parsed.length === 0 && jsonText.trim() !== "[]") {
      setError("The JSON is invalid. Correct it or discard the JSON edits.");
      return;
    }

    setSections(parsed);
    setJsonMode(false);
  };

  const saveTemplate = async () => {
    setError("");
    setMessage("");

    if (!draft.name?.trim()) {
      setError("Template name is required.");
      return;
    }

    if (!draft.category) {
      setError("Choose a category (Radiology or Lab).");
      return;
    }

    let finalSections = sections;

    if (jsonMode) {
      finalSections = parseSections(jsonText);

      if (finalSections.length === 0 && jsonText.trim() !== "[]") {
        setError("Sections JSON is invalid.");
        return;
      }
    }

    if (finalSections.some((section) => !section.heading?.trim())) {
      setError("Every section needs a heading.");
      return;
    }

    const isEditing = selectedId != null;

    const payload = {
      ...draft,
      sectionsJson: serializeSections(finalSections),
      layoutJson: JSON.stringify(layout),
    };

    try {
      setLoading(true);

      if (isEditing) {
        await updateTemplate(selectedId, payload);
      } else {
        await createTemplate(payload);
      }

      await loadTemplates();

      setSections(finalSections);
      setJsonMode(false);
      setJsonText("");
      setEditorCategoryOpen(false);
      setView("list");

      setMessage(
        isEditing
          ? "Template updated successfully."
          : "Template created successfully.",
      );
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const deactivate = async (template) => {
    const confirmed = window.confirm(
      `Deactivate "${template.name}"? Existing reports keep working; doctors will no longer see it.`,
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      await deleteTemplate(template.id);
      await loadTemplates();

      setMessage("Template deactivated.");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const restore = async (template) => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      await updateTemplate(template.id, {
        ...template,
        active: true,
      });

      await loadTemplates();
      setMessage("Template restored.");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  };

  const previewSections = jsonMode ? parseSections(jsonText) : sections;

  return (
    <div className="rp-page">
      <h1 className="rp-title">Template Manager</h1>

      {/* Saved templates list */}
      {view === "list" && (
        <>
          <div className="rp-row rp-template-toolbar">
            <span className="rp-spacer" />

            <div className="rp-filter-control">
              <label className="rp-label" htmlFor="template-category-filter">
                Filter by category
              </label>

              <div className="rp-category-dropdown">
                <button
                  id="template-category-filter"
                  type="button"
                  className="rp-category-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={categoryOpen}
                  onClick={() => setCategoryOpen((open) => !open)}
                >
                  <span>
                    {categoryFilter === "ALL"
                      ? "All Categories"
                      : (CATEGORIES.find(
                          (category) => category.value === categoryFilter,
                        )?.label ?? categoryFilter)}
                  </span>

                  <span className="rp-category-arrow">
                    {categoryOpen ? "▴" : "▾"}
                  </span>
                </button>

                {categoryOpen && (
                  <div
                    className="rp-category-menu"
                    role="listbox"
                    aria-label="Filter templates by category"
                  >
                    {[
                      { value: "ALL", label: "All Categories" },
                      ...CATEGORIES,
                    ].map((category) => (
                      <button
                        key={category.value}
                        type="button"
                        role="option"
                        aria-selected={categoryFilter === category.value}
                        className={`rp-category-option ${
                          categoryFilter === category.value ? "active" : ""
                        }`}
                        onClick={() => {
                          setCategoryFilter(category.value);
                          setCategoryOpen(false);
                        }}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
            <h3>Saved Templates ({filteredTemplates.length})</h3>

            {filteredTemplates.length === 0 ? (
              <div className="rp-empty">
                {templates.length === 0
                  ? "No templates found."
                  : "No templates found in this category."}
              </div>
            ) : (
              <div className="rp-scroll">
                <table className="rp-table">
                  <thead>
                    <tr>
                      <th>Template</th>
                      <th>Category</th>
                      <th>Test</th>
                      <th>Status</th>
                      <th className="rp-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredTemplates.map((template) => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{template.category || "—"}</td>
                        <td>{template.testName || "—"}</td>

                        <td>
                          <span
                            className={`rp-badge ${
                              template.active === false
                                ? "rp-badge-off"
                                : "rp-badge-on"
                            }`}
                          >
                            {template.active === false ? "Inactive" : "Active"}
                          </span>
                        </td>

                        <td className="rp-right">
                          <button
                            type="button"
                            className="rp-btn"
                            onClick={() => editTemplate(template)}
                          >
                            Edit
                          </button>{" "}
                          {template.active === false ? (
                            <button
                              type="button"
                              className="rp-btn"
                              disabled={loading}
                              onClick={() => restore(template)}
                            >
                              Restore
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="rp-btn rp-btn-danger"
                              disabled={loading}
                              onClick={() => deactivate(template)}
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

      {/* Create/edit template page */}
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
              <h3>
                {selectedId != null
                  ? "Edit Template Details"
                  : "New Template Details"}
              </h3>

              <label className="rp-label" htmlFor="template-name">
                Template name *
              </label>

              <input
                id="template-name"
                className="rp-input rp-mb"
                value={draft.name ?? ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter template name"
              />

              {/* Category and template code */}
              <div className="rp-se-row rp-template-category-row">
                <div className="rp-editor-category-dropdown">
                  <label className="rp-label" htmlFor="template-category">
                    Category *
                  </label>

                  <div className="rp-category-dropdown">
                    <button
                      id="template-category"
                      type="button"
                      className="rp-category-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={editorCategoryOpen}
                      onClick={() => setEditorCategoryOpen((open) => !open)}
                    >
                      <span>
                        {draft.category
                          ? (CATEGORIES.find(
                              (category) => category.value === draft.category,
                            )?.label ?? draft.category)
                          : "Select..."}
                      </span>

                      <span className="rp-category-arrow">
                        {editorCategoryOpen ? "▴" : "▾"}
                      </span>
                    </button>

                    {editorCategoryOpen && (
                      <div
                        className="rp-category-menu"
                        role="listbox"
                        aria-label="Template categories"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!draft.category}
                          className={`rp-category-option ${
                            !draft.category ? "active" : ""
                          }`}
                          onClick={() => {
                            updateField("category", "");
                            setEditorCategoryOpen(false);
                          }}
                        >
                          Select...
                        </button>

                        {CATEGORIES.map((category) => (
                          <button
                            key={category.value}
                            type="button"
                            role="option"
                            aria-selected={draft.category === category.value}
                            className={`rp-category-option ${
                              draft.category === category.value ? "active" : ""
                            }`}
                            onClick={() => {
                              updateField("category", category.value);
                              setEditorCategoryOpen(false);
                            }}
                          >
                            {category.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="rp-editor-code-field">
                  <label className="rp-label" htmlFor="template-code">
                    Template code
                  </label>

                  <input
                    id="template-code"
                    className="rp-input rp-mb"
                    value={draft.templateCode ?? ""}
                    onChange={(e) =>
                      updateField("templateCode", e.target.value)
                    }
                    placeholder="Optional"
                  />
                </div>
              </div>

              <label className="rp-label" htmlFor="template-test-name">
                Test name
              </label>

              <input
                id="template-test-name"
                className="rp-input rp-mb"
                value={draft.testName ?? ""}
                onChange={(e) => updateField("testName", e.target.value)}
                placeholder="e.g. X-Ray Chest"
              />

              <div className="rp-organisation-grid">
                <div className="rp-organisation-field">
                  <label className="rp-label" htmlFor="template-centre-name">
                    Centre name
                  </label>
                  <input
                    id="template-centre-name"
                    className="rp-input"
                    value={draft.centreName ?? ""}
                    onChange={(e) => updateField("centreName", e.target.value)}
                    placeholder="Hospital or centre name"
                  />
                </div>

                <div className="rp-organisation-field">
                  <label className="rp-label" htmlFor="template-phone">
                    Centre phone
                  </label>
                  <input
                    id="template-phone"
                    className="rp-input"
                    value={draft.centrePhone ?? ""}
                    onChange={(e) => updateField("centrePhone", e.target.value)}
                    placeholder="Contact number"
                  />
                </div>

                <div className="rp-organisation-field">
                  <label className="rp-label" htmlFor="template-logo-url">
                    Logo URL
                  </label>
                  <input
                    id="template-logo-url"
                    className="rp-input"
                    value={draft.logoUrl ?? ""}
                    onChange={(e) => updateField("logoUrl", e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div className="rp-organisation-field rp-organisation-address">
                  <label className="rp-label" htmlFor="template-address">
                    Centre address
                  </label>
                  <input
                    id="template-address"
                    className="rp-input"
                    value={draft.centreAddress ?? ""}
                    onChange={(e) =>
                      updateField("centreAddress", e.target.value)
                    }
                    placeholder="Enter centre address"
                  />
                </div>
              </div>

              <div className="rp-se-row rp-mt">
                <h3 style={{ flex: 1, margin: 0 }}>Report Sections</h3>

                <button type="button" className="rp-btn" onClick={toggleJson}>
                  {jsonMode ? "Back to editor" : "Edit as JSON"}
                </button>
              </div>

              <p className="rp-muted">
                Configure section headings, layouts, and who fills each section.
                Default text is used for new reports.
              </p>

              {jsonMode ? (
                <textarea
                  className="rp-input rp-ta-tall rp-json-editor"
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  spellCheck={false}
                />
              ) : (
                <SectionsEditor
                  sections={sections}
                  onChange={setSections}
                  mode="template"
                />
              )}

              <p className="rp-muted rp-mt">
                Drag or resize sections in the preview to adjust their layout.
              </p>

              {message && <div className="rp-ok rp-message">{message}</div>}

              <div className="rp-row rp-mt">
                <button
                  type="button"
                  className="rp-btn rp-btn-primary"
                  disabled={loading}
                  onClick={saveTemplate}
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
              <TemplatePreview
                key={selectedId ?? "new-template"}
                template={{
                  ...draft,
                  layoutJson: JSON.stringify(layout),
                }}
                sections={previewSections}
                editable
                onLayoutChange={setLayout}
                onLogoChange={(logoUrl) => updateField("logoUrl", logoUrl)}
              />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
