import api from "./Api.js";

const unwrap = (res) => res.data;

export const dsErrMsg = (e) =>
  e?.response?.data?.message ||
  (typeof e?.response?.data === "string" ? e.response.data : "") ||
  e?.message ||
  "Something went wrong.";

// Templates
export const getDischargeTemplates = (includeInactive = false) =>
  api.get("/discharge-templates", { params: { includeInactive } }).then(unwrap);

export const createDischargeTemplate = (payload, replace = false) =>
  api.post("/discharge-templates", payload, { params: { replace } }).then(unwrap);

export const updateDischargeTemplate = (id, payload, replace = false) =>
  api.put(`/discharge-templates/${id}`, payload, { params: { replace } }).then(unwrap);

export const deleteDischargeTemplate = (id) =>
  api.delete(`/discharge-templates/${id}`).then(unwrap);

// Summaries
export const getDischargeSummaries = (params = {}) =>
  api.get("/discharge-summaries", { params }).then(unwrap);

export const getDischargeSummary = (id) =>
  api.get(`/discharge-summaries/${id}`).then(unwrap);

export const createDischargeSummary = (payload) =>
  api.post("/discharge-summaries", payload).then(unwrap);

export const updateDischargeSummary = (id, payload) =>
  api.put(`/discharge-summaries/${id}`, payload).then(unwrap);

export const submitDischargeSummary = (id) =>
  api.post(`/discharge-summaries/${id}/submit`).then(unwrap);

export const returnDischargeSummary = (id, remark) =>
  api.post(`/discharge-summaries/${id}/return`, { remark }).then(unwrap);

export const approveDischargeSummary = (id, payload) =>
  api.post(`/discharge-summaries/${id}/approve`, payload).then(unwrap);

export const deleteDischargeSummary = (id) =>
  api.delete(`/discharge-summaries/${id}`).then(unwrap);

// Spelling
export const spellCheck = (text) =>
  api.post("/spellcheck", { text }).then(unwrap);