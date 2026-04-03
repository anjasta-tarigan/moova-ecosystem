import prisma from "../../config/database";
import { EventStageType, JudgingStage } from "../../generated/prisma/enums";
import {
  getStageByType,
  hasStageDeadlinePassed,
  isNowWithinStage,
} from "../events/event-lifecycle";

const ensureLeader = async (teamId: string, userId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  if (!membership) throw new Error("Not team member");
  if (membership.role !== "LEADER") throw new Error("Not team leader");
};

const resolveStageType = (stage: string): EventStageType => {
  const normalized = String(stage || "ABSTRACT").toUpperCase();
  if (normalized === JudgingStage.ABSTRACT) return EventStageType.ABSTRACT;
  if (normalized === JudgingStage.PAPER) return EventStageType.PAPER;
  if (normalized === JudgingStage.FINAL) return EventStageType.FINAL;

  const err: any = new Error("Stage not configured");
  err.status = 403;
  throw err;
};

const ensureSubmissionStageWritable = async (
  eventId: string,
  stage: string,
  opts?: { allowMissingStageConfig?: boolean },
) => {
  const stages = await prisma.eventStage.findMany({
    where: { eventId },
    orderBy: { startAt: "asc" },
  });

  if (!stages.length && opts?.allowMissingStageConfig) {
    return;
  }

  if (!stages.length) {
    const err: any = new Error("Stage configuration is missing");
    err.status = 403;
    throw err;
  }

  const stageType = resolveStageType(stage);
  const targetStage = getStageByType(stages as any, stageType);

  if (!targetStage) {
    const err: any = new Error("Stage not configured");
    err.status = 403;
    throw err;
  }

  const now = new Date();

  if (now.getTime() < targetStage.startAt.getTime()) {
    const err: any = new Error("Stage not started");
    err.status = 403;
    throw err;
  }

  if (
    !isNowWithinStage(targetStage as any, now) ||
    hasStageDeadlinePassed(targetStage as any, now)
  ) {
    const err: any = new Error("Stage deadline passed");
    err.status = 403;
    throw err;
  }
};

export const listMySubmissions = async (userId: string) => {
  const memberships = await prisma.teamMember.findMany({ where: { userId } });
  const teamIds = memberships.map((m: any) => m.teamId);
  return prisma.submission.findMany({
    where: { teamId: { in: teamIds } },
    include: { files: true, scores: true, team: true, event: true },
  });
};

export const getSubmission = async (id: string, userId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      files: true,
      scores: true,
      team: { include: { members: true } },
      event: true,
    },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const isMember = submission.team.members.some(
    (m: any) => m.userId === userId,
  );
  if (!isMember) throw new Error("Not team member");
  return submission;
};

export const createSubmission = async (userId: string, data: any) => {
  await ensureLeader(data.teamId, userId);
  await ensureSubmissionStageWritable(
    data.eventId,
    data.currentStage || "ABSTRACT",
    {
      allowMissingStageConfig: true,
    },
  );
  const registration = await prisma.eventRegistration.findUnique({
    where: { userId_eventId: { userId, eventId: data.eventId } },
  });
  if (!registration || registration.teamId !== data.teamId) {
    throw new Error("Team not registered");
  }
  return prisma.submission.create({
    data: {
      ...data,
      submittedById: userId,
    },
  });
};

export const updateSubmission = async (
  id: string,
  userId: string,
  data: any,
) => {
  const submission = await prisma.submission.findUnique({ where: { id } });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (submission.status !== "DRAFT") throw new Error("Cannot edit");
  await ensureSubmissionStageWritable(
    submission.eventId,
    data.currentStage || submission.currentStage,
    { allowMissingStageConfig: true },
  );
  await ensureLeader(submission.teamId, userId);
  return prisma.submission.update({ where: { id }, data });
};

export const addFile = async (
  id: string,
  userId: string,
  file: Express.Multer.File,
) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { team: { include: { members: true } } },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const isMember = submission.team.members.some(
    (m: any) => m.userId === userId,
  );
  if (!isMember) throw new Error("Not team member");
  await ensureSubmissionStageWritable(
    submission.eventId,
    submission.currentStage,
    { allowMissingStageConfig: true },
  );
  if (submission.status !== "DRAFT" && submission.status !== "SUBMITTED") {
    throw new Error("Cannot upload file");
  }
  const url = `/uploads/${file.path.split("uploads/")[1]}`;
  return prisma.submissionFile.create({
    data: {
      submissionId: id,
      name: file.originalname,
      size: `${file.size}`,
      mimeType: file.mimetype,
      url,
    },
  });
};

export const deleteFile = async (
  submissionId: string,
  fileId: string,
  userId: string,
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { team: { include: { members: true } }, files: true },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  await ensureLeader(submission.teamId, userId);
  const file = submission.files.find((f: any) => f.id === fileId);
  if (!file) throw new Error("Data not found");
  await prisma.submissionFile.delete({ where: { id: fileId } });
  return { message: "File deleted" };
};

export const submit = async (
  id: string,
  userId: string,
  consentGiven: boolean,
) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { files: true },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  await ensureLeader(submission.teamId, userId);
  await ensureSubmissionStageWritable(
    submission.eventId,
    submission.currentStage,
    { allowMissingStageConfig: true },
  );
  if (submission.status !== "DRAFT") throw new Error("Cannot submit");
  if (!consentGiven) throw new Error("Consent required");
  if (submission.files.length === 0) throw new Error("File required");

  return prisma.submission.update({
    where: { id },
    data: {
      status: "SUBMITTED",
      submittedAt: new Date(),
      consentGiven,
    },
  });
};

export const withdraw = async (id: string, userId: string) => {
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: { scores: true },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  await ensureLeader(submission.teamId, userId);
  if (submission.status !== "SUBMITTED") throw new Error("Cannot withdraw");
  if (submission.scores.length > 0) throw new Error("Already scored");

  return prisma.submission.update({
    where: { id },
    data: { status: "DRAFT", submittedAt: null },
  });
};
