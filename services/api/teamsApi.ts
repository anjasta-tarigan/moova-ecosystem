import api from "../../lib/axios";

export const teamsApi = {
  getMyTeams: () => api.get("/api/teams"),
  getTeam: (id: string) => api.get(`/api/teams/${id}`),
  createTeam: (name: string) => api.post("/api/teams", { name }),
  joinTeam: (code: string) => api.post("/api/teams/join", { code }),
  updateTeam: (id: string, name: string) =>
    api.put(`/api/teams/${id}`, { name }),
  disbandTeam: (id: string) => api.delete(`/api/teams/${id}`),
  leaveTeam: (id: string) => api.delete(`/api/teams/${id}/leave`),
  removeMember: (teamId: string, userId: string) =>
    api.delete(`/api/teams/${teamId}/members/${userId}`),
  updateMemberRole: (teamId: string, userId: string, role: string) =>
    api.patch(`/api/teams/${teamId}/members/${userId}/role`, { role }),
};
