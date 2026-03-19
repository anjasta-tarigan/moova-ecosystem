import prisma from "../../config/database";

const parsePagination = (page?: number, limit?: number) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  return { page: p < 1 ? 1 : p, limit: l < 1 ? 10 : l };
};

export const listUsers = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const allowedRoles = ["ADMIN", "JUDGE"];
  const where: any = { role: { in: allowedRoles } };
  if (query.search)
    where.fullName = { contains: query.search, mode: "insensitive" };
  if (query.role && allowedRoles.includes(query.role)) where.role = query.role;

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, skip, take: limit }),
  ]);
  return { data, total, page, limit };
};

export const createUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}) => {
  return prisma.user.create({ data: { ...data, role: data.role as any } });
};

export const updateUser = async (
  id: string,
  data: Partial<{ fullName: string; email: string; password: string }>,
) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (user.role === "SUPERADMIN") throw new Error("Cannot edit superadmin");
  return prisma.user.update({ where: { id }, data });
};

export const toggleActive = async (id: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (user.role === "SUPERADMIN") throw new Error("Cannot edit superadmin");
  return prisma.user.update({
    where: { id },
    data: { isActive: !user.isActive },
  });
};

export const deleteUser = async (id: string, currentUserId: string) => {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (user.role === "SUPERADMIN") throw new Error("Cannot delete superadmin");
  if (user.id === currentUserId) throw new Error("Cannot delete self");
  return prisma.user.delete({ where: { id } });
};

export const createAssignment = async (data: {
  judgeId: string;
  eventId?: string;
  categoryId: string;
  currentStage?: string;
}) => {
  const judge = await prisma.user.findUnique({ where: { id: data.judgeId } });
  if (!judge || judge.role !== "JUDGE") throw new Error("Invalid judge");
  const category = await prisma.eventCategory.findUnique({
    where: { id: data.categoryId },
  });
  if (!category) throw new Error("Invalid category");
  if (data.eventId && category.eventId !== data.eventId)
    throw new Error("Invalid category");
  return prisma.judgeAssignment.create({
    data: {
      ...data,
      eventId: category.eventId,
      currentStage: (data.currentStage ?? "ABSTRACT") as any,
      status: "ACTIVE" as any,
    },
  });
};

export const deleteAssignment = async (id: string) => {
  return prisma.judgeAssignment.delete({ where: { id } });
};

export const systemStats = async () => {
  const [
    totalUsers,
    totalEvents,
    totalSubmissions,
    totalScores,
    totalCertificates,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.event.count(),
    prisma.submission.count(),
    prisma.score.count(),
    prisma.certificate.count(),
  ]);

  // uploads folder size omitted here; requires fs stat. We'll approximate with 0.
  return {
    totalUsers,
    totalEvents,
    totalSubmissions,
    totalScores,
    totalCertificates,
    storageUsed: 0,
  };
};
