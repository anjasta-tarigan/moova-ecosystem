import api from "../../lib/axios";

export const judgeApi = {
  getAssignments: () => api.get("/api/judge/assignments"),

  getCategorySubmissions: (categoryId: string, params?: Record<string, any>) =>
    api.get(`/api/judge/assignments/${categoryId}/submissions`, { params }),

  getSubmissionDetail: (submissionId: string, stage: string) =>
    api.get(`/api/judge/submissions/${submissionId}`, { params: { stage } }),

  saveScore: (data: {
    submissionId: string;
    stage: string;
    criteriaScores: Record<string, number>;
    comment: string;
    status: "draft" | "submitted";
  }) => api.post("/api/judge/scores", data),
};
