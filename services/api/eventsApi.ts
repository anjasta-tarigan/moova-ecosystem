import api from "../../lib/axios";

export const eventsApi = {
  getEvents: (params?: Record<string, any>) =>
    api.get("/api/events", { params }),

  getEvent: (id: string) => api.get(`/api/events/${id}`),

  registerToEvent: (id: string, data: { teamId?: string }) =>
    api.post(`/api/events/${id}/register`, data),

  getQa: (eventId: string, params?: Record<string, any>) =>
    api.get(`/api/events/${eventId}/qa`, { params }),

  postQuestion: (eventId: string, text: string) =>
    api.post(`/api/events/${eventId}/qa`, { text }),

  postReply: (eventId: string, questionId: string, text: string) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/replies`, { text }),

  toggleUpvote: (eventId: string, questionId: string) =>
    api.post(`/api/events/${eventId}/qa/${questionId}/upvote`),
};
