import { z } from "zod";

export const scoreSchema = z.object({
  submissionId: z.string(),
  stage: z.enum(["ABSTRACT", "PAPER", "FINAL"]),
  criteriaScores: z.record(z.number().min(0)),
  comment: z.string().optional(),
  status: z.enum(["draft", "submitted"]),
});
