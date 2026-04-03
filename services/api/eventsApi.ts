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

  getStudentWorkspaceAccess: (slug: string) =>
    api.get(`/api/student/events/${slug}/workspace-access`),

  getJudgeEvents: () => api.get("/api/events/judge"),

  getAdminEvents: (params?: Record<string, any>) =>
    api.get("/api/events/admin", { params }),

  getEvent: (id: string) => api.get(`/api/events/${id}`),

  getEventBySlug: (slug: string) => api.get(`/api/events/slug/${slug}`),

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

  getCommunityThreads: (
    eventId: string,
    params?: { page?: number; limit?: number; sort?: "top" | "latest" },
  ) => api.get(`/api/events/${eventId}/community/threads`, { params }),

  createCommunityThread: (
    eventId: string,
    data: { title: string; content: string },
  ) => api.post(`/api/events/${eventId}/community/threads`, data),

  getCommunityMessages: (eventId: string, threadId: string) =>
    api.get(`/api/events/${eventId}/community/threads/${threadId}/messages`),

  createCommunityMessage: (
    eventId: string,
    threadId: string,
    content: string,
  ) =>
    api.post(`/api/events/${eventId}/community/threads/${threadId}/messages`, {
      content,
    }),

  toggleCommunityThreadLike: (eventId: string, threadId: string) =>
    api.post(`/api/events/${eventId}/community/threads/${threadId}/likes`),

  toggleCommunityMessageLike: (eventId: string, messageId: string) =>
    api.post(`/api/events/${eventId}/community/messages/${messageId}/likes`),
};
