import axios from "axios";

const BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("giva_access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — auto refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem("giva_refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem("giva_access_token", data.data.accessToken);
        localStorage.setItem("giva_refresh_token", data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("giva_access_token");
        localStorage.removeItem("giva_refresh_token");
        localStorage.removeItem("giva_user");
        window.location.hash = "#/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
