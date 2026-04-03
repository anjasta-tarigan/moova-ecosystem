import prisma from "../../config/database";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"] as const;
const PUBLIC_EVENT_STATUSES = ["OPEN", "UPCOMING", "CLOSED"] as const;
const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
const WORKSPACE_ENABLED_STATUSES = ["OPEN"] as const;

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
  registrationEndDate: true,
  fee: true,
  teamSizeMin: true,
  teamSizeMax: true,
  organizer: true,
  _count: { select: { registrations: true, submissions: true } },
} as const;

const eventDetailInclude = {
  timeline: { orderBy: { order: "asc" as const } },
  faqs: { orderBy: { order: "asc" as const } },
  categories: { select: { id: true, name: true, description: true } },
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

const parseRegistrationEndDate = (
  deadline: string,
  registrationEndDate?: Date | null,
) => {
  if (registrationEndDate) return registrationEndDate;

  const normalizedDeadline = (deadline || "").trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalizedDeadline);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  }

  const parsed = new Date(normalizedDeadline);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const hasRegistrationDeadlinePassed = (event: {
  deadline: string;
  registrationEndDate?: Date | null;
}) => {
  const endDate = parseRegistrationEndDate(
    event.deadline,
    event.registrationEndDate,
  );
  if (!endDate) return false;
  return Date.now() > endDate.getTime();
};

const isRegistrationOpen = (event: {
  status: string;
  deadline: string;
  registrationEndDate?: Date | null;
}) => {
  if (event.status !== "OPEN") return false;
  return !hasRegistrationDeadlinePassed(event);
};

const isWorkspaceTimelineActive = (status: string) =>
  WORKSPACE_ENABLED_STATUSES.includes(
    status as (typeof WORKSPACE_ENABLED_STATUSES)[number],
  );

const getWorkspaceAccessDeniedMessage = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "UPCOMING") {
    return "Workspace will open when the event timeline starts.";
  }
  if (normalized === "CLOSED") {
    return "Workspace access is closed because the event timeline has ended.";
  }
  return "Workspace is unavailable for the current event status.";
};

const buildWorkspaceFallbackPath = (eventSlug: string) =>
  `/dashboard/events/${encodeURIComponent(eventSlug)}`;

const resolveWorkspacePath = async (
  eventId: string,
  eventSlug: string,
  teamId?: string | null,
) => {
  if (teamId) {
    const submission = await prisma.submission.findFirst({
      where: {
        eventId,
        teamId,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });

    if (submission?.id) {
      return `/dashboard/submission/${submission.id}`;
    }
  }

  return `/dashboard/team/manage?event=${encodeURIComponent(eventSlug)}`;
};

const mapEventWithLifecycle = <
  T extends {
    id: string;
    status: string;
    deadline: string;
    registrationEndDate?: Date | null;
    _count?: { registrations?: number };
  },
>(
  event: T,
  options?: { totalSaves?: number; isSaved?: boolean },
) => {
  const registrationEndDate = parseRegistrationEndDate(
    event.deadline,
    event.registrationEndDate,
  );

  return {
    ...event,
    totalParticipants: event._count?.registrations ?? 0,
    totalSaves: options?.totalSaves ?? 0,
    isSaved: options?.isSaved ?? false,
    isRegistrationOpen: isRegistrationOpen(event),
    registrationEndDate: registrationEndDate
      ? registrationEndDate.toISOString()
      : null,
  };
};

const getSavedStats = async (eventIds: string[], userId?: string) => {
  if (!eventIds.length) {
    return {
      saveCountByEventId: new Map<string, number>(),
      savedEventIds: new Set<string>(),
    };
  }

  const [saveCounts, savedByUser] = await Promise.all([
    prisma.savedEvent.groupBy({
      by: ["eventId"],
      where: { eventId: { in: eventIds } },
      _count: { _all: true },
    }),
    userId
      ? prisma.savedEvent.findMany({
          where: { userId, eventId: { in: eventIds } },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const saveCountByEventId = new Map<string, number>();
  for (const item of saveCounts) {
    saveCountByEventId.set(item.eventId, item._count._all);
  }

  const savedEventIds = new Set<string>(
    savedByUser.map((item) => item.eventId),
  );
  return { saveCountByEventId, savedEventIds };
};

export const listPublicEvents = async (query: any, userId?: string) => {
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

  const eventIds = data.map((event) => event.id);
  const { saveCountByEventId, savedEventIds } = await getSavedStats(
    eventIds,
    userId,
  );

  const mapped = data.map((event) =>
    mapEventWithLifecycle(event, {
      totalSaves: saveCountByEventId.get(event.id) ?? 0,
      isSaved: savedEventIds.has(event.id),
    }),
  );

  return { data: mapped, total, page, limit };
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

  const lifecycleEventIds = [
    ...new Set([
      ...registrations.map((item) => item.event.id),
      ...discover.map((item) => item.id),
    ]),
  ];

  const { saveCountByEventId, savedEventIds } = await getSavedStats(
    lifecycleEventIds,
    userId,
  );

  const mappedRegistrations = registrations.map((registration) => ({
    ...registration,
    event: mapEventWithLifecycle(registration.event, {
      totalSaves: saveCountByEventId.get(registration.event.id) ?? 0,
      isSaved: savedEventIds.has(registration.event.id),
    }),
  }));

  const mappedDiscover = discover.map((item) =>
    mapEventWithLifecycle(item, {
      totalSaves: saveCountByEventId.get(item.id) ?? 0,
      isSaved: savedEventIds.has(item.id),
    }),
  );

  return {
    registered: mappedRegistrations,
    discover: mappedDiscover,
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
      event: { status: { in: [...PUBLIC_EVENT_STATUSES] } },
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

export const getEventById = async (
  id: string,
  role?: string,
  userId?: string,
) => {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      ...eventDetailInclude,
      ...(userId
        ? {
            registrations: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
            savedBy: {
              where: { userId },
              select: { id: true },
              take: 1,
            },
          }
        : {}),
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
  const totalSaves = await prisma.savedEvent.count({ where: { eventId: id } });

  const registrations = (event as any).registrations as
    | { id: string }[]
    | undefined;
  const savedBy = (event as any).savedBy as { id: string }[] | undefined;
  const eventData: any = { ...(event as any) };
  delete eventData.registrations;
  delete eventData.savedBy;

  return {
    ...mapEventWithLifecycle(eventData, {
      totalSaves,
      isSaved: Boolean(savedBy?.length),
    }),
    registrationCount,
    isRegistered: Boolean(registrations?.length),
  };
};

export const getStudentEventBySlug = async (slug: string, userId: string) => {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      ...eventDetailInclude,
      registrations: {
        where: { userId },
        select: {
          id: true,
          teamId: true,
          team: { select: { id: true, name: true } },
        },
        take: 1,
      },
      savedBy: {
        where: { userId },
        select: { id: true },
        take: 1,
      },
    },
  });

  if (!event || event.status === "DRAFT") {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const registration = event.registrations[0] ?? null;
  const isSaved = event.savedBy.length > 0;
  let submissionId: string | null = null;

  if (registration?.teamId) {
    const submission = await prisma.submission.findFirst({
      where: {
        eventId: event.id,
        teamId: registration.teamId,
      },
      select: { id: true },
      orderBy: { createdAt: "desc" },
    });
    submissionId = submission?.id ?? null;
  }

  const timelineActive = isWorkspaceTimelineActive(event.status);
  const canEnterWorkspace = Boolean(registration) && timelineActive;
  const workspacePath = canEnterWorkspace
    ? submissionId
      ? `/dashboard/submission/${submissionId}`
      : `/dashboard/team/manage?event=${encodeURIComponent(event.slug)}`
    : null;
  const workspaceFallbackPath = buildWorkspaceFallbackPath(event.slug);
  const workspaceAccessMessage = !registration
    ? "Register for this event to unlock workspace access."
    : timelineActive
      ? null
      : getWorkspaceAccessDeniedMessage(event.status);

  const totalSaves = await prisma.savedEvent.count({
    where: { eventId: event.id },
  });

  const { registrations, ...eventData } = event;

  return {
    ...mapEventWithLifecycle(eventData, {
      totalSaves,
      isSaved,
    }),
    isRegistered: Boolean(registration),
    registrationId: registration?.id ?? null,
    registration: registration
      ? {
          id: registration.id,
          teamId: registration.teamId,
          team: registration.team ?? null,
        }
      : null,
    submissionId,
    registrationStatus: registration ? "APPROVED" : "NOT_REGISTERED",
    eventTimelineStatus: event.status,
    canEnterWorkspace,
    workspacePath,
    workspaceFallbackPath,
    workspaceAccessMessage,
  };
};

export const getStudentWorkspaceAccessBySlug = async (
  slug: string,
  userId: string,
) => {
  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      status: true,
      registrations: {
        where: { userId },
        select: { id: true, teamId: true },
        take: 1,
      },
    },
  });

  if (!event || event.status === "DRAFT") {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const registration = event.registrations[0] ?? null;
  if (!registration) {
    const err: any = new Error("You are not registered for this event");
    err.status = 403;
    throw err;
  }

  if (!isWorkspaceTimelineActive(event.status)) {
    const err: any = new Error(getWorkspaceAccessDeniedMessage(event.status));
    err.status = 403;
    throw err;
  }

  const workspacePath = await resolveWorkspacePath(
    event.id,
    event.slug,
    registration.teamId,
  );

  return {
    canEnterWorkspace: true,
    registrationStatus: "APPROVED",
    eventTimelineStatus: event.status,
    workspacePath,
    workspaceFallbackPath: buildWorkspaceFallbackPath(event.slug),
  };
};

export const registerEvent = async (
  eventId: string,
  userId: string,
  teamId?: string,
) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      status: true,
      deadline: true,
      registrationEndDate: true,
    },
  });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (event.status !== "OPEN") {
    throw new Error("Event not open");
  }
  if (hasRegistrationDeadlinePassed(event)) {
    const err: any = new Error("Registration closed by deadline");
    err.status = 403;
    throw err;
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

export const bookmarkEvent = async (eventId: string, userId: string) => {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true, status: true },
  });

  if (!event || event.status === "DRAFT") {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  await prisma.savedEvent.upsert({
    where: { userId_eventId: { userId, eventId } },
    update: {},
    create: { userId, eventId },
  });

  const totalSaves = await prisma.savedEvent.count({ where: { eventId } });
  return { eventId, isSaved: true, totalSaves };
};

export const unbookmarkEvent = async (eventId: string, userId: string) => {
  await prisma.savedEvent.deleteMany({
    where: { eventId, userId },
  });

  const totalSaves = await prisma.savedEvent.count({ where: { eventId } });
  return { eventId, isSaved: false, totalSaves };
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
