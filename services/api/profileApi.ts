import api from "../../lib/axios";

export const profileApi = {
  getProfile: () => api.get("/api/siswa/profile"),

  updateProfile: (data: Record<string, any>) =>
    api.put("/api/siswa/profile", data),

  changePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => api.post("/api/auth/change-password", data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post("/api/siswa/profile/avatar", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  getMyEvents: () => api.get("/api/siswa/my-events"),
  getMySubmissions: () => api.get("/api/siswa/my-submissions"),
  getMyCertificates: () => api.get("/api/siswa/my-certificates"),
};
