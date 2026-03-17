import prisma from "../../config/database";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"];
const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"];

const parsePagination = (page?: number, limit?: number) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  return { page: p < 1 ? 1 : p, limit: l < 1 ? 10 : l };
};

export const listEvents = async (query: any) => {
  const { page, limit } = parsePagination(
    Number(query.page),
    Number(query.limit),
  );
  const skip = (page - 1) * limit;
  const where: any = {};

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: "insensitive" } },
      { shortDescription: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.category)
    where.category = { equals: query.category, mode: "insensitive" };
  if (query.status && EVENT_STATUSES.includes(query.status))
    where.status = query.status;
  if (query.format && EVENT_FORMATS.includes(query.format))
    where.format = query.format;

  const [total, data] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      include: { categories: true },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return { data, total, page, limit };
};

export const getEventById = async (id: string) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      timeline: true,
      faqs: true,
      categories: true,
      registrations: true,
    },
  });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const registrationCount = event.registrations.length;
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
