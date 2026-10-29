// src/component/reportUtils.js
// Shared helpers for report sections.
// A section is: { id, heading, layout, content, filledBy }
//   layout   : "paragraph" | "bullets" | "bold"
//   filledBy : "DOCTOR" | "DEPARTMENT"

export const LAYOUTS = [
  { value: "paragraph", label: "Paragraph" },
  { value: "bullets", label: "Bullet list" },
  { value: "bold", label: "Bold line" },
];

export const FILLED_BY = [
  { value: "DOCTOR", label: "Doctor" },
  { value: "DEPARTMENT", label: "Department" },
];

export const CATEGORIES = [
  { value: "RADIOLOGY", label: "Radiology" },
  { value: "LAB", label: "Lab" },
  { value: "CLINICAL_SUMMARY", label: "Clinical Summary" },
];

// Turns free text such as "rediology", "Radiology", "x-ray", "pathology lab" into RADIOLOGY or LAB ("" if unknown).
export const guessCategory = (value) => {
  const v = String(value ?? "").trim().toLowerCase();
  if (!v) return "";
  if (v === "lab" || v.includes("lab") || v.includes("patho") || v.includes("blood")) return "LAB";
  if (/(rad|redi|xray|x-ray|ct|mri|usg|ultra|imaging|scan)/.test(v)) return "RADIOLOGY";
  if (v.includes("clinical") || v.includes("discharge") || v.includes("summary") || v.includes("hospital course")) return "CLINICAL_SUMMARY";
  return "";
};

let counter = 0;
// Unique id for a new section. Every section MUST have its own id, otherwise typing in one section changes them all.
export const uid = () =>
  `s${Date.now().toString(36)}${(counter++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const layoutOf = (s) => {
  const raw = String(s.layout ?? s.format ?? "").toLowerCase();
  if (raw.includes("bullet") || raw.includes("list") || s.type === "list") return "bullets";
  if (raw.includes("bold") || s.bold === true) return "bold";
  return "paragraph";
};

const norm = (s, i) => ({
  id: String(s?.id ?? s?.key ?? `section-${i}`),
  heading: s?.heading ?? s?.title ?? s?.label ?? s?.name ?? `Section ${i + 1}`,
  layout: layoutOf(s ?? {}),
  content: s?.content ?? s?.text ?? s?.value ?? s?.defaultText ?? s?.default ?? "",
  filledBy: String(s?.filledBy ?? "DOCTOR").toUpperCase() === "DEPARTMENT" ? "DEPARTMENT" : "DOCTOR",
});

// Accepts a JSON string, an array, or { sections: [...] }. Returns normalised sections with UNIQUE ids.
export const parseSections = (json) => {
  try {
    const v = typeof json === "string" ? JSON.parse(json) : json;
    const arr = Array.isArray(v) ? v : v?.sections ?? v?.fields;
    if (!Array.isArray(arr)) return [];

    const seen = new Set();
    return arr
      .filter((s) => s && typeof s === "object")
      .map(norm)
      .map((s, i) => {
        let id = s.id;
        while (seen.has(id)) id = `${s.id}-${i}-${seen.size}`;
        seen.add(id);
        return { ...s, id };
      });
  } catch {
    return [];
  }
};

export const newSection = (patch = {}) => ({
  id: uid(),
  heading: "",
  layout: "paragraph",
  content: "",
  filledBy: "DOCTOR",
  ...patch,
});

// The JSON string stored in report_template.sections_json and patient_report.content_json.
export const serializeSections = (sections) =>
  JSON.stringify(
    sections.map(({ id, heading, layout, content, filledBy }) => ({ id, heading, layout, content, filledBy }))
  );

export const patientName = (p) => {
  if (!p) return "";
  const direct = p.name || p.fullName || p.full_name || p.patientName || p.patient_name || p.pname;
  if (direct) return direct;
  const parts = [
    p.firstName ?? p.first_name ?? p.fname,
    p.middleName ?? p.middle_name ?? p.mname,
    p.lastName ?? p.last_name ?? p.lname,
  ].filter(Boolean);
  return parts.join(" ") || "Unknown patient";
};

export const errMsg = (e) => e?.response?.data?.message || e?.message || "Something went wrong";
