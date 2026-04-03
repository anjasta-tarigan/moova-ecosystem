import api from "../../lib/axios";

export const eventsApi = {
  getEvents: (params?: Record<string, any>) =>
    api.get("/api/events/public", { params }),

  getPublicEvents: (params?: Record<string, any>) =>
    api.get("/api/events/public", { params }),

  getStudentEvents: (params?: Record<string, any>) =>
    api.get("/api/events/student", { params }),

  getStudentEventBySlug: (slug: string) =>
    api.get(`/api/student/events/${slug}`),

  getJudgeEvents: () => api.get("/api/events/judge"),

  getAdminEvents: (params?: Record<string, any>) =>
    api.get("/api/events/admin", { params }),

  getEvent: (id: string) => api.get(`/api/events/${id}`),

  registerToEvent: (id: string, data: { teamId?: string }) =>
    api.post(`/api/events/${id}/register`, data),

  bookmarkEvent: (id: string) => api.post(`/api/events/${id}/bookmark`),

  unbookmarkEvent: (id: string) => api.delete(`/api/events/${id}/bookmark`),

  getQa: (eventId: string, params?: Record<string, any>) =>
    api.get(`/api/events/${eventId}/qa`, { params }),

  postQuestion: (eventId: string, text: string) =>
    api.post(`/api/events/${eventId}/qa`, { text }),

  postReply: (eventId: string, questionId: string, text: string) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/replies`, { text }),

  toggleUpvote: (eventId: string, questionId: string) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/upvote`),
};
