import prisma from "../../config/database";
import {
  buildEventCustomIdCandidate,
  parseDateSafely,
  resolveComputedEventStatus,
  slugifyEventName,
  toUtcDayEnd,
} from "../events/event-lifecycle";
import { publishEventUpdate } from "../events/events.realtime";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"];
const JUDGING_STAGES = ["ABSTRACT", "PAPER", "FINAL"];
const EVENT_STAGE_TYPES = ["ABSTRACT", "PAPER", "FINAL"];
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

  while (attempt < 50) {
    const existing = await prisma.event.findUnique({
      where: { slug: candidate },
    });
    if (!existing || (eventId && existing.id === eventId)) return candidate;

    attempt += 1;
    candidate = `${slug}-${attempt + 1}`;
  }

  const err: any = new Error(
    "Unable to generate a unique slug. Try a different event name.",
  );
  err.code = "SLUG_CONFLICT";
  err.status = 409;
  throw err;
};

const getEventTaxonomyLists = async () => {
  const [eventTypes, eligibilityCategories] = await Promise.all([
    prisma.eventTypeTaxonomy.findMany({ orderBy: { name: "asc" } }),
    prisma.eventEligibilityTaxonomy.findMany({ orderBy: { name: "asc" } }),
  ]);

  return { eventTypes, eligibilityCategories };
};

const createTaxonomyResponse = async (
  created: { id: string; name: string },
  kind: "eventType" | "eligibility",
) => {
  const lists = await getEventTaxonomyLists();
  return {
    created,
    kind,
    ...lists,
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
    status: resolveComputedEventStatus({
      persistedStatus: e.status,
      registrationOpenDate: e.registrationOpenDate,
      registrationCloseDate: e.registrationCloseDate,
      deadline: e.deadline,
      capacity: e.capacity,
      participantCount: e.registrations.length,
    }),
    registrationCount: e.registrations.length,
  }));
  return { data: mapped, total, page, limit };
};

export const createEvent = async (data: any, adminId: string) => {
  const normalized = await normalizeEventPayload(data);
  const {
    timeline,
    faqs,
    categories,
    criteria,
    resources,
    stages,
    awards,
    ...base
  } = normalized;

  return prisma.event.create({
    data: {
      ...base,
      createdById: adminId,
      timeline: { create: timeline },
      faqs: { create: faqs },
      categories: { create: categories },
      criteria: { create: criteria },
      resources: { create: resources },
      stages: { create: stages },
      awards: { create: awards },
    },
  });
};
const ensureCustomIdUnique = async () => {
  let candidate = buildEventCustomIdCandidate();
  let attempt = 0;

  while (attempt < 6) {
    const existing = await prisma.event.findUnique({
      where: { customId: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = buildEventCustomIdCandidate();
    attempt += 1;
  }

  throw validationError("Failed to generate unique event ID");
};

const normalizeEligibility = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [] as string[];
};

const normalizeDateInput = (value: unknown, fallback: Date) => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }
  return fallback.toISOString().slice(0, 10);
};

const ensureValidStages = (stages: Array<any>) => {
  const seen = new Set<string>();

  return stages.map((item) => {
    const stageType = String(item.stageType || item.type || "").toUpperCase();
    if (!EVENT_STAGE_TYPES.includes(stageType)) {
      throw validationError("Invalid stage type");
    }
    if (seen.has(stageType)) {
      throw validationError("Duplicate stage type is not allowed");
    }

    const startAt = parseDateSafely(item.startAt);
    const deadlineAt = parseDateSafely(item.deadlineAt);
    if (!startAt || !deadlineAt) {
      throw validationError("Stage start and deadline are required");
    }
    if (deadlineAt.getTime() <= startAt.getTime()) {
      throw validationError("Stage deadline must be after start time");
    }

    seen.add(stageType);
    return {
      stageType,
      startAt,
      deadlineAt,
    };
  });
};

const normalizeEventPayload = async (data: any, eventId?: string) => {
  const title = String(data.title || data.name || "").trim();
  if (title.length < 3)
    throw validationError("Event name must be at least 3 characters");

  const baseSlug = String(data.slug || title).trim();
  const parsedSlug = slugifyEventName(baseSlug);
  if (parsedSlug.length < 3)
    throw validationError("Slug must be at least 3 characters");
  const slug = await ensureSlugUnique(parsedSlug, eventId);

  const customId = eventId
    ? undefined
    : String(data.customId || "").trim() || (await ensureCustomIdUnique());

  const shortDescription =
    String(data.shortDescription || "").trim() ||
    "Event configuration in progress.";
  if (shortDescription.length > 250)
    throw validationError("Short description must not exceed 250 characters");

  const fullDescription =
    sanitizeRichText(String(data.fullDescription || "")) ||
    "Detailed event information will be published soon.";

  const format = String(data.format || "HYBRID").toUpperCase();
  if (!EVENT_FORMATS.includes(format))
    throw validationError("Invalid event format");

  const location = String(data.location || "TBA").trim();
  ensureLocationValid(format, location);

  const now = new Date();
  const fallbackEventDate = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  const fallbackDeadline = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);

  const date = normalizeDateInput(data.date, fallbackEventDate);
  const deadline = normalizeDateInput(data.deadline, fallbackDeadline);
  ensureValidDates(date, deadline);

  const registrationOpenDate =
    parseDateSafely(data.registrationOpenDate) || fallbackDeadline;
  const registrationCloseDate =
    parseDateSafely(data.registrationCloseDate) || toUtcDayEnd(deadline);
  if (!registrationCloseDate) {
    throw validationError("Invalid registration close date");
  }
  if (registrationOpenDate.getTime() > registrationCloseDate.getTime()) {
    throw validationError("Registration open date must be before close date");
  }

  const registrationEndDate = registrationCloseDate;

  const teamSizeMin = Number(data.teamSizeMin ?? 1);
  const teamSizeMax = Number(data.teamSizeMax ?? 1);
  if (Number.isNaN(teamSizeMin) || teamSizeMin < 1)
    throw validationError("Min team size must be at least 1");
  if (Number.isNaN(teamSizeMax) || teamSizeMax < teamSizeMin)
    throw validationError(
      "Max team size must be greater than or equal to min team size",
    );

  const normalizedEligibility = normalizeEligibility(data.eligibility);
  const requestedStatus = EVENT_STATUSES.includes(data.status)
    ? data.status
    : "DRAFT";

  const status = resolveComputedEventStatus({
    persistedStatus: requestedStatus,
    registrationOpenDate,
    registrationCloseDate,
    deadline,
    capacity:
      typeof data.capacity === "number"
        ? data.capacity
        : Number(data.capacity) || null,
    participantCount: 0,
  });

  const normalizedCriteria = Array.isArray(data.criteria)
    ? data.criteria.map((item: any, index: number) => ({
        name: String(item.name || "").trim(),
        description: String(item.description || "").trim(),
        weight: Number(item.weight || 0),
        order: Number(item.order ?? index + 1),
      }))
    : [];

  const normalizedResources = Array.isArray(data.resources)
    ? data.resources.map((item: any) => ({
        title: String(item.title || item.fileName || "Resource").trim(),
        type: String(item.type || "OTHER").toUpperCase(),
        fileName: String(item.fileName || item.title || "resource").trim(),
        url: String(item.url || "").trim(),
        mimeType: String(item.mimeType || "").trim(),
        sizeBytes:
          typeof item.sizeBytes === "number"
            ? item.sizeBytes
            : Number(item.sizeBytes) || null,
      }))
    : [];

  const normalizedStages = Array.isArray(data.stages)
    ? ensureValidStages(data.stages)
    : [];

  const normalizedAwards = Array.isArray(data.awards)
    ? data.awards.map((item: any) => ({
        rank: Number(item.rank),
        title: String(item.title || "").trim(),
        description: String(item.description || "").trim(),
        tier: String(item.tier || "MAIN").toUpperCase(),
      }))
    : [];

  return {
    ...data,
    customId,
    title,
    slug,
    shortDescription,
    fullDescription,
    format,
    location,
    date,
    deadline,
    registrationOpenDate,
    registrationCloseDate,
    registrationEndDate,
    capacity:
      typeof data.capacity === "number"
        ? data.capacity
        : Number(data.capacity) || null,
    fee: String(data.fee || "Gratis").trim() || "Gratis",
    organizer: String(data.organizer || "GIVA").trim() || "GIVA",
    theme: data.theme || "",
    prizePool: data.prizePool || "",
    rules: sanitizeRichText(String(data.rules || "")),
    awardsEnabled: Boolean(data.awardsEnabled),
    eventTypeId: typeof data.eventTypeId === "string" ? data.eventTypeId : null,
    teamSizeMin,
    teamSizeMax,
    eligibility: normalizedEligibility,
    status,
    timeline: Array.isArray(data.timeline) ? data.timeline : [],
    faqs: Array.isArray(data.faqs) ? data.faqs : [],
    categories: Array.isArray(data.categories) ? data.categories : [],
    criteria: normalizedCriteria.filter(
      (item: any) => item.name && item.weight > 0,
    ),
    resources: normalizedResources.filter(
      (item: any) => item.url && item.fileName,
    ),
    stages: normalizedStages,
    awards: normalizedAwards.filter((item: any) => item.rank > 0 && item.title),
  };
};

export const updateEvent = async (id: string, data: any) => {
  const normalized = await normalizeEventPayload(data, id);
  const {
    customId: _ignoredCustomId,
    timeline,
    faqs,
    categories,
    criteria,
    resources,
    stages,
    awards,
    ...base
  } = normalized;

  return prisma.$transaction(async (tx) => {
    await tx.eventTimeline.deleteMany({ where: { eventId: id } });
    await tx.eventFaq.deleteMany({ where: { eventId: id } });
    await tx.eventCategory.deleteMany({ where: { eventId: id } });
    await tx.eventCriteria.deleteMany({ where: { eventId: id } });
    await tx.eventResource.deleteMany({ where: { eventId: id } });
    await tx.eventStage.deleteMany({ where: { eventId: id } });
    await tx.eventAward.deleteMany({ where: { eventId: id } });

    return tx.event.update({
      where: { id },
      data: {
        ...base,
        timeline: { create: timeline },
        faqs: { create: faqs },
        categories: { create: categories },
        criteria: { create: criteria },
        resources: { create: resources },
        stages: { create: stages },
        awards: { create: awards },
      },
    });
  });
};

const computeCardProgress = (event: any) => {
  const hasCoreConfig = [
    event.title,
    event.slug,
    event.date,
    event.deadline,
    event.location,
    event.format,
    event.category,
  ].filter(Boolean).length;

  const stageReady =
    Array.isArray(event.stages) &&
    event.stages.length === 3 &&
    event.stages.every(
      (item: any) =>
        item.startAt instanceof Date &&
        item.deadlineAt instanceof Date &&
        item.deadlineAt.getTime() > item.startAt.getTime(),
    );

  return {
    configuration: Math.round((hasCoreConfig / 7) * 100),
    faqs: event.faqs.length > 0 ? 100 : 0,
    criteria:
      event.criteria.length > 0
        ? Math.min(
            100,
            Math.max(
              40,
              event.criteria.reduce(
                (acc: number, item: any) => acc + (item.weight || 0),
                0,
              ),
            ),
          )
        : 0,
    timeline: event.timeline.length > 0 ? 100 : 0,
    rules: event.rules ? 100 : 0,
    resources: event.resources.length > 0 ? 100 : 0,
    community: event.communityThreads.length > 0 ? 100 : 0,
    participants: event.registrations.length > 0 ? 100 : 0,
    judges: event.judgeAssignments.length > 0 ? 100 : 0,
    stages: stageReady ? 100 : 0,
    awards: event.awardsEnabled ? (event.awards.length > 0 ? 100 : 25) : 0,
  };
};

export const getManageEvent = async (eventId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      eventType: true,
      categories: { orderBy: { name: "asc" } },
      faqs: { orderBy: { order: "asc" } },
      timeline: { orderBy: { order: "asc" } },
      criteria: { orderBy: { order: "asc" } },
      resources: { orderBy: { createdAt: "desc" } },
      stages: { orderBy: { startAt: "asc" } },
      awards: { orderBy: { rank: "asc" } },
      registrations: {
        orderBy: { registeredAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          team: { select: { id: true, name: true } },
        },
      },
      judgeAssignments: {
        include: {
          judge: { select: { id: true, fullName: true, email: true } },
          category: { select: { id: true, name: true } },
        },
      },
      communityThreads: {
        orderBy: { viewCount: "desc" },
        take: 10,
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { avatar: true } },
            },
          },
          _count: { select: { messages: true, likes: true } },
        },
      },
    },
  });

  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  return {
    ...event,
    progress: computeCardProgress(event),
  };
};

export const updateEventConfiguration = async (eventId: string, data: any) => {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: { _count: { select: { registrations: true } } },
  });

  if (!existing) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const updates: Record<string, unknown> = {};

  if (typeof data.title === "string") {
    const title = data.title.trim();
    if (title.length < 3)
      throw validationError("Event name must be at least 3 characters");
    updates.title = title;
    if (!data.slug) {
      updates.slug = await ensureSlugUnique(slugifyEventName(title), eventId);
    }
  }

  if (typeof data.slug === "string") {
    const parsed = slugifyEventName(data.slug);
    if (parsed.length < 3)
      throw validationError("Slug must be at least 3 characters");
    updates.slug = await ensureSlugUnique(parsed, eventId);
  }

  if (typeof data.format === "string") {
    const format = data.format.toUpperCase();
    if (!EVENT_FORMATS.includes(format))
      throw validationError("Invalid event format");
    updates.format = format;
  }

  if (typeof data.location === "string") {
    const location = data.location.trim();
    const activeFormat = String(updates.format || existing.format);
    ensureLocationValid(activeFormat, location);
    updates.location = location;
  }

  if (typeof data.shortDescription === "string") {
    const shortDescription = data.shortDescription.trim();
    if (!shortDescription)
      throw validationError("Short description is required");
    if (shortDescription.length > 250) {
      throw validationError("Short description must not exceed 250 characters");
    }
    updates.shortDescription = shortDescription;
  }

  if (typeof data.fullDescription === "string") {
    const fullDescription = sanitizeRichText(data.fullDescription);
    if (fullDescription.length < 20) {
      throw validationError("Full description must be at least 20 characters");
    }
    updates.fullDescription = fullDescription;
  }

  if (typeof data.date === "string") {
    updates.date = data.date;
  }
  if (typeof data.deadline === "string") {
    updates.deadline = data.deadline;
    const registrationEndDate = toUtcDayEnd(data.deadline);
    if (!registrationEndDate) throw validationError("Invalid deadline format");
    updates.registrationEndDate = registrationEndDate;
  }

  const date = String(updates.date || existing.date);
  const deadline = String(updates.deadline || existing.deadline);
  ensureValidDates(date, deadline);

  if (data.registrationOpenDate !== undefined) {
    const registrationOpenDate = parseDateSafely(data.registrationOpenDate);
    if (!registrationOpenDate)
      throw validationError("Invalid registration open date");
    updates.registrationOpenDate = registrationOpenDate;
  }

  if (data.registrationCloseDate !== undefined) {
    const registrationCloseDate = parseDateSafely(data.registrationCloseDate);
    if (!registrationCloseDate)
      throw validationError("Invalid registration close date");
    updates.registrationCloseDate = registrationCloseDate;
    updates.registrationEndDate = registrationCloseDate;
  }

  const regOpen =
    (updates.registrationOpenDate as Date) || existing.registrationOpenDate;
  const regClose =
    (updates.registrationCloseDate as Date) || existing.registrationCloseDate;
  if (regOpen && regClose && regOpen.getTime() > regClose.getTime()) {
    throw validationError("Registration open date must be before close date");
  }

  if (data.capacity !== undefined) {
    const capacity = Number(data.capacity);
    if (Number.isNaN(capacity) || capacity < 0) {
      throw validationError("Capacity must be a positive number");
    }
    updates.capacity = capacity;
  }

  if (data.teamSizeMin !== undefined) {
    const teamSizeMin = Number(data.teamSizeMin);
    if (Number.isNaN(teamSizeMin) || teamSizeMin < 1) {
      throw validationError("Min team size must be at least 1");
    }
    updates.teamSizeMin = teamSizeMin;
  }

  if (data.teamSizeMax !== undefined) {
    const teamSizeMax = Number(data.teamSizeMax);
    if (Number.isNaN(teamSizeMax) || teamSizeMax < 1) {
      throw validationError("Max team size must be at least 1");
    }
    updates.teamSizeMax = teamSizeMax;
  }

  const nextTeamMin = Number(updates.teamSizeMin ?? existing.teamSizeMin);
  const nextTeamMax = Number(updates.teamSizeMax ?? existing.teamSizeMax);
  if (nextTeamMax < nextTeamMin) {
    throw validationError(
      "Max team size must be greater than or equal to min team size",
    );
  }

  if (data.eligibility !== undefined) {
    updates.eligibility = normalizeEligibility(data.eligibility);
  }

  if (typeof data.rules === "string") {
    updates.rules = sanitizeRichText(data.rules);
  }

  if (typeof data.category === "string")
    updates.category = data.category.trim();
  if (typeof data.theme === "string") updates.theme = data.theme.trim();
  if (typeof data.fee === "string") updates.fee = data.fee.trim();
  if (typeof data.organizer === "string")
    updates.organizer = data.organizer.trim();
  if (typeof data.prizePool === "string")
    updates.prizePool = data.prizePool.trim();
  if (typeof data.image === "string") updates.image = data.image.trim();
  if (typeof data.eventTypeId === "string" || data.eventTypeId === null) {
    updates.eventTypeId = data.eventTypeId;
  }

  const requestedStatus =
    typeof data.status === "string" && EVENT_STATUSES.includes(data.status)
      ? data.status
      : existing.status;

  updates.status = resolveComputedEventStatus({
    persistedStatus: requestedStatus,
    registrationOpenDate:
      (updates.registrationOpenDate as Date) || existing.registrationOpenDate,
    registrationCloseDate:
      (updates.registrationCloseDate as Date) || existing.registrationCloseDate,
    deadline,
    capacity:
      typeof updates.capacity === "number"
        ? Number(updates.capacity)
        : existing.capacity,
    participantCount: existing._count.registrations,
  });

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: updates,
  });

  publishEventUpdate(eventId, { type: "event.config.updated" });
  return updated;
};

export const replaceEventFaqs = async (eventId: string, data: any) => {
  const faqs = Array.isArray(data.faqs)
    ? data.faqs
        .map((item: any, index: number) => ({
          question: String(item.question || "").trim(),
          answer: String(item.answer || "").trim(),
          order: Number(item.order ?? index + 1),
        }))
        .filter((item: any) => item.question && item.answer)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventFaq.deleteMany({ where: { eventId } });
    if (faqs.length > 0) {
      await tx.eventFaq.createMany({
        data: faqs.map((item: any) => ({ ...item, eventId })),
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: { faqs: { orderBy: { order: "asc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.faqs.updated" });
  return updated;
};

export const replaceEventCriteria = async (eventId: string, data: any) => {
  const criteria = Array.isArray(data.criteria)
    ? data.criteria
        .map((item: any, index: number) => ({
          name: String(item.name || "").trim(),
          description: String(item.description || "").trim(),
          weight: Number(item.weight || 0),
          order: Number(item.order ?? index + 1),
        }))
        .filter((item: any) => item.name && item.weight > 0)
    : [];

  const totalWeight = criteria.reduce(
    (acc: number, item: any) => acc + item.weight,
    0,
  );

  if (criteria.length > 0 && totalWeight !== 100) {
    throw validationError("Criteria total weight must be exactly 100");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventCriteria.deleteMany({ where: { eventId } });
    if (criteria.length > 0) {
      await tx.eventCriteria.createMany({
        data: criteria.map((item: any) => ({ ...item, eventId })),
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: { criteria: { orderBy: { order: "asc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.criteria.updated" });
  return updated;
};

export const replaceEventTimeline = async (eventId: string, data: any) => {
  const timeline = Array.isArray(data.timeline)
    ? data.timeline
        .map((item: any, index: number) => ({
          date: String(item.date || "").trim(),
          title: String(item.title || "").trim(),
          description: String(item.description || "").trim(),
          order: Number(item.order ?? index + 1),
        }))
        .filter((item: any) => item.date && item.title)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventTimeline.deleteMany({ where: { eventId } });
    if (timeline.length > 0) {
      await tx.eventTimeline.createMany({
        data: timeline.map((item: any) => ({ ...item, eventId })),
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: { timeline: { orderBy: { order: "asc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.timeline.updated" });
  return updated;
};

export const updateEventRules = async (eventId: string, data: any) => {
  const rules = sanitizeRichText(String(data.rules || "").trim());
  const eligibility =
    data.eligibility !== undefined
      ? normalizeEligibility(data.eligibility)
      : undefined;

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: {
      rules,
      ...(eligibility !== undefined ? { eligibility } : {}),
    },
  });

  publishEventUpdate(eventId, { type: "event.rules.updated" });
  return updated;
};

export const replaceEventResources = async (eventId: string, data: any) => {
  const resources = Array.isArray(data.resources)
    ? data.resources
        .map((item: any) => ({
          title: String(item.title || item.fileName || "Resource").trim(),
          type: String(item.type || "OTHER").toUpperCase(),
          fileName: String(item.fileName || item.title || "resource").trim(),
          url: String(item.url || "").trim(),
          mimeType: String(item.mimeType || "").trim(),
          sizeBytes:
            typeof item.sizeBytes === "number"
              ? item.sizeBytes
              : Number(item.sizeBytes) || null,
        }))
        .filter((item: any) => item.fileName && item.url)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventResource.deleteMany({ where: { eventId } });
    if (resources.length > 0) {
      await tx.eventResource.createMany({
        data: resources.map((item: any) => ({ ...item, eventId })),
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: { resources: { orderBy: { createdAt: "desc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.resources.updated" });
  return updated;
};

export const replaceEventStages = async (eventId: string, data: any) => {
  const stages = ensureValidStages(
    Array.isArray(data.stages) ? data.stages : [],
  );
  if (stages.length !== 3) {
    throw validationError(
      "All three stages (ABSTRACT, PAPER, FINAL) are required",
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventStage.deleteMany({ where: { eventId } });
    await tx.eventStage.createMany({
      data: stages.map((item) => ({
        eventId,
        stageType: item.stageType as any,
        startAt: item.startAt,
        deadlineAt: item.deadlineAt,
      })),
    });

    return tx.event.findUnique({
      where: { id: eventId },
      include: { stages: { orderBy: { startAt: "asc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.stages.updated" });
  return updated;
};

export const replaceEventAwards = async (eventId: string, data: any) => {
  const awardsEnabled = Boolean(data.awardsEnabled);
  const awards = Array.isArray(data.awards)
    ? data.awards
        .map((item: any) => ({
          rank: Number(item.rank),
          title: String(item.title || "").trim(),
          description: String(item.description || "").trim(),
          tier: String(item.tier || "MAIN").toUpperCase(),
        }))
        .filter((item: any) => item.rank > 0 && item.title)
    : [];

  const updated = await prisma.$transaction(async (tx) => {
    await tx.eventAward.deleteMany({ where: { eventId } });

    if (awardsEnabled && awards.length > 0) {
      await tx.eventAward.createMany({
        data: awards.map((item: any) => ({ ...item, eventId })),
      });
    }

    return tx.event.update({
      where: { id: eventId },
      data: { awardsEnabled },
      include: { awards: { orderBy: { rank: "asc" } } },
    });
  });

  publishEventUpdate(eventId, { type: "event.awards.updated" });
  return updated;
};

export const replaceEventJudges = async (eventId: string, data: any) => {
  const assignments = Array.isArray(data.assignments) ? data.assignments : [];

  const normalized = assignments
    .map((item: any) => ({
      judgeId: String(item.judgeId || "").trim(),
      categoryId: String(item.categoryId || "").trim(),
      currentStage: String(item.currentStage || "ABSTRACT").toUpperCase(),
    }))
    .filter((item) => item.judgeId && item.categoryId);

  if (normalized.some((item) => !JUDGING_STAGES.includes(item.currentStage))) {
    throw validationError("Invalid judging stage");
  }

  const updated = await prisma.$transaction(async (tx) => {
    await tx.judgeAssignment.deleteMany({ where: { eventId } });

    if (normalized.length > 0) {
      await tx.judgeAssignment.createMany({
        data: normalized.map((item) => ({
          ...item,
          eventId,
          status: "ACTIVE",
        })),
      });
    }

    return tx.event.findUnique({
      where: { id: eventId },
      include: {
        judgeAssignments: {
          include: {
            judge: { select: { id: true, fullName: true, email: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
    });
  });

  publishEventUpdate(eventId, { type: "event.judges.updated" });
  return updated;
};

export const createEventTypeTaxonomy = async (name: string) => {
  const normalized = String(name || "").trim();
  if (normalized.length < 2) {
    throw validationError("Event type must be at least 2 characters");
  }

  const created = await prisma.eventTypeTaxonomy.upsert({
    where: { name: normalized },
    create: { name: normalized },
    update: {},
  });

  return createTaxonomyResponse(created, "eventType");
};

export const createEventEligibilityTaxonomy = async (name: string) => {
  const normalized = String(name || "").trim();
  if (normalized.length < 2) {
    throw validationError("Eligibility category must be at least 2 characters");
  }

  const created = await prisma.eventEligibilityTaxonomy.upsert({
    where: { name: normalized },
    create: { name: normalized },
    update: {},
  });

  return createTaxonomyResponse(created, "eligibility");
};

export const listEventTaxonomies = async () => {
  return getEventTaxonomyLists();
};

export const updateEventStatus = async (id: string, status: string) => {
  if (!EVENT_STATUSES.includes(status))
    throw validationError("Invalid event status");

  if (status === "DRAFT") {
    const updated = await prisma.event.update({
      where: { id },
      data: { status: "DRAFT" as any },
    });
    publishEventUpdate(id, {
      type: "event.status.updated",
      status: updated.status,
    });
    return updated;
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: { _count: { select: { registrations: true } } },
  });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const computed = resolveComputedEventStatus({
    persistedStatus: status,
    registrationOpenDate: event.registrationOpenDate,
    registrationCloseDate: event.registrationCloseDate,
    deadline: event.deadline,
    capacity: event.capacity,
    participantCount: event._count.registrations,
  });

  const updated = await prisma.event.update({
    where: { id },
    data: { status: computed as any },
  });

  publishEventUpdate(id, {
    type: "event.status.updated",
    status: updated.status,
  });

  return updated;
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
