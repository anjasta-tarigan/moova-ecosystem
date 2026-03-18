import api from "../../lib/axios";

export const submissionsApi = {
  getMySubmissions: () => api.get("/api/submissions"),
  getSubmission: (id: string) => api.get(`/api/submissions/${id}`),
  createSubmission: (data: Record<string, any>) =>
    api.post("/api/submissions", data),
  updateSubmission: (id: string, data: Record<string, any>) =>
    api.put(`/api/submissions/${id}`, data),
  uploadFile: (id: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/api/submissions/${id}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteFile: (submissionId: string, fileId: string) =>
    api.delete(`/api/submissions/${submissionId}/files/${fileId}`),
  submitSubmission: (id: string) =>
    api.post(`/api/submissions/${id}/submit`, { consentGiven: true }),
  withdrawSubmission: (id: string) =>
    api.post(`/api/submissions/${id}/withdraw`),
};
