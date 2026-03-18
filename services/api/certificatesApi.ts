import api from "../../lib/axios";

export const certificatesApi = {
  verify: (id: string) => api.get(`/api/certificates/verify/${id}`),
};
