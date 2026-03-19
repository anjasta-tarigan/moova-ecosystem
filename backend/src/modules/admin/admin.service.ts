import prisma from "../../config/database";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"];
const JUDGING_STAGES = ["ABSTRACT", "PAPER", "FINAL"];
const SUBMISSION_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "SCORED",
];

const parsePagination = (page?: number, limit?: number) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  return { page: p < 1 ? 1 : p, limit: l < 1 ? 10 : l };
};

export const dashboard = async () => {
  const [
    totalSiswa,
    totalEvents,
    totalSubmissions,
    totalTeams,
    totalCertificates,
    eventsByStatus,
    submissionsByStatus,
    recentRegistrations,
    topEvents,
  ] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.event.count(),
    prisma.submission.count(),
    prisma.team.count(),
    prisma.certificate.count(),
    prisma.event.groupBy({ by: ["status"], _count: true }),
    prisma.submission.groupBy({ by: ["status"], _count: true }),
    prisma.eventRegistration.findMany({
      include: { user: true, event: true },
      orderBy: { registeredAt: "desc" },
      take: 10,
    }),
    prisma.event.findMany({
      include: { registrations: true },
      orderBy: { registrations: { _count: "desc" } },
      take: 5,
    }),
  ]);

  return {
    totalSiswa,
    totalEvents,
    totalSubmissions,
    totalTeams,
    totalCertificates,
    eventsByStatus,
    submissionsByStatus,
    recentRegistrations,
    topEvents: topEvents.map((e: any) => ({
      ...e,
      registrationCount: e.registrations.length,
    })),
  };
};

export const listEvents = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (query.search)
    where.title = { contains: query.search, mode: "insensitive" };
  if (query.status && EVENT_STATUSES.includes(query.status))
    where.status = query.status;

  const [total, data] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: { registrations: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const mapped = data.map((e: any) => ({
    ...e,
    registrationCount: e.registrations.length,
  }));
  return { data: mapped, total, page, limit };
};

export const createEvent = async (data: any, adminId: string) => {
  return prisma.event.create({
    data: {
      ...data,
      createdById: adminId,
      timeline: { create: data.timeline || [] },
      faqs: { create: data.faqs || [] },
      categories: { create: data.categories || [] },
    },
  });
};

export const updateEvent = async (id: string, data: any) => {
  return prisma.$transaction(async (tx) => {
    await tx.eventTimeline.deleteMany({ where: { eventId: id } });
    await tx.eventFaq.deleteMany({ where: { eventId: id } });
    await tx.eventCategory.deleteMany({ where: { eventId: id } });

    return tx.event.update({
      where: { id },
      data: {
        ...data,
        timeline: { create: data.timeline || [] },
        faqs: { create: data.faqs || [] },
        categories: { create: data.categories || [] },
      },
    });
  });
};

export const updateEventStatus = async (id: string, status: string) => {
  return prisma.event.update({
    where: { id },
    data: { status: status as any },
  });
};

export const deleteEvent = async (id: string) => {
  const registrations = await prisma.eventRegistration.count({
    where: { eventId: id },
  });
  if (registrations > 0) throw new Error("Has registrations");
  return prisma.event.delete({ where: { id } });
};

export const listSubmissions = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (query.eventId) where.eventId = query.eventId;
  if (query.status && SUBMISSION_STATUSES.includes(query.status))
    where.status = query.status;
  if (query.stage && JUDGING_STAGES.includes(query.stage))
    where.currentStage = query.stage;

  const [total, data] = await Promise.all([
    prisma.submission.count({ where }),
    prisma.submission.findMany({
      where,
      include: { team: true, event: true, scores: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { data, total, page, limit };
};

export const advanceStage = async (id: string, stage: string) => {
  return prisma.submission.update({
    where: { id },
    data: { currentStage: stage as any },
  });
};

export const createCertificate = async (data: any) =>
  prisma.certificate.create({ data });

export const listCertificates = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where: any = {};
  if (query.eventId) where.eventId = query.eventId;
  if (query.type) where.type = query.type;

  const [total, data] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      include: { event: true, recipient: true },
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

export const listSiswa = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where: any = { role: "STUDENT" };
  if (query.search)
    where.fullName = { contains: query.search, mode: "insensitive" };
  if (query.province)
    where.profile = {
      province: { equals: query.province, mode: "insensitive" },
    };
  if (query.schoolLevel)
    where.profile = {
      schoolLevel: { equals: query.schoolLevel, mode: "insensitive" },
    };

  const [total, data] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { profile: true },
      skip,
      take: limit,
    }),
  ]);

  return { data, total, page, limit };
};

export const getSiswaDetail = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      teamMemberships: { include: { team: true } },
      submissions: true,
    },
  });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  return user;
};

export const eventReport = async (eventId: string) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const [registrationCount, submissionCount, scoredCount, scoresByCategory] =
    await Promise.all([
      prisma.eventRegistration.count({ where: { eventId } }),
      prisma.submission.count({ where: { eventId } }),
      prisma.score.count({
        where: { submission: { eventId }, status: "SUBMITTED" },
      }),
      prisma.submission.groupBy({
        by: ["categoryId"],
        _count: true,
      }),
    ]);

  const topSubmissions = await prisma.submission.findMany({
    where: { eventId },
    include: { scores: true, team: true },
    orderBy: { scores: { _count: "desc" } },
    take: 10,
  });

  const scoresByCategoryDetailed = await Promise.all(
    scoresByCategory.map(async (c: any) => {
      const category = await prisma.eventCategory.findUnique({
        where: { id: c.categoryId! },
      });
      const avgScore = await prisma.score.aggregate({
        where: {
          submission: { categoryId: c.categoryId },
          status: "SUBMITTED",
        },
        _avg: { totalScore: true },
      });
      return {
        categoryName: category?.name || "Unknown",
        avgScore: avgScore._avg.totalScore || 0,
        count: c._count,
      };
    }),
  );

  const averageScoreAgg = await prisma.score.aggregate({
    where: { submission: { eventId }, status: "SUBMITTED" },
    _avg: { totalScore: true },
  });

  return {
    registrationCount,
    submissionCount,
    scoredCount,
    averageScore: averageScoreAgg._avg.totalScore || 0,
    scoresByCategory: scoresByCategoryDetailed,
    topSubmissions,
  };
};
