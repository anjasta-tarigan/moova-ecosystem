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

const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"];

const validationError = (message: string) => {
  const err: any = new Error(message);
  err.code = "VALIDATION_ERROR";
  err.status = 400;
  return err;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const sanitizeRichText = (value: string) =>
  (value || "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").trim();

const ensureValidDates = (date: string, deadline: string) => {
  const eventDate = new Date(date);
  const deadlineDate = new Date(deadline);
  if (
    Number.isNaN(eventDate.getTime()) ||
    Number.isNaN(deadlineDate.getTime())
  ) {
    throw validationError("Invalid date or deadline format");
  }
  if (deadlineDate > eventDate) {
    throw validationError("Deadline must be on or before the event date");
  }
};

const toRegistrationEndDate = (deadline: string) => {
  const trimmedDeadline = deadline.trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDeadline);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  }

  const parsed = new Date(trimmedDeadline);
  if (Number.isNaN(parsed.getTime())) {
    throw validationError("Invalid date or deadline format");
  }

  return parsed;
};

const ensureLocationValid = (format: string, location: string) => {
  const trimmed = location.trim();
  if (!trimmed) throw validationError("Location is required");
  if (format === "ONLINE") {
    const urlPattern = /^https?:\/\//i;
    if (!urlPattern.test(trimmed)) {
      throw validationError(
        "Online format requires a valid meeting link (https)",
      );
    }
  }
};

const ensureSlugUnique = async (slug: string, eventId?: string) => {
  let candidate = slug;
  let attempt = 0;
  // retry a few times with random suffix to guarantee uniqueness
  while (attempt < 5) {
    const existing = await prisma.event.findUnique({
      where: { slug: candidate },
    });
    if (!existing || (eventId && existing.id === eventId)) return candidate;
    candidate = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    attempt += 1;
  }
  return candidate;
};

const normalizeEventPayload = async (data: any, eventId?: string) => {
  const title = (data.title || "").trim();
  if (title.length < 5)
    throw validationError("Title must be at least 5 characters");

  const baseSlug = (data.slug || title).trim();
  const parsedSlug = slugify(baseSlug);
  if (parsedSlug.length < 5)
    throw validationError("Slug must be at least 5 characters");
  const slug = await ensureSlugUnique(parsedSlug, eventId);

  const shortDescription = (data.shortDescription || "").trim();
  if (!shortDescription) throw validationError("Short description is required");
  if (shortDescription.length > 250)
    throw validationError("Short description must not exceed 250 characters");

  const fullDescription = sanitizeRichText(String(data.fullDescription || ""));
  if (fullDescription.length < 20)
    throw validationError("Full description must be at least 20 characters");

  const format = data.format;
  if (!EVENT_FORMATS.includes(format))
    throw validationError("Invalid event format");

  const location = String(data.location || "").trim();
  ensureLocationValid(format, location);

  ensureValidDates(String(data.date || ""), String(data.deadline || ""));
  const registrationEndDate = toRegistrationEndDate(
    String(data.deadline || ""),
  );

  const teamSizeMin = Number(data.teamSizeMin ?? 1);
  const teamSizeMax = Number(data.teamSizeMax ?? 1);
  if (Number.isNaN(teamSizeMin) || teamSizeMin < 1)
    throw validationError("Min team size must be at least 1");
  if (Number.isNaN(teamSizeMax) || teamSizeMax < teamSizeMin)
    throw validationError(
      "Max team size must be greater than or equal to min team size",
    );

  const normalizedSdgs = Array.isArray(data.sdgs)
    ? data.sdgs
        .map((value: any) => Number(value))
        .filter((num: number) => Number.isInteger(num) && num > 0)
    : [];

  const normalizedEligibility = Array.isArray(data.eligibility)
    ? data.eligibility.map((item: any) => String(item).trim()).filter(Boolean)
    : typeof data.eligibility === "string"
      ? data.eligibility
          .split(/\r?\n/)
          .map((item: string) => item.trim())
          .filter(Boolean)
      : [];

  const status = EVENT_STATUSES.includes(data.status) ? data.status : "DRAFT";

  return {
    ...data,
    title,
    slug,
    shortDescription,
    fullDescription,
    format,
    location,
    date: String(data.date || ""),
    deadline: String(data.deadline || ""),
    registrationEndDate,
    fee: (data.fee || "Gratis").trim() || "Gratis",
    organizer: (data.organizer || "GIVA").trim() || "GIVA",
    theme: data.theme || "",
    prizePool: data.prizePool || "",
    teamSizeMin,
    teamSizeMax,
    eligibility: normalizedEligibility,
    sdgs: normalizedSdgs,
    status,
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
  };
};

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
  const normalized = await normalizeEventPayload(data);
  const { timeline, faqs, categories, ...base } = normalized;

  return prisma.event.create({
    data: {
      ...base,
      createdById: adminId,
      timeline: { create: timeline },
      faqs: { create: faqs },
      categories: { create: categories },
    },
  });
};

export const updateEvent = async (id: string, data: any) => {
  const normalized = await normalizeEventPayload(data, id);
  const { timeline, faqs, categories, ...base } = normalized;

  return prisma.$transaction(async (tx) => {
    await tx.eventTimeline.deleteMany({ where: { eventId: id } });
    await tx.eventFaq.deleteMany({ where: { eventId: id } });
    await tx.eventCategory.deleteMany({ where: { eventId: id } });

    return tx.event.update({
      where: { id },
      data: {
        ...base,
        timeline: { create: timeline },
        faqs: { create: faqs },
        categories: { create: categories },
      },
    });
  });
};

export const updateEventStatus = async (id: string, status: string) => {
  if (!EVENT_STATUSES.includes(status))
    throw validationError("Invalid event status");
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
  if (query.type) where.awardType = query.type;

  const [total, data] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      include: { event: true, user: true },
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
