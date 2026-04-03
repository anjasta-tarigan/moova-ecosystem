import prisma from "../../config/database";

const stageMaxScores: Record<string, number> = {
  ABSTRACT: 30,
  PAPER: 80,
  FINAL: 100,
};

type RubricItem = {
  id: string;
  label: string;
  max: number;
  desc: string;
};

const fallbackRubricByStage: Record<string, RubricItem[]> = {
  ABSTRACT: [
    {
      id: "novelty",
      label: "Novelty",
      max: 10,
      desc: "Originality and uniqueness of the core idea.",
    },
    {
      id: "clarity",
      label: "Clarity",
      max: 10,
      desc: "How clearly the problem and solution are communicated.",
    },
    {
      id: "relevance",
      label: "Relevance",
      max: 10,
      desc: "Alignment with the event theme and objectives.",
    },
  ],
  PAPER: [
    {
      id: "methodology",
      label: "Methodology",
      max: 20,
      desc: "Rigor and appropriateness of the approach.",
    },
    {
      id: "results",
      label: "Results",
      max: 20,
      desc: "Evidence quality and measurable outcomes.",
    },
    {
      id: "poster",
      label: "Poster",
      max: 10,
      desc: "Visual communication quality of the poster.",
    },
    {
      id: "impact",
      label: "Impact",
      max: 20,
      desc: "Potential societal or business impact.",
    },
    {
      id: "writing",
      label: "Writing",
      max: 10,
      desc: "Structure, language quality, and readability.",
    },
  ],
  FINAL: [
    {
      id: "presentation",
      label: "Presentation",
      max: 30,
      desc: "Delivery quality and storyline effectiveness.",
    },
    {
      id: "qa",
      label: "Q&A",
      max: 30,
      desc: "Depth and confidence in answering judge questions.",
    },
    {
      id: "feasibility",
      label: "Feasibility",
      max: 20,
      desc: "Execution practicality and implementation viability.",
    },
    {
      id: "overall",
      label: "Overall",
      max: 20,
      desc: "Overall merit and recommendation strength.",
    },
  ],
};

const normalizeStage = (stage: string) =>
  String(stage || "ABSTRACT").toUpperCase();

const buildDynamicRubric = (
  stage: string,
  criteria: Array<{
    id: string;
    name: string;
    weight: number;
    description?: string | null;
  }>,
): RubricItem[] => {
  const normalizedStage = normalizeStage(stage);
  const maxTotal = stageMaxScores[normalizedStage] ?? 100;
  const normalizedCriteria = criteria.filter(
    (item) => item.name?.trim() && Number(item.weight) > 0,
  );

  if (normalizedCriteria.length === 0) {
    return (
      fallbackRubricByStage[normalizedStage] || fallbackRubricByStage.FINAL
    );
  }

  const totalWeight = normalizedCriteria.reduce(
    (sum, item) => sum + Number(item.weight),
    0,
  );

  let allocated = 0;
  const rubric = normalizedCriteria.map((item, index) => {
    const isLast = index === normalizedCriteria.length - 1;
    const remainingSlots = normalizedCriteria.length - index - 1;

    let max = isLast
      ? maxTotal - allocated
      : Math.max(1, Math.round((Number(item.weight) / totalWeight) * maxTotal));

    const highestAllowedForCurrent = maxTotal - allocated - remainingSlots;
    if (!isLast) {
      max = Math.max(1, Math.min(max, highestAllowedForCurrent));
    }

    allocated += max;

    return {
      id: item.id,
      label: item.name,
      max,
      desc: item.description?.trim() || "Evaluation criterion",
    };
  });

  return rubric;
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

  return Promise.all(
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
          submissionId: { in: submissions.map((item) => item.id) },
          status: "SUBMITTED" as any,
        },
      });

      return {
        id: assign.id,
        assignmentId: assign.id,
        eventId: assign.eventId,
        eventTitle: assign.event?.title || "Untitled Event",
        categoryId: assign.categoryId,
        categoryName: assign.category?.name || "Uncategorized",
        currentStage: assign.currentStage,
        status: assign.status,
        progress: submittedScores,
        total,
        completionRate:
          total === 0 ? 0 : Math.round((submittedScores / total) * 100),
      };
    }),
  );
};

export const listSubmissions = async (
  judgeId: string,
  categoryId: string,
  stage: string,
  statusFilter: string,
) => {
  const normalizedStage = normalizeStage(stage);
  const assignment = await isAssignedToCategory(judgeId, categoryId);
  if (!assignment) throw new Error("Not assigned");

  const submissions = (await prisma.submission.findMany({
    where: { categoryId, currentStage: normalizedStage as any },
    include: {
      team: true,
      scores: { where: { judgeId, stage: normalizedStage as any } },
    },
  })) as any[];

  const mapped = submissions.map((submission: any) => {
    const score = submission.scores[0] || null;
    return {
      ...submission,
      teamName: submission.team?.name || "-",
      scoringStatus: score ? String(score.status).toLowerCase() : "pending",
      totalScore: score?.totalScore ?? null,
      scoreRecord: score,
    };
  });

  return mapped.filter((submission: any) => {
    if (statusFilter === "pending") {
      return submission.scoringStatus !== "submitted";
    }

    if (statusFilter === "submitted") {
      return submission.scoringStatus === "submitted";
    }

    return true;
  });
};

export const getSubmissionDetail = async (
  judgeId: string,
  submissionId: string,
  stage: string,
) => {
  const normalizedStage = normalizeStage(stage);

  const submission = (await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      event: {
        include: {
          criteria: {
            orderBy: { order: "asc" },
          },
        },
      },
      category: true,
      team: { include: { members: { include: { user: true } } } },
      files: true,
      scores: { where: { judgeId, stage: normalizedStage as any } },
    },
  })) as any;

  if (!submission) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const assigned = await isAssignedToCategory(judgeId, submission.categoryId!);
  if (!assigned) throw new Error("Not assigned");

  const rubric = buildDynamicRubric(
    normalizedStage,
    submission.event?.criteria || [],
  );

  const scoreRecord = submission.scores[0]
    ? {
        ...submission.scores[0],
        status: String(submission.scores[0].status).toLowerCase(),
      }
    : null;

  return {
    submission: {
      ...submission,
      teamName: submission.team?.name || "-",
    },
    rubric,
    scoreRecord,
  };
};

const calculateTotal = (
  stage: string,
  criteriaScores: Record<string, number>,
) => {
  const normalizedStage = normalizeStage(stage);
  const total = Object.values(criteriaScores).reduce(
    (a: number, b: number) => a + b,
    0,
  );
  return Math.min(total, stageMaxScores[normalizedStage] || 100);
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
  const normalizedStage = normalizeStage(data.stage);

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

  const totalScore = calculateTotal(normalizedStage, data.criteriaScores);

  const existing = await prisma.score.findUnique({
    where: {
      judgeId_submissionId_stage: {
        judgeId,
        submissionId: data.submissionId,
        stage: normalizedStage as any,
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
        stage: normalizedStage as any,
      },
    },
    create: {
      judgeId,
      submissionId: data.submissionId,
      stage: normalizedStage as any,
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
