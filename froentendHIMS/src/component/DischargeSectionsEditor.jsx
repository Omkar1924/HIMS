import { useRef, useState } from "react";

import { spellCheck } from "../api/ApiDischarge";
import { newField, newSection } from "./DischargeUtils";

import "../style/reports.css";
import "../style/templateManager.css";
import "../style/discharge.css";

const PLACEHOLDER = "{{answer}}";

// onChange must be the parent's setSections (functional updates are used below).
export default function DischargeSectionsEditor({ sections, onChange }) {
  const [notices, setNotices] = useState({});
  const skipRef = useRef({});

  // ---------------------------------------------------------------- updates

  const patchSection = (id, patch, guard) =>
    onChange((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (guard && s[guard.prop] !== guard.expected) return s;
        return { ...s, ...patch };
      }),
    );

  const patchField = (sectionId, j, patch, guard) =>
    onChange((prev) =>
      prev.map((s) =>
        s.id !== sectionId
          ? s
          : {
              ...s,
              fields: s.fields.map((f, fj) => {
                if (fj !== j) return f;
                if (guard && f[guard.prop] !== guard.expected) return f;
                return { ...f, ...patch };
              }),
            },
      ),
    );

  const addField = (sectionId) =>
    onChange((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, fields: [...s.fields, newField()] } : s,
      ),
    );

  const removeField = (sectionId, j) =>
    onChange((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, fields: s.fields.filter((_, fj) => fj !== j) }
          : s,
      ),
    );

  const move = (i, dir) =>
    onChange((prev) => {
      const target = i + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[target]] = [copy[target], copy[i]];
      return copy;
    });

  const removeSection = (id) =>
    onChange((prev) => prev.filter((s) => s.id !== id));

  // ---------------------------------------------------------------- spelling

  const clearNotice = (k) =>
    setNotices((n) => {
      if (!n[k]) return n;
      const copy = { ...n };
      delete copy[k];
      return copy;
    });

  // Checks the text around {{answer}} separately so the placeholder is never touched.
  const correct = async (text) => {
    const parts = text.split(PLACEHOLDER);
    const results = await Promise.all(
      parts.map((p) =>
        p.trim() ? spellCheck(p) : { corrected: p, changes: [] },
      ),
    );
    return {
      corrected: results.map((r) => r.corrected).join(PLACEHOLDER),
      changes: results.flatMap((r) => r.changes ?? []),
    };
  };

  const checkSpelling = async (noticeKey, text, apply) => {
    if (!text || !text.trim() || skipRef.current[noticeKey] === text) return;

    try {
      const { corrected, changes } = await correct(text);
      if (changes.length && corrected !== text) {
        apply(corrected, text); // only applies if the field still holds `text`
        setNotices((n) => ({
          ...n,
          [noticeKey]: { before: text, changes, apply },
        }));
      }
    } catch {
      // Spell check is only a helper; ignore failures.
    }
  };

  const undo = (noticeKey) => {
    const n = notices[noticeKey];
    if (!n) return;
    skipRef.current[noticeKey] = n.before;
    n.apply(n.before);
    clearNotice(noticeKey);
  };

  const textProps = (noticeKey, value, apply) => ({
    value: value ?? "",
    onChange: (e) => {
      apply(e.target.value);
      clearNotice(noticeKey);
    },
    onBlur: (e) => checkSpelling(noticeKey, e.target.value, apply),
  });

  const sectionProps = (section, prop) =>
    textProps(`${section.id}:${prop}`, section[prop], (v, expected) =>
      patchSection(
        section.id,
        { [prop]: v },
        expected === undefined ? undefined : { prop, expected },
      ),
    );

  const fieldProps = (section, j, prop) =>
    textProps(
      `${section.id}:${j}:${prop}`,
      section.fields[j][prop],
      (v, expected) =>
        patchField(
          section.id,
          j,
          { [prop]: v },
          expected === undefined ? undefined : { prop, expected },
        ),
    );

  const noticeBox = (k) =>
    notices[k] ? (
      <div className="ds-notice">
        Auto-corrected:{" "}
        {notices[k].changes
          .map((c) => `${c.original} → ${c.corrected}`)
          .join(", ")}{" "}
        <button type="button" className="ds-link" onClick={() => undo(k)}>
          Undo
        </button>
      </div>
    ) : null;

  // ---------------------------------------------------------------- render

  return (
    <div className="rp-se-editor">
      {sections.map((section, i) => (
        <div className="rp-se-card" key={section.id}>
          <div className="rp-se-card-header">
            <div className="rp-se-card-title">
              <span className="rp-se-number">{i + 1}</span>
              <strong>{section.heading || "Untitled section"}</strong>
            </div>

            <div className="rp-se-actions">
              <button
                type="button"
                className="rp-se-action rp-se-action-move"
                disabled={i === 0}
                onClick={() => move(i, -1)}
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                className="rp-se-action rp-se-action-move"
                disabled={i === sections.length - 1}
                onClick={() => move(i, 1)}
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                className="rp-se-action rp-se-action-delete"
                onClick={() => removeSection(section.id)}
                title="Delete section"
              >
                ×
              </button>
            </div>
          </div>

          <div className="rp-se-fields">
            <div className="rp-se-field rp-se-heading-field">
              <label className="rp-label">Section heading *</label>
              <input
                className="rp-input"
                placeholder="e.g. Investigations"
                {...sectionProps(section, "heading")}
              />
              {noticeBox(`${section.id}:heading`)}
            </div>

            <div className="rp-se-field">
              <label className="rp-label">Text style</label>
              <select
                className="rp-input"
                value={section.layout}
                onChange={(e) =>
                  patchSection(section.id, { layout: e.target.value })
                }
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div className="rp-se-field">
              <label className="rp-label">Filled by</label>
              <select
                className="rp-input"
                value={section.filledBy}
                onChange={(e) =>
                  patchSection(section.id, { filledBy: e.target.value })
                }
              >
                <option value="NURSE">Nurse</option>
                <option value="DOCTOR">Doctor</option>
              </select>
            </div>
          </div>

          {section.fields.map((f, j) => (
            <div className="ds-field-box" key={f.key}>
              <div className="rp-se-row">
                <strong style={{ flex: 1 }}>Question {j + 1}</strong>
                {section.fields.length > 1 && (
                  <button
                    type="button"
                    className="rp-btn rp-btn-danger"
                    onClick={() => removeField(section.id, j)}
                  >
                    Remove
                  </button>
                )}
              </div>

              <label className="rp-label">Question shown to the nurse *</label>
              <textarea
                className="rp-input ds-ta"
                rows={2}
                placeholder="Plain-language question"
                {...fieldProps(section, j, "question")}
              />
              {noticeBox(`${section.id}:${j}:question`)}

              <label className="rp-label">Helper text</label>
              <input
                className="rp-input"
                placeholder="Short guidance under the question"
                {...fieldProps(section, j, "helperText")}
              />
              {noticeBox(`${section.id}:${j}:helperText`)}

              <div className="rp-se-fields">
                <div className="rp-se-field">
                  <label className="rp-label">Answer type</label>
                  <select
                    className="rp-input"
                    value={f.inputType}
                    onChange={(e) =>
                      patchField(section.id, j, { inputType: e.target.value })
                    }
                  >
                    <option value="TEXT">Text</option>
                    <option value="YES_NO_TEXT">Yes / No + details</option>
                  </select>
                </div>

                <div className="rp-se-field rp-se-heading-field">
                  <label className="rp-label">
                    Sentence in the summary (use {"{{answer}}"} for the answer)
                  </label>
                  <input
                    className="rp-input"
                    placeholder="The patient was admitted with {{answer}}."
                    {...fieldProps(section, j, "narrative")}
                  />
                  {noticeBox(`${section.id}:${j}:narrative`)}
                </div>

                {f.inputType === "YES_NO_TEXT" && (
                  <div className="rp-se-field rp-se-heading-field">
                    <label className="rp-label">
                      Sentence when answer is No
                    </label>
                    <input
                      className="rp-input"
                      placeholder="No complications documented. (leave empty to skip)"
                      {...fieldProps(section, j, "narrativeNo")}
                    />
                    {noticeBox(`${section.id}:${j}:narrativeNo`)}
                  </div>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="rp-btn"
            onClick={() => addField(section.id)}
          >
            + Add question
          </button>
        </div>
      ))}

      <div className="rp-se-add-row">
        <button
          type="button"
          className="rp-btn rp-btn-primary"
          onClick={() => onChange((prev) => [...prev, newSection()])}
        >
          + Add Section
        </button>
      </div>
    </div>
  );
}
