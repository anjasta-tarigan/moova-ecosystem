import api from "../../lib/axios";

export const verifyCertificate = (certCode: string) =>
  api.get(`/api/certificates/verify/${certCode}`);

export const getMyCertificates = () => api.get("/api/user/certificates");
