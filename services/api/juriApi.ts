import api from "../../lib/axios";

export const juriApi = {
  getAssignments: () => api.get("/api/juri/assignments"),

  getCategorySubmissions: (categoryId: string, params?: Record<string, any>) =>
    api.get(`/api/juri/assignments/${categoryId}/submissions`, { params }),

  getSubmissionDetail: (submissionId: string, stage: string) =>
    api.get(`/api/juri/submissions/${submissionId}`, { params: { stage } }),

  saveScore: (data: {
    submissionId: string;
    stage: string;
    criteriaScores: Record<string, number>;
    comment: string;
    status: "draft" | "submitted";
  }) => api.post("/api/juri/scores", data),
};
