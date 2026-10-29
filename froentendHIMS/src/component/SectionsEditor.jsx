import { useRef, useEffect } from "react";
import "../style/reports.css";
import "../style/templateManager.css";

const TOOLBAR = [
  { command: "bold", label: "B", title: "Bold", className: "rp-rich-bold" },
  {
    command: "italic",
    label: "I",
    title: "Italic",
    className: "rp-rich-italic",
  },
  {
    command: "underline",
    label: "U",
    title: "Underline",
    className: "rp-rich-underline",
  },
  {
    command: "insertUnorderedList",
    label: "• List",
    title: "Bullet list",
    className: "",
  },
  {
    command: "insertOrderedList",
    label: "1. List",
    title: "Numbered list",
    className: "",
  },
];

function normalizeFilledBy(value) {
  const normalized = String(value ?? "department").toLowerCase();
  return normalized === "doctor" ? "doctor" : "department";
}

function normalizeDefaultText(section) {
  return section.defaultText ?? section.defaultValue ?? section.content ?? "";
}

function executeFormatting(editorRef, command) {
  const editor = editorRef.current;

  if (!editor) return;

  editor.focus();
  document.execCommand(command, false, null);
}

function SectionTextEditor({ section, index, updateSection }) {
  const editorRef = useRef(null);

  const initialText =
    section.defaultText ?? section.defaultValue ?? section.content ?? "";

  // Sync content only when the section changes or external data loads.
  // Never replace the editor's HTML while the user is typing.
  useEffect(() => {
    const editor = editorRef.current;

    if (!editor || document.activeElement === editor) return;

    if (editor.innerHTML !== initialText) {
      editor.innerHTML = initialText;
    }
  }, [section.id, initialText]);

  const handleInput = (event) => {
    const html = event.currentTarget.innerHTML;

    updateSection(index, {
      defaultText: html,
    });
  };

  return (
    <div className="rp-rich-editor">
      <div
        className="rp-rich-toolbar"
        role="toolbar"
        aria-label="Text formatting"
      >
        {TOOLBAR.map((tool) => (
          <button
            key={tool.command}
            type="button"
            className={`rp-rich-tool ${tool.className}`}
            title={tool.title}
            aria-label={tool.title}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => executeFormatting(editorRef, tool.command)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div
        ref={editorRef}
        className="rp-rich-content"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`Default text for section ${index + 1}`}
        aria-multiline="true"
        data-placeholder="Enter default text for new reports..."
        onInput={handleInput}
        onBlur={handleInput}
      />
    </div>
  );
}

export default function SectionsEditor({ sections = [], onChange }) {
  const updateSection = (index, changes) => {
    onChange(
      sections.map((section, currentIndex) =>
        currentIndex === index ? { ...section, ...changes } : section,
      ),
    );
  };

  const moveSection = (index, direction) => {
    const destination = index + direction;

    if (destination < 0 || destination >= sections.length) return;

    const updated = [...sections];

    [updated[index], updated[destination]] = [
      updated[destination],
      updated[index],
    ];

    onChange(updated);
  };

  const removeSection = (index) => {
    const section = sections[index];

    if (
      !window.confirm(`Remove "${section?.heading || `Section ${index + 1}`}"?`)
    ) {
      return;
    }

    onChange(sections.filter((_, currentIndex) => currentIndex !== index));
  };

  const addSection = () => {
    onChange([
      ...sections,
      {
        id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        heading: "",
        layout: "paragraph",
        filledBy: "department",
        defaultText: "",
      },
    ]);
  };

  return (
    <div className="rp-se-editor">
      {sections.map((section, index) => (
        <article className="rp-se-card" key={section.id ?? `section-${index}`}>
          <div className="rp-se-card-header">
            <div className="rp-se-card-title">
              <span className="rp-se-number">{index + 1}</span>

              <strong>
                {section.heading?.trim() || `Section ${index + 1}`}
              </strong>
            </div>

            <div className="rp-se-actions">
              <button
                type="button"
                className="rp-se-action rp-se-action-move"
                title="Move section up"
                aria-label={`Move section ${index + 1} up`}
                disabled={index === 0}
                onClick={() => moveSection(index, -1)}
              >
                ↑
              </button>

              <button
                type="button"
                className="rp-se-action rp-se-action-move"
                title="Move section down"
                aria-label={`Move section ${index + 1} down`}
                disabled={index === sections.length - 1}
                onClick={() => moveSection(index, 1)}
              >
                ↓
              </button>

              <button
                type="button"
                className="rp-se-action rp-se-action-delete"
                title="Remove section"
                aria-label={`Remove section ${index + 1}`}
                onClick={() => removeSection(index)}
              >
                ×
              </button>
            </div>
          </div>

          <div className="rp-se-fields">
            <div className="rp-se-field rp-se-heading-field">
              <label className="rp-label" htmlFor={`section-heading-${index}`}>
                Section heading *
              </label>

              <input
                id={`section-heading-${index}`}
                className="rp-input"
                value={section.heading ?? ""}
                placeholder="Enter section heading"
                onChange={(event) =>
                  updateSection(index, {
                    heading: event.target.value,
                  })
                }
              />
            </div>

            <div className="rp-se-field">
              <label
                className="rp-label"
                htmlFor={`section-filled-by-${index}`}
              >
                Who fills this section
              </label>

              <select
                id={`section-filled-by-${index}`}
                className="rp-input"
                value={normalizeFilledBy(section.filledBy)}
                onChange={(event) =>
                  updateSection(index, {
                    filledBy: event.target.value,
                  })
                }
              >
                <option value="department">Department</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            <div className="rp-se-field rp-se-default-field">
              <label className="rp-label">Default text (optional)</label>

              <SectionTextEditor
                section={section}
                index={index}
                updateSection={updateSection}
              />
            </div>
          </div>
        </article>
      ))}

      <div className="rp-se-add-row">
        <button
          type="button"
          className="rp-btn rp-btn-primary"
          onClick={addSection}
        >
          + Add Section
        </button>

        <span className="rp-muted">
          {sections.length} section{sections.length === 1 ? "" : "s"}
        </span>
      </div>
    </div>
  );
}
