export const NOT_DOCUMENTED = "[Not documented – to be completed by doctor]";

const uid = () => Math.random().toString(36).slice(2, 9);

export const newField = (over = {}) => ({
  key: `f_${uid()}`,
  question: "",
  helperText: "",
  inputType: "TEXT", // TEXT | YES_NO_TEXT
  narrative: "{{answer}}",
  narrativeNo: "",
  value: "",
  yes: null,
  ...over,
});

export const newSection = (over = {}) => ({
  id: `s_${uid()}`,
  heading: "",
  layout: "normal", // normal | bold
  filledBy: "NURSE", // NURSE | DOCTOR
  fields: [newField()],
  ...over,
});

export function parseSections(json) {
  try {
    const parsed = typeof json === "string" ? JSON.parse(json) : json;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const serializeSections = (sections) => JSON.stringify(sections);

const apply = (frame, value) => {
  if (!frame || !frame.trim()) return value;
  const cleaned = value.replace(/[.\s]+$/, "");
  return frame.replace("{{answer}}", () => cleaned);
};

// Mirrors NarrativeRenderer on the backend.
function renderField(f) {
  const value = (f.value ?? "").trim();

  if (f.inputType === "YES_NO_TEXT") {
    if (f.yes === null || f.yes === undefined) return NOT_DOCUMENTED;
    if (f.yes === false) return (f.narrativeNo ?? "").trim();
  }

  if (!value) return NOT_DOCUMENTED;
  return apply(f.narrative, value);
}

export const renderSections = (sections) =>
  sections.map((s) => ({
    id: s.id,
    heading: s.heading,
    layout: s.layout,
    text: (s.fields ?? [])
      .map(renderField)
      .filter((t) => t && t.trim())
      .join("\n"),
  }));

// Sample text for the template manager preview (no real answers yet).
export const templateSample = (sections) =>
  sections.map((s) => ({
    id: s.id,
    heading: s.heading || "Untitled section",
    layout: s.layout,
    text: (s.fields ?? [])
      .map((f) =>
        f.narrative && f.narrative.trim()
          ? f.narrative.replace("{{answer}}", "[documented information]")
          : "[documented information]",
      )
      .join("\n"),
  }));

export const defaultSections = () => [
  newSection({
    heading: "Reason for Admission",
    fields: [
      newField({
        question: "Why was the patient admitted to the hospital?",
        helperText:
          "Mention only information recorded in the patient's file. If unknown or not documented, leave it for review rather than guessing.",
        narrative: "The patient was admitted with {{answer}}.",
      }),
    ],
  }),
];