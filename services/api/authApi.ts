import api from "../../lib/axios";

export const authApi = {
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),

  register: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => api.post("/api/auth/register", data),

  logout: (refreshToken: string) =>
    api.post("/api/auth/logout", { refreshToken }),

  me: () => api.get("/api/auth/me"),

  refresh: (refreshToken: string) =>
    api.post("/api/auth/refresh", { refreshToken }),
};
