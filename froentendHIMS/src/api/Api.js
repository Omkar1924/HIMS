import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8085/api",   // your Spring Boot address, ending in /api
});



// If your backend needs a login token, uncomment:
// api.interceptors.request.use(cfg => {
//   const token = localStorage.getItem("token");
//   if (token) cfg.headers.Authorization = `Bearer ${token}`;
//   return cfg;
// });

export default api;