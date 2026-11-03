import axios from "axios";

const queueApi = axios.create({
  baseURL: "/queue-api", // goes through the Vite proxy
  headers: { "Content-Type": "application/json" },
});

queueApi.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg =
      err.response?.data?.message ||
      (err.request ? "Cannot reach the server" : err.message);
    return Promise.reject(new Error(msg));
  },
);

export const getQueueByEmployee = (employeeId) =>
  queueApi.get(`/patient-queues/employee/${employeeId}`).then((r) => r.data);