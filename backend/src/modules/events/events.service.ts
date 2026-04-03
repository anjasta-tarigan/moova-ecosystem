import prisma from "../../config/database";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"] as const;
const PUBLIC_EVENT_STATUSES = ["OPEN", "UPCOMING", "CLOSED"] as const;
const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"] as const;

const parsePagination = (page?: number, limit?: number) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  return { page: p < 1 ? 1 : p, limit: l < 1 ? 10 : l };
};

const baseListSelect = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  date: true,
  deadline: true,
  location: true,
  format: true,
  category: true,
  image: true,
  status: true,
  fee: true,
  teamSizeMin: true,
  teamSizeMax: true,
  organizer: true,
  _count: { select: { registrations: true, submissions: true } },
} as const;

const buildCatalogWhere = (
  query: any,
  allowedStatuses: readonly string[] | null = null,
) => {
  const where: any = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { shortDescription: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.category)
    where.category = { equals: query.category, mode: "insensitive" };

  if (query.format && EVENT_FORMATS.includes(query.format))
    where.format = query.format;

  if (allowedStatuses) {
    where.status = { in: allowedStatuses };
    if (query.status && allowedStatuses.includes(query.status)) {
      where.status = query.status;
    }
  } else if (query.status && EVENT_STATUSES.includes(query.status)) {
    where.status = query.status;
  }

  return where;
};

export const listPublicEvents = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where = buildCatalogWhere(query, PUBLIC_EVENT_STATUSES);

  const [total, data] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: baseListSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { data, total, page, limit };
};

export const listEvents = listPublicEvents;

export const listStudentEvents = async (userId: string, query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);

  const registrations = await prisma.eventRegistration.findMany({
    where: { userId },
    include: {
      team: { select: { name: true } },
      event: { select: baseListSelect },
    },
    orderBy: { registeredAt: "desc" },
  });

  const registeredEventIds = registrations.map((item) => item.eventId);

  const discoverWhere = buildCatalogWhere(query, PUBLIC_EVENT_STATUSES);
  if (registeredEventIds.length) {
    discoverWhere.id = { notIn: registeredEventIds };
  }

  const skip = (page - 1) * limit;
  const [discoverTotal, discover] = await Promise.all([
    prisma.event.count({ where: discoverWhere }),
    prisma.event.findMany({
      where: discoverWhere,
      select: baseListSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    registered: registrations,
    discover,
    page,
    limit,
    total: discoverTotal,
    totalPages: Math.ceil(discoverTotal / limit),
  };
};

export const listJudgeEvents = async (judgeId: string) => {
  const assignments = await prisma.judgeAssignment.findMany({
    where: {
      judgeId,
      status: "ACTIVE",
      event: { status: { in: PUBLIC_EVENT_STATUSES } },
    },
    include: {
      event: { select: baseListSelect },
      category: { select: { id: true, name: true } },
    },
  });

  const enriched = await Promise.all(
    assignments.map(async (assignment) => {
      const submissions = await prisma.submission.count({
        where: {
          categoryId: assignment.categoryId,
          currentStage: assignment.currentStage,
        },
      });

      const scored = await prisma.score.count({
        where: {
          judgeId,
          stage: assignment.currentStage,
          submission: { categoryId: assignment.categoryId },
          status: "SUBMITTED",
        },
      });

      return {
        id: assignment.id,
        status: assignment.status,
        currentStage: assignment.currentStage,
        event: assignment.event,
        category: assignment.category,
        submissions,
        submittedScores: scored,
        progress:
          submissions === 0 ? 0 : Math.round((scored / submissions) * 100),
      };
    }),
  );

  // Consolidate assignments by event for cleaner UI consumption
  const grouped = new Map<string, any>();
  for (const item of enriched) {
    const existing = grouped.get(item.event.id);
    if (!existing) {
      grouped.set(item.event.id, {
        event: item.event,
        assignments: [],
        submissions: 0,
        submittedScores: 0,
      });
    }
    const current = grouped.get(item.event.id);
    current.assignments.push({
      id: item.id,
      category: item.category,
      currentStage: item.currentStage,
      status: item.status,
      submissions: item.submissions,
      submittedScores: item.submittedScores,
      progress: item.progress,
    });
    current.submissions += item.submissions;
    current.submittedScores += item.submittedScores;
  }

  return Array.from(grouped.values()).map((entry) => ({
    ...entry,
    progress:
      entry.submissions === 0
        ? 0
        : Math.round((entry.submittedScores / entry.submissions) * 100),
  }));
};

export const listAdminEvents = async (query: any) => {
  const { page, limit } = parsePagination(query.page, query.limit);
  const skip = (page - 1) * limit;
  const where = buildCatalogWhere(query, null);

  const [total, data] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      select: baseListSelect,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { data, total, page, limit };
};

export const getEventById = async (id: string, role?: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      timeline: true,
      faqs: true,
      categories: true,
      _count: { select: { registrations: true, submissions: true } },
    },
  });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const canViewDraft = role === "ADMIN" || role === "SUPERADMIN";
  if (event.status === "DRAFT" && !canViewDraft) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const registrationCount = event._count?.registrations ?? 0;
  return { ...event, registrationCount };
};

export const registerEvent = async (
  eventId: string,
  userId: string,
  teamId?: string,
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (event.status !== "OPEN") {
    throw new Error("Event not open");
  }

  const profile = await prisma.siswaProfile.findUnique({ where: { userId } });
  if (!profile || profile.completeness < 80) {
    throw new Error("Profile incomplete");
  }

  const exists = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId } },
  });
  if (exists) {
    throw new Error("Already registered");
  }

  let selectedTeamId: string | undefined;
  if (teamId) {
    const membership = await prisma.teamMember.findFirst({
      where: { teamId, userId },
    });
    if (!membership) {
      throw new Error("Not team member");
    }
    selectedTeamId = teamId;
  }

  return prisma.eventRegistration.create({
    data: { eventId, userId, teamId: selectedTeamId },
  });
};

export const listQuestions = async (
  eventId: string,
  page: number,
  limit: number,
) => {
  const skip = (page - 1) * limit;
  const [total, questions] = await Promise.all([
    prisma.qaQuestion.count({ where: { eventId } }),
    prisma.qaQuestion.findMany({
      where: { eventId },
      include: {
        user: true,
        replies: { include: { user: true }, orderBy: { createdAt: "asc" } },
        upvotes: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const data = questions.map((q: any) => ({
    ...q,
    upvoteCount: q.upvotes.length,
  }));

  return { data, total, page, limit };
};

export const createQuestion = async (
  eventId: string,
  userId: string,
  text: string,
) => {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  return prisma.qaQuestion.create({ data: { eventId, userId, text } });
};

export const createReply = async (
  questionId: string,
  userId: string,
  text: string,
  role: string,
) => {
  const question = await prisma.qaQuestion.findUnique({
    where: { id: questionId },
    include: { event: true },
  });
  if (!question) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const isOrganizer = role === "ADMIN" || role === "SUPERADMIN";
  return prisma.qaReply.create({
    data: { questionId, userId, text, isOrganizer },
  });
};

export const toggleUpvote = async (questionId: string, userId: string) => {
  const question = await prisma.qaQuestion.findUnique({
    where: { id: questionId },
  });
  if (!question) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const existing = await prisma.qaUpvote.findUnique({
    where: { questionId_userId: { questionId, userId } },
  });
  if (existing) {
    await prisma.qaUpvote.delete({ where: { id: existing.id } });
    const count = await prisma.qaUpvote.count({ where: { questionId } });
    return { upvoteCount: count, isUpvoted: false };
  }
  await prisma.qaUpvote.create({ data: { questionId, userId } });
  const count = await prisma.qaUpvote.count({ where: { questionId } });
  return { upvoteCount: count, isUpvoted: true };
};
