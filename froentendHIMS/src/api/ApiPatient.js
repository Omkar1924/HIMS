import axios from "axios";

const readError = (err) => {
  const msg =
    err.response?.data?.message ||
    (err.request ? "Cannot reach the server" : err.message);
  return Promise.reject(new Error(msg));
};

const make = (baseURL) => {
  const inst = axios.create({ baseURL, headers: { "Content-Type": "application/json" } });
  inst.interceptors.response.use((res) => res, readError);
  return inst;
};

const api = make("http://localhost:8085/api/patient-registrations");
const root = make("http://localhost:8085/api");

// ---------- patients ----------
export const getPatients = () => api.get("").then((r) => r.data);
export const getPatientByUhid = (uhid) => api.get(`/${uhid}`).then((r) => r.data);
export const createPatient = (data) => api.post("", data).then((r) => r.data);
export const updatePatient = (uhid, data) => api.put(`/${uhid}`, data).then((r) => r.data);
export const deletePatient = (uhid) => api.delete(`/${uhid}`).then((r) => r.data);

// ---------- doctors / services ----------
export const getDoctors = () => root.get("/add-doctors").then((r) => r.data);
export const getEmploys = () => root.get("/employees").then((r) => r.data);
export const getServices = () => root.get("/services").then((r) => r.data);

// ---------- billing ----------
export const getPaymentModes = () => root.get("/bills/payment-modes").then((r) => r.data);
export const searchBillPatients = (q) =>
  root.get("/bills/patients", { params: { q } }).then((r) => r.data);
export const createBill = (data) => root.post("/bills", data).then((r) => r.data);
export const searchBills = (q, status) =>
  root
    .get("/bills", { params: { q, status: status === "ALL" ? undefined : status } })
    .then((r) => r.data);
export const addPayment = (billNo, data) =>
  root.post(`/bills/${billNo}/payments`, data).then((r) => r.data);
export const payFromDeposit = (billNo) =>
  root.post(`/bills/${billNo}/use-deposit`).then((r) => r.data);

// ---------- deposits ----------
export const getDepositSummary = (uhid) => root.get(`/deposits/${uhid}`).then((r) => r.data);
export const addDeposit = (data) => root.post("/deposits", data).then((r) => r.data);

// ---------- final bill ----------
export const getCheckoutPreview = (uhid) =>
  root.get(`/final-bills/preview/${uhid}`).then((r) => r.data);
export const checkout = (data) => root.post("/final-bills/checkout", data).then((r) => r.data);
export const getFinalBills = (q) =>
  root.get("/final-bills", { params: { q } }).then((r) => r.data);