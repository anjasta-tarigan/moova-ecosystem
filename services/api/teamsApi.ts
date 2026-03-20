import api from "../../lib/axios";

export const teamsApi = {
  getMyTeams: () => api.get("/api/teams"),
  getTeam: (id: string) => api.get(`/api/teams/${id}`),
  createTeam: (name: string, description?: string) =>
    api.post("/api/teams", { name, description: description || "" }),
  joinTeam: (code: string) => api.post("/api/teams/join", { code }),
  updateTeam: (id: string, name: string) =>
    api.put(`/api/teams/${id}`, { name }),
  disbandTeam: (id: string) => api.delete(`/api/teams/${id}`),
  leaveTeam: (id: string) => api.delete(`/api/teams/${id}/leave`),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
  updateMemberRole: (teamId: string, userId: string, role: string) =>
    api.patch(`/api/teams/${teamId}/members/${userId}/role`, { role }),
  searchStudents: (q: string, teamId?: string) =>
    api.get("/api/teams/search/students", {
      params: { q, teamId },
    }),
  searchMentors: (q: string, teamId?: string) =>
    api.get("/api/teams/search/mentors", {
      params: { q, teamId },
    }),
  inviteMember: (teamId: string, userId: string) =>
    api.post(`/api/teams/${teamId}/invite`, { userId }),
  assignMentor: (teamId: string, userId: string) =>
    api.post(`/api/teams/${teamId}/mentor`, { userId }),
  removeMentor: (teamId: string, userId: string) =>
    api.delete(`/api/teams/${teamId}/mentor/${userId}`),
};
