import prisma from "../../config/database";

export const verifyCertificate = async (id: string) => {
  const cert = await prisma.certificate.findUnique({
    where: { id },
    include: { recipient: true, event: true },
  });
  if (!cert) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  return cert;
};

export const listMyCertificates = async (userId: string) => {
  return prisma.certificate.findMany({
    where: { recipientId: userId },
    include: { event: true },
  });
};

export const createCertificate = async (data: {
  recipientId: string;
  eventId: string;
  type: string;
  award: string;
  issuedBy: string;
}) => {
  return prisma.certificate.create({ data: data as any });
};

export const listCertificates = async (query: any) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (query.eventId) where.eventId = query.eventId;
  if (query.type) where.type = query.type;

  const [total, data] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      include: { event: true, recipient: true },
      skip,
      take: limit,
    }),
  ]);
  return { data, total, page, limit };
};

export const revokeCertificate = async (id: string, reason: string) => {
  return prisma.certificate.update({
    where: { id },
    data: { status: "REVOKED", revocationReason: reason },
  });
};
