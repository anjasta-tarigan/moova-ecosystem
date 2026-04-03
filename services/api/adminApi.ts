import api from "../../lib/axios";

export const adminApi = {
  // Dashboard
  getDashboard: () => api.get("/api/admin/dashboard"),
  getSystemStats: () => api.get("/api/superadmin/system-stats"),

  // Events CRUD
  getEvents: (params?: Record<string, any>) =>
    api.get("/api/events/admin", { params }),
  createEvent: (data: Record<string, any>) =>
    api.post("/api/admin/events", data),
  updateEvent: (id: string, data: Record<string, any>) =>
    api.put(`/api/admin/events/${id}`, data),
  getManageEvent: (id: string) => api.get(`/api/admin/events/${id}/manage`),
  patchEventConfig: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/config`, data),
  patchEventFaqs: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/faqs`, data),
  patchEventCriteria: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/criteria`, data),
  patchEventTimeline: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/timeline`, data),
  patchEventRules: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/rules`, data),
  patchEventResources: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/resources`, data),
  patchEventJudges: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/judges`, data),
  patchEventStages: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/stages`, data),
  patchEventAwards: (id: string, data: Record<string, any>) =>
    api.patch(`/api/admin/events/${id}/awards`, data),
  getEventTaxonomies: () => api.get("/api/admin/events/taxonomies"),
  createEventTypeTaxonomy: (name: string) =>
    api.post("/api/admin/events/taxonomies/types", { name }),
  createEventEligibilityTaxonomy: (name: string) =>
    api.post("/api/admin/events/taxonomies/eligibilities", { name }),
  // Backward-compatible aliases used by older admin pages
  getEventFinalization: (id: string) =>
    api.get(`/api/admin/events/${id}/manage`),
  updateEventStages: (id: string, stages: any[]) =>
    api.patch(`/api/admin/events/${id}/stages`, { stages }),
  updateEventCriteria: (id: string, criteria: any[]) =>
    api.patch(`/api/admin/events/${id}/criteria`, { criteria }),
  updateEventAwards: (id: string, awards: any[]) =>
    api.patch(`/api/admin/events/${id}/awards`, {
      awardsEnabled: true,
      awards,
    }),
  updateEventResources: (id: string, resources: any[]) =>
    api.patch(`/api/admin/events/${id}/resources`, { resources }),
  uploadEventBanner: (data: FormData) =>
    api.post("/api/admin/events/banner", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  uploadEventResources: (data: FormData) =>
    api.post("/api/admin/events/resources/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateEventStatus: (id: string, status: string) =>
    api.patch(`/api/admin/events/${id}/status`, { status }),
  deleteEvent: (id: string) => api.delete(`/api/admin/events/${id}`),

  // Submissions
  getSubmissions: (params?: Record<string, any>) =>
    api.get("/api/admin/submissions", { params }),
  advanceStage: (id: string, stage: string) =>
    api.patch(`/api/admin/submissions/${id}/stage`, { stage }),

  // Students
  getStudents: (params?: Record<string, any>) =>
    api.get("/api/admin/siswa", { params }),
  getStudent: (id: string) => api.get(`/api/admin/siswa/${id}`),
  toggleStudentActive: (id: string) =>
    api.patch(`/api/superadmin/users/${id}/toggle-active`),
  deleteStudent: (id: string) => api.delete(`/api/superadmin/users/${id}`),

  // Legacy aliases
  getSiswaList: (params?: Record<string, any>) =>
    api.get("/api/admin/siswa", { params }),
  getSiswaDetail: (id: string) => api.get(`/api/admin/siswa/${id}`),

  // Certificates
  getCertificates: (params?: Record<string, any>) =>
    api.get("/api/admin/certificates", { params }),
  createCertificate: (data: Record<string, any>) =>
    api.post("/api/admin/certificates", data),
  revokeCertificate: (id: string, reason: string) =>
    api.patch(`/api/admin/certificates/${id}/revoke`, { reason }),

  // Reports
  getEventReport: (eventId: string) =>
    api.get(`/api/admin/reports/event/${eventId}`),

  // Superadmin — Users
  getAdminJudgeUsers: (params?: Record<string, any>) =>
    api.get("/api/superadmin/users", { params }),
  createAdminOrJudge: (data: Record<string, any>) =>
    api.post("/api/superadmin/users", data),
  updateAdminOrJudge: (id: string, data: Record<string, any>) =>
    api.put(`/api/superadmin/users/${id}`, data),
  toggleUserActive: (id: string) =>
    api.patch(`/api/superadmin/users/${id}/toggle-active`),
  deleteAdminOrJudge: (id: string) => api.delete(`/api/superadmin/users/${id}`),

  // Superadmin — Judge Assignments
  createJudgeAssignment: (data: Record<string, any>) =>
    api.post("/api/superadmin/judge-assignments", data),
};

export interface CertificatePayload {
  userId: string;
  eventId?: string;
  awardType: "WINNER" | "PARTICIPANT" | "JUDGE" | "MENTOR" | "CUSTOM";
  customTitle?: string;
  rankLabel?: string;
  templateId?: string;
  bgDataUrl?: string;
}

export const issueCertificate = (data: CertificatePayload) =>
  api.post("/api/admin/certificates", data);

export const getAdminCertificates = (params?: {
  userId?: string;
  eventId?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}) => api.get("/api/admin/certificates", { params });

export const revokeCertificate = (certCode: string, reason: string) =>
  api.delete(`/api/admin/certificates/${certCode}`, { data: { reason } });
