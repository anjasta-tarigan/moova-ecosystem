import prisma from "../../config/database";

const stageMaxScores: Record<string, number> = {
  ABSTRACT: 30,
  PAPER: 80,
  FINAL: 100,
};

const isAssignedToCategory = async (userId: string, categoryId: string) => {
  const assignment = await prisma.judgeAssignment.findFirst({
    where: { judgeId: userId, categoryId },
  });
  return assignment;
};

export const getAssignments = async (judgeId: string) => {
  const assignments = await prisma.judgeAssignment.findMany({
    where: { judgeId },
    include: {
      category: true,
      event: true,
    },
  });

  const progress = await Promise.all(
    assignments.map(async (assign: any) => {
      const submissions = await prisma.submission.findMany({
        where: {
          categoryId: assign.categoryId,
          currentStage: assign.currentStage,
        },
      });
      const total = submissions.length;
      const submittedScores = await prisma.score.count({
        where: {
          judgeId,
          stage: assign.currentStage,
          submissionId: { in: submissions.map((s) => s.id) },
          status: "SUBMITTED" as any,
        },
      });
      return {
        assignmentId: assign.id,
        progress: total === 0 ? 0 : submittedScores / total,
      };
    }),
  );

  return assignments.map((assign: any) => ({
    ...assign,
    progress:
      progress.find((p: any) => p.assignmentId === assign.id)?.progress ?? 0,
  }));
};

export const listSubmissions = async (
  judgeId: string,
  categoryId: string,
  stage: string,
  statusFilter: string,
) => {
  const assignment = await isAssignedToCategory(judgeId, categoryId);
  if (!assignment) throw new Error("Not assigned");

  const submissions = (await prisma.submission.findMany({
    where: { categoryId, currentStage: stage as any },
    include: {
      team: true,
      scores: { where: { judgeId, stage: stage as any } },
    },
  })) as any[];

  return submissions.filter((s: any) => {
    const score = s.scores[0];
    if (statusFilter === "pending") return !score || score.status === "DRAFT";
    if (statusFilter === "submitted") return score?.status === "SUBMITTED";
    return true;
  });
};

export const getSubmissionDetail = async (
  judgeId: string,
  submissionId: string,
  stage: string,
) => {
  const submission = (await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      category: true,
      team: { include: { members: { include: { user: true } } } },
      files: true,
      scores: { where: { judgeId, stage: stage as any } },
    },
  })) as any;
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const assigned = await isAssignedToCategory(judgeId, submission.categoryId!);
  if (!assigned) throw new Error("Not assigned");

  const rubric: Record<string, number> =
    stage === "ABSTRACT"
      ? { novelty: 10, clarity: 10, relevance: 10 }
      : stage === "PAPER"
        ? { methodology: 20, results: 20, poster: 10, impact: 20, writing: 10 }
        : { presentation: 30, qa: 30, feasibility: 20, overall: 20 };

  return { submission, score: submission.scores[0] || null, rubric };
};

const calculateTotal = (
  stage: string,
  criteriaScores: Record<string, number>,
) => {
  const total = Object.values(criteriaScores).reduce(
    (a: number, b: number) => a + b,
    0,
  );
  return Math.min(total, stageMaxScores[stage]);
};

export const upsertScore = async (
  judgeId: string,
  data: {
    submissionId: string;
    stage: string;
    criteriaScores: Record<string, number>;
    comment?: string;
    status: "draft" | "submitted";
  },
) => {
  const submission = await prisma.submission.findUnique({
    where: { id: data.submissionId },
    include: { category: true },
  });
  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (submission.status === "DRAFT") throw new Error("Cannot score draft");

  const assigned = await isAssignedToCategory(judgeId, submission.categoryId!);
  if (!assigned) throw new Error("Not assigned");

  const totalScore = calculateTotal(data.stage, data.criteriaScores);

  const existing = await prisma.score.findUnique({
    where: {
      judgeId_submissionId_stage: {
        judgeId,
        submissionId: data.submissionId,
        stage: data.stage as any,
      },
    },
  });
  if (existing && existing.status === "SUBMITTED") {
    throw new Error("Score already submitted");
  }

  return prisma.score.upsert({
    where: {
      judgeId_submissionId_stage: {
        judgeId,
        submissionId: data.submissionId,
        stage: data.stage as any,
      },
    },
    create: {
      judgeId,
      submissionId: data.submissionId,
      stage: data.stage as any,
      criteriaScores: data.criteriaScores,
      comment: data.comment || "",
      totalScore,
      status: (data.status === "submitted" ? "SUBMITTED" : "DRAFT") as any,
    },
    update: {
      judgeId,
      criteriaScores: data.criteriaScores,
      comment: data.comment || "",
      totalScore,
      status: (data.status === "submitted" ? "SUBMITTED" : "DRAFT") as any,
    },
  });
};
