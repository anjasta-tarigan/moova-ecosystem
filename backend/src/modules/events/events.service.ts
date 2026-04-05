import prisma from "../../config/database";
import { EventStatus } from "../../generated/prisma/enums";
import { resolveComputedEventStatus, toUtcDayEnd } from "./event-lifecycle";
import { publishEventUpdate } from "./events.realtime";

const EVENT_STATUSES = ["DRAFT", "OPEN", "UPCOMING", "CLOSED"] as const;
const PUBLIC_EVENT_STATUSES = ["OPEN", "UPCOMING", "CLOSED"] as const;
const EVENT_FORMATS = ["ONLINE", "IN_PERSON", "HYBRID"] as const;
const WORKSPACE_ENABLED_STATUSES = ["OPEN"] as const;

const parsePagination = (page?: number, limit?: number) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 10;
  return { page: p < 1 ? 1 : p, limit: l < 1 ? 10 : l };
};

const parseCalendarDate = (value?: string | Date | null) => {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const pickCalendarDate = (event: {
  date?: string | Date;
  deadline?: string | Date;
}) => parseCalendarDate(event.date) || parseCalendarDate(event.deadline);

const inRange = (date: Date, start: Date, end: Date) =>
  date.getTime() >= start.getTime() && date.getTime() <= end.getTime();

const baseListSelect = {
  id: true,
  customId: true,
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
  registrationOpenDate: true,
  registrationCloseDate: true,
  registrationEndDate: true,
  capacity: true,
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
  criteria: { orderBy: { order: "asc" as const } },
  resources: { orderBy: { createdAt: "desc" as const } },
  stages: { orderBy: { startAt: "asc" as const } },
  communityThreads: {
    orderBy: { viewCount: "desc" as const },
    take: 5,
    include: {
      author: { select: { id: true, fullName: true, profile: true } },
      _count: { select: { likes: true, messages: true } },
    },
  },
  _count: { select: { registrations: true, submissions: true } },
} as const;

const withComputedStatus = <
  T extends {
    status: string;
    deadline: string;
    registrationOpenDate?: Date | null;
    registrationCloseDate?: Date | null;
    registrationEndDate?: Date | null;
    capacity?: number | null;
    _count?: { registrations?: number };
  },
>(
  event: T,
) => {
  const participantCount = event._count?.registrations ?? 0;
  const computedStatus = resolveComputedEventStatus({
    persistedStatus: event.status,
    registrationOpenDate: event.registrationOpenDate,
    registrationCloseDate: event.registrationCloseDate,
    deadline: event.deadline,
    capacity: event.capacity,
    participantCount,
  });

  const registrationCloseDate =
    event.registrationCloseDate ||
    event.registrationEndDate ||
    toUtcDayEnd(event.deadline);

  return {
    ...event,
    status: computedStatus,
    registrationCloseDate,
  };
};

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
  registrationCloseDate?: Date | null,
  registrationEndDate?: Date | null,
) => {
  if (registrationCloseDate) return registrationCloseDate;
  if (registrationEndDate) return registrationEndDate;

  return toUtcDayEnd(deadline);
};

const hasRegistrationDeadlinePassed = (event: {
  deadline: string;
  registrationCloseDate?: Date | null;
  registrationEndDate?: Date | null;
}) => {
  const endDate = parseRegistrationEndDate(
    event.deadline,
    event.registrationCloseDate,
    event.registrationEndDate,
  );
  if (!endDate) return false;
  return Date.now() > endDate.getTime();
};

const isRegistrationOpen = (event: {
  status: string;
  deadline: string;
  registrationCloseDate?: Date | null;
  registrationEndDate?: Date | null;
}) => {
  if (String(event.status).toUpperCase() !== EventStatus.OPEN) return false;
  return !hasRegistrationDeadlinePassed(event);
};

const isPreRegistrationOpen = (event: {
  status: string;
  deadline: string;
  registrationCloseDate?: Date | null;
  registrationEndDate?: Date | null;
}) => {
  if (String(event.status).toUpperCase() !== EventStatus.UPCOMING) return false;
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
    registrationCloseDate?: Date | null;
    registrationOpenDate?: Date | null;
    registrationEndDate?: Date | null;
    capacity?: number | null;
    _count?: { registrations?: number };
  },
>(
  event: T,
  options?: { totalSaves?: number; isSaved?: boolean },
) => {
  const computedEvent = withComputedStatus(event);

  const registrationEndDate = parseRegistrationEndDate(
    computedEvent.deadline,
    computedEvent.registrationCloseDate,
    computedEvent.registrationEndDate,
  );

  return {
    ...computedEvent,
    totalParticipants: event._count?.registrations ?? 0,
    totalSaves: options?.totalSaves ?? 0,
    isSaved: options?.isSaved ?? false,
    isRegistrationOpen: isRegistrationOpen(computedEvent),
    isPreRegistrationOpen: isPreRegistrationOpen(computedEvent),
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

export const listCalendarEventsByRange = async (params: {
  start: string;
  end: string;
  role: "PUBLIC" | "STUDENT" | "JUDGE";
  userId?: string;
}) => {
  const start = new Date(params.start);
  const end = new Date(params.end);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    const err: any = new Error("Invalid date range");
    err.status = 400;
    throw err;
  }

  if (end.getTime() < start.getTime()) {
    const err: any = new Error("Invalid date range");
    err.status = 400;
    throw err;
  }

  const role = params.role;
  const select: any = {
    id: true,
    title: true,
    slug: true,
    shortDescription: true,
    date: true,
    deadline: true,
    location: true,
    category: true,
    status: true,
    image: true,
    registrationOpenDate: true,
    registrationCloseDate: true,
    registrationEndDate: true,
    capacity: true,
    _count: { select: { registrations: true } },
  };

  if (role === "STUDENT" && params.userId) {
    select.registrations = {
      where: { userId: params.userId },
      select: { id: true },
      take: 1,
    };
  }

  const where: any = {
    status: { in: [...PUBLIC_EVENT_STATUSES] },
  };

  if (role === "JUDGE") {
    where.judgeAssignments = {
      some: {
        judgeId: params.userId,
        status: "ACTIVE",
      },
    };
  }

  const data = await prisma.event.findMany({
    where,
    select,
    orderBy: { createdAt: "desc" },
  });

  const mapped = data
    .map((event: any) => {
      const lifecycle = mapEventWithLifecycle(event, {
        isSaved: false,
        totalSaves: 0,
      }) as any;

      const calendarDate = pickCalendarDate(lifecycle);
      if (!calendarDate || !inRange(calendarDate, start, end)) {
        return null;
      }

      const isRegistered =
        role === "STUDENT" ? Boolean(lifecycle.registrations?.length) : false;

      return {
        id: lifecycle.id,
        title: lifecycle.title,
        slug: lifecycle.slug,
        shortDescription: lifecycle.shortDescription,
        description: lifecycle.shortDescription,
        date: lifecycle.date,
        deadline: lifecycle.deadline,
        location: lifecycle.location,
        category: lifecycle.category,
        status: lifecycle.status,
        image: lifecycle.image,
        isRegistered,
      };
    })
    .filter(Boolean)
    .sort((a: any, b: any) => {
      const aDate = pickCalendarDate(a);
      const bDate = pickCalendarDate(b);
      return (aDate?.getTime() || 0) - (bDate?.getTime() || 0);
    });

  return mapped;
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

  const mapped = data.map((event) => mapEventWithLifecycle(event));
  return { data: mapped, total, page, limit };
};

export const getEventById = async (
  id: string,
  role?: string,
  userId?: string,
) => {
  const include = {
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
  };

  let event = await prisma.event.findUnique({
    where: { id },
    include,
  });

  // Support /events/:slug compatibility by resolving slug when id lookup misses.
  if (!event) {
    event = await prisma.event.findUnique({
      where: { slug: id },
      include,
    });
  }

  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const lifecycleEvent = withComputedStatus(event as any);

  const canViewDraft = role === "ADMIN" || role === "SUPERADMIN";
  if (lifecycleEvent.status === "DRAFT" && !canViewDraft) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const registrationCount = event._count?.registrations ?? 0;
  const totalSaves = await prisma.savedEvent.count({
    where: { eventId: event.id },
  });

  const registrations = (event as any).registrations as
    | { id: string }[]
    | undefined;
  const savedBy = (event as any).savedBy as { id: string }[] | undefined;
  const eventData: any = { ...(lifecycleEvent as any) };
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

export const getEventBySlug = async (
  slug: string,
  role?: string,
  userId?: string,
) => {
  const event = await prisma.event.findUnique({
    where: { slug },
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

  const lifecycleEvent = withComputedStatus(event as any);
  const canViewDraft = role === "ADMIN" || role === "SUPERADMIN";
  if (lifecycleEvent.status === "DRAFT" && !canViewDraft) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const totalSaves = await prisma.savedEvent.count({
    where: { eventId: event.id },
  });
  const registrations = (event as any).registrations as
    | { id: string }[]
    | undefined;
  const savedBy = (event as any).savedBy as { id: string }[] | undefined;
  const payload: any = { ...(lifecycleEvent as any) };
  delete payload.registrations;
  delete payload.savedBy;

  return {
    ...mapEventWithLifecycle(payload, {
      totalSaves,
      isSaved: Boolean(savedBy?.length),
    }),
    registrationCount: event._count?.registrations ?? 0,
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

  const lifecycleEvent = event ? withComputedStatus(event as any) : null;

  if (!event || lifecycleEvent?.status === "DRAFT") {
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

  const timelineActive = isWorkspaceTimelineActive(lifecycleEvent!.status);
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
      : getWorkspaceAccessDeniedMessage(lifecycleEvent!.status);

  const totalSaves = await prisma.savedEvent.count({
    where: { eventId: event.id },
  });

  const { registrations, ...eventData } = lifecycleEvent as any;

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
    eventTimelineStatus: lifecycleEvent!.status,
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

  const lifecycleEvent = withComputedStatus(event as any);

  if (lifecycleEvent.status === "DRAFT") {
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

  if (!isWorkspaceTimelineActive(lifecycleEvent.status)) {
    const err: any = new Error(
      getWorkspaceAccessDeniedMessage(lifecycleEvent.status),
    );
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
    eventTimelineStatus: lifecycleEvent.status,
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
      registrationOpenDate: true,
      registrationCloseDate: true,
      registrationEndDate: true,
      capacity: true,
      _count: { select: { registrations: true } },
    },
  });
  if (!event) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const lifecycleEvent = withComputedStatus(event as any);

  if (
    lifecycleEvent.status !== EventStatus.OPEN &&
    lifecycleEvent.status !== EventStatus.UPCOMING
  ) {
    throw new Error("Event not open");
  }

  if (hasRegistrationDeadlinePassed(lifecycleEvent as any)) {
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

  const registration = await prisma.eventRegistration.create({
    data: { eventId, userId, teamId: selectedTeamId },
  });

  publishEventUpdate(eventId, {
    type: "event.registration.created",
    userId,
  });

  return registration;
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

export const listCommunityThreads = async (
  eventId: string,
  page = 1,
  limit = 20,
  sort: "top" | "latest" = "top",
) => {
  const skip = (page - 1) * limit;

  const [total, threads] = await Promise.all([
    prisma.eventCommunityThread.count({ where: { eventId } }),
    prisma.eventCommunityThread.findMany({
      where: { eventId },
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
      orderBy:
        sort === "latest"
          ? { createdAt: "desc" }
          : [
              { viewCount: "desc" },
              { likeCount: "desc" },
              { createdAt: "desc" },
            ],
      skip,
      take: limit,
    }),
  ]);

  return {
    total,
    page,
    limit,
    data: threads.map((thread) => ({
      ...thread,
      replyCount: thread._count.messages,
      likeCount: thread._count.likes,
    })),
  };
};

export const createCommunityThread = async (
  eventId: string,
  authorId: string,
  payload: { title: string; content: string },
) => {
  const title = String(payload.title || "").trim();
  const content = String(payload.content || "").trim();
  if (title.length < 5) throw new Error("Thread title too short");
  if (content.length < 5) throw new Error("Thread content too short");

  const thread = await prisma.eventCommunityThread.create({
    data: {
      eventId,
      authorId,
      title,
      content,
    },
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
  });

  publishEventUpdate(eventId, {
    type: "event.community.thread.created",
    threadId: thread.id,
  });

  return thread;
};

export const listCommunityMessages = async (threadId: string) => {
  return prisma.eventCommunityMessage.findMany({
    where: { threadId },
    include: {
      author: {
        select: {
          id: true,
          fullName: true,
          profile: { select: { avatar: true } },
        },
      },
      _count: { select: { likes: true } },
    },
    orderBy: { createdAt: "asc" },
  });
};

export const createCommunityMessage = async (
  threadId: string,
  authorId: string,
  content: string,
) => {
  const normalizedContent = String(content || "").trim();
  if (normalizedContent.length < 2) {
    throw new Error("Reply content too short");
  }

  return prisma.$transaction(async (tx) => {
    const thread = await tx.eventCommunityThread.findUnique({
      where: { id: threadId },
      select: { eventId: true },
    });

    if (!thread) {
      const err: any = new Error("Data not found");
      err.code = "P2025";
      throw err;
    }

    const message = await tx.eventCommunityMessage.create({
      data: {
        threadId,
        authorId,
        content: normalizedContent,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { avatar: true } },
          },
        },
      },
    });

    await tx.eventCommunityThread.update({
      where: { id: threadId },
      data: {
        replyCount: { increment: 1 },
      },
    });

    publishEventUpdate(thread.eventId, {
      type: "event.community.reply.created",
      threadId,
      messageId: message.id,
    });

    return message;
  });
};

export const toggleCommunityThreadLike = async (
  threadId: string,
  userId: string,
) => {
  const existing = await prisma.eventCommunityThreadLike.findUnique({
    where: { userId_threadId: { userId, threadId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.eventCommunityThreadLike.delete({ where: { id: existing.id } }),
      prisma.eventCommunityThread.update({
        where: { id: threadId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    const count = await prisma.eventCommunityThreadLike.count({
      where: { threadId },
    });
    return { isLiked: false, likeCount: count };
  }

  await prisma.$transaction([
    prisma.eventCommunityThreadLike.create({ data: { threadId, userId } }),
    prisma.eventCommunityThread.update({
      where: { id: threadId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  const count = await prisma.eventCommunityThreadLike.count({
    where: { threadId },
  });
  return { isLiked: true, likeCount: count };
};

export const toggleCommunityMessageLike = async (
  messageId: string,
  userId: string,
) => {
  const existing = await prisma.eventCommunityMessageLike.findUnique({
    where: { userId_messageId: { userId, messageId } },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.eventCommunityMessageLike.delete({ where: { id: existing.id } }),
      prisma.eventCommunityMessage.update({
        where: { id: messageId },
        data: { likeCount: { decrement: 1 } },
      }),
    ]);

    const count = await prisma.eventCommunityMessageLike.count({
      where: { messageId },
    });
    return { isLiked: false, likeCount: count };
  }

  await prisma.$transaction([
    prisma.eventCommunityMessageLike.create({ data: { messageId, userId } }),
    prisma.eventCommunityMessage.update({
      where: { id: messageId },
      data: { likeCount: { increment: 1 } },
    }),
  ]);

  const count = await prisma.eventCommunityMessageLike.count({
    where: { messageId },
  });
  return { isLiked: true, likeCount: count };
};
