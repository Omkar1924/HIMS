import api from "./Api";

// ---- templates ----
export const getTemplates = (category, includeInactive = false) =>
  api.get("/report-templates", { params: { category, includeInactive } }).then(r => r.data);
export const getTemplate = id => api.get(`/report-templates/${id}`).then(r => r.data);
export const createTemplate = (body, replace = false) =>
  api.post("/report-templates", body, { params: { replace } }).then(r => r.data);
export const updateTemplate = (id, body, replace = false) =>
  api.put(`/report-templates/${id}`, body, { params: { replace } }).then(r => r.data);
export const deleteTemplate = id => api.delete(`/report-templates/${id}`);

// ---- reports ----
export const createReport = body => api.post("/reports", body).then(r => r.data);
export const getReport = id => api.get(`/reports/${id}`).then(r => r.data);
export const listReports = params => api.get("/reports", { params }).then(r => r.data);
export const updateReport = (id, body) => api.put(`/reports/${id}`, body).then(r => r.data);
export const sendForReview = (id, reviewingDoctorId) =>
  api.post(`/reports/${id}/send`, { reviewingDoctorId }).then(r => r.data);
export const approveReport = (id, doctorComment) =>
  api.post(`/reports/${id}/approve`, { doctorComment }).then(r => r.data);
export const reopenReport = id => api.post(`/reports/${id}/reopen`).then(r => r.data);

// ---- worklist (optional, read-only link to billing) ----
export const getPendingTests = categories =>
  api.get("/reports/pending-tests", { params: { categories: categories?.join(",") } }).then(r => r.data);

// ---- images ----
export const uploadReportImage = (reportId, file, caption) => {
  const form = new FormData();
  form.append("file", file);
  if (caption) form.append("caption", caption);
  return api.post(`/reports/${reportId}/images`, form).then(r => r.data);
};
export const deleteReportImage = imageId => api.delete(`/reports/images/${imageId}`);
export const reportImageUrl = imageId => `${api.defaults.baseURL}/reports/images/${imageId}`;

// ---- lookups from your existing endpoints (change paths to match your backend) ----
export const getServices = () => api.get("/services").then(r => r.data);
export const getDoctors = () => api.get("/add-doctors").then(r => r.data);
export const searchPatients = q => api.get("/bills/patients", { params: { q } }).then(r => r.data);

export const sendToDepartment = (id, department) =>
  api.post(`/reports/${id}/send-to-department`, { department }).then(r => r.data);
export const returnToDoctor = (id, filledBy, departmentRemark) =>
  api.post(`/reports/${id}/return`, { filledBy, departmentRemark }).then(r => r.data);

// ---- clinical summaries ----
export const listClinicalSummaries = (uhid) =>
  api.get("/reports", { params: { category: "CLINICAL_SUMMARY", uhid } }).then(r => r.data);

export const createClinicalSummary = (body) =>
  api.post("/reports", { ...body, category: "CLINICAL_SUMMARY" }).then(r => r.data);

export const duplicateTemplate = (id, name) =>
  api.post(`/report-templates/${id}/duplicate`, null, { params: { name } }).then(r => r.data);