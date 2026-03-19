// @deprecated Use services/api/judgeApi.ts instead
import { judgeApi } from "./api/judgeApi";

export type JudgingStage = "abstract" | "paper" | "final";

export interface Criterion {
  id: string;
  label: string;
  max: number;
  desc?: string;
}

export interface JudgeAssignment {
  id: string;
  eventId: string;
  eventTitle: string;
  categoryId: string;
  categoryName: string;
  currentStage: JudgingStage;
  status: "active" | "completed" | "pending";
  progress: number;
  total: number;
}

export interface JudgeSubmissionSummary {
  id: string;
  title: string;
  team: string;
  institution: string;
  scoringStatus: "pending" | "draft" | "submitted";
  totalScore: number | null;
}

export interface JudgeSubmissionDetail {
  id: string;
  title: string;
  team: string;
  abstract: string;
  abstractPdf?: string | null;
  fullPaperPdf?: string | null;
  posterUrl?: string | null;
  presentationUrl?: string | null;
}

export interface ScoreRecord {
  criteriaScores: Record<string, number>;
  comment: string;
  status: "draft" | "submitted" | "pending";
}

const mapStageToApi = (stage: JudgingStage) =>
  stage === "abstract" ? "ABSTRACT" : stage === "paper" ? "PAPER" : "FINAL";

const mapStageFromApi = (stage: string): JudgingStage => {
  switch ((stage || "").toUpperCase()) {
    case "PAPER":
      return "paper";
    case "FINAL":
      return "final";
    default:
      return "abstract";
  }
};

const normalizeStatus = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value === "completed") return "completed" as const;
  if (value === "active") return "active" as const;
  return "pending" as const;
};

const normalizeScoreStatus = (status?: string) => {
  const value = (status || "").toLowerCase();
  if (value === "submitted") return "submitted" as const;
  if (value === "draft") return "draft" as const;
  return "pending" as const;
};

const capitalizeLabel = (key: string) =>
  key
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const extractInstitution = (submission: any) => {
  const memberSchool =
    submission?.team?.members?.[0]?.user?.profile?.schoolName || "";
  return memberSchool || submission?.team?.name || "";
};

class JudgeService {
  // Fetch assignments and derive progress counters from submissions for each category
  async getAssignments(): Promise<JudgeAssignment[]> {
    const res = await judgeApi.getAssignments();
    const assignments = res.data?.data || [];

    const withProgress = await Promise.all(
      assignments.map(async (raw: any) => {
        const stage = mapStageFromApi(raw.currentStage);
        let total = 0;
        let progress = 0;

        try {
          const subsRes = await judgeApi.getCategorySubmissions(
            raw.categoryId,
            {
              stage: mapStageToApi(stage),
              status: "all",
            },
          );
          const subs = subsRes.data?.data || [];
          total = subs.length;
          progress = subs.filter((sub: any) => {
            const score = sub.scores?.[0];
            return normalizeScoreStatus(score?.status) === "submitted";
          }).length;
        } catch (err) {
          console.error("Failed to load submissions for assignment", err);
        }

        return {
          id: raw.id,
          eventId: raw.eventId,
          eventTitle: raw.event?.title || raw.eventTitle || "",
          categoryId: raw.categoryId,
          categoryName: raw.category?.name || raw.categoryName || "",
          currentStage: stage,
          status: normalizeStatus(raw.status),
          progress,
          total,
        } as JudgeAssignment;
      }),
    );

    return withProgress;
  }

  async getCategorySubmissions(
    categoryId: string,
    stage: JudgingStage,
  ): Promise<JudgeSubmissionSummary[]> {
    const res = await judgeApi.getCategorySubmissions(categoryId, {
      stage: mapStageToApi(stage),
      status: "all",
    });

    const submissions = res.data?.data || [];
    return submissions.map((sub: any) => {
      const score = sub.scores?.[0];
      return {
        id: sub.id,
        title: sub.projectTitle || sub.title || "Untitled Submission",
        team: sub.team?.name || "Unknown Team",
        institution: extractInstitution(sub),
        scoringStatus: normalizeScoreStatus(score?.status),
        totalScore: score?.totalScore ?? null,
      } as JudgeSubmissionSummary;
    });
  }

  async getEventSubmissions(
    eventId: string,
    stage: JudgingStage,
  ): Promise<JudgeSubmissionSummary[]> {
    // Reuse category submissions endpoint while event-level endpoint is not available.
    return this.getCategorySubmissions(eventId, stage);
  }

  async getSubmissionDetails(
    submissionId: string,
    stage: JudgingStage,
  ): Promise<{
    submission: JudgeSubmissionDetail;
    rubric: Criterion[];
    scoreRecord: ScoreRecord | null;
  }> {
    const res = await judgeApi.getSubmissionDetail(
      submissionId,
      mapStageToApi(stage),
    );
    const data = res.data?.data || {};
    const submission = data.submission || {};
    const scoreRecord: ScoreRecord | null = data.score
      ? {
          criteriaScores: data.score.criteriaScores || {},
          comment: data.score.comment || "",
          status: normalizeScoreStatus(data.score.status),
        }
      : null;

    const rubric: Criterion[] = Object.entries(data.rubric || {}).map(
      ([key, value]) => ({
        id: key,
        label: capitalizeLabel(key),
        max: Number(value) || 0,
        desc: "",
      }),
    );

    const detail: JudgeSubmissionDetail = {
      id: submission.id,
      title:
        submission.projectTitle || submission.title || "Untitled Submission",
      team: submission.team?.name || "Unknown Team",
      abstract: submission.description || submission.tagline || "",
      abstractPdf: submission.abstractPdf || submission.files?.[0]?.url || null,
      fullPaperPdf: submission.fullPaperPdf || null,
      posterUrl: submission.posterUrl || null,
      presentationUrl:
        submission.presentationUrl || submission.demoLink || null,
    };

    return {
      submission: detail,
      rubric,
      scoreRecord,
    };
  }

  async saveScore(payload: {
    submissionId: string;
    stage: JudgingStage;
    criteriaScores: Record<string, number>;
    comment: string;
    status: "draft" | "submitted";
  }) {
    await judgeApi.saveScore({
      ...payload,
      stage: mapStageToApi(payload.stage),
    });
  }
}

export const judgeService = new JudgeService();
