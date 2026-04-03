import { randomBytes } from "crypto";
import { EventStageType, EventStatus } from "../../generated/prisma/enums";

export const EVENT_ID_PREFIX = "GIVA";

export const slugifyEventName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const buildEventCustomIdCandidate = () => {
  const random = randomBytes(4).toString("hex").slice(0, 6);
  const year = new Date().getUTCFullYear();
  return `${EVENT_ID_PREFIX}-${random}-${year}`;
};

export const parseDateSafely = (value?: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toUtcDayEnd = (value: string): Date | null => {
  const normalized = (value || "").trim();
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]) - 1;
    const day = Number(dateOnlyMatch[3]);
    return new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  }

  return parseDateSafely(normalized);
};

export type LifecycleInput = {
  persistedStatus: EventStatus | string;
  registrationOpenDate?: Date | null;
  registrationCloseDate?: Date | null;
  deadline?: string;
  capacity?: number | null;
  participantCount?: number;
  now?: Date;
};

export const resolveComputedEventStatus = (
  input: LifecycleInput,
): EventStatus | string => {
  const normalizedPersisted = String(input.persistedStatus || "").toUpperCase();
  if (normalizedPersisted === EventStatus.DRAFT) {
    return EventStatus.DRAFT;
  }

  const now = input.now ?? new Date();
  const registrationOpen = parseDateSafely(input.registrationOpenDate);
  const registrationClose =
    parseDateSafely(input.registrationCloseDate) ??
    toUtcDayEnd(input.deadline || "");

  if (!registrationOpen && !registrationClose) {
    return normalizedPersisted as EventStatus;
  }

  if (registrationOpen && now.getTime() < registrationOpen.getTime()) {
    return EventStatus.UPCOMING;
  }

  const participantCount = input.participantCount ?? 0;
  const hasRemainingCapacity =
    typeof input.capacity !== "number" ||
    input.capacity <= 0 ||
    participantCount < input.capacity;

  if (registrationClose && now.getTime() > registrationClose.getTime()) {
    return EventStatus.CLOSED;
  }

  if (!hasRemainingCapacity) {
    return EventStatus.CLOSED;
  }

  return EventStatus.OPEN;
};

export type StageWindow = {
  stageType: EventStageType | string;
  startAt: Date;
  deadlineAt: Date;
};

export const getStageByType = (
  stages: StageWindow[],
  type: EventStageType,
): StageWindow | null => {
  const found = stages.find((stage) => String(stage.stageType) === type);
  return found || null;
};

export const isNowWithinStage = (stage: StageWindow, now = new Date()) => {
  const nowMs = now.getTime();
  return (
    nowMs >= stage.startAt.getTime() && nowMs <= stage.deadlineAt.getTime()
  );
};

export const inferCurrentStageType = (
  stages: StageWindow[],
  now = new Date(),
): EventStageType | null => {
  const ordered = [...stages].sort(
    (a, b) => a.startAt.getTime() - b.startAt.getTime(),
  );

  for (const stage of ordered) {
    if (isNowWithinStage(stage, now)) {
      return stage.stageType as EventStageType;
    }
  }

  return null;
};

export const hasStageDeadlinePassed = (stage: StageWindow, now = new Date()) =>
  now.getTime() > stage.deadlineAt.getTime();
