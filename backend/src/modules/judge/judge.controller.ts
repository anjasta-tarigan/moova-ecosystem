import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as judgeService from "./judge.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.message === "Not assigned")
    return error(res, "Not assigned to this category", 403);
  if (err?.message === "Cannot score draft")
    return error(res, "Cannot score draft submission", 400);
  if (err?.message === "Score already submitted")
    return error(res, "Score already submitted", 400);
  return error(res, "Internal server error", 500);
};

export const getAssignments = async (req: Request, res: Response) => {
  try {
    const assignments = await judgeService.getAssignments(req.user!.id);
    return success(res, assignments);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listSubmissions = async (req: Request, res: Response) => {
  try {
    const stage = (req.query.stage as string) || "ABSTRACT";
    const status = (req.query.status as string) || "all";
    const submissions = await judgeService.listSubmissions(
      req.user!.id,
      req.params.categoryId,
      stage,
      status,
    );
    return success(res, submissions);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getSubmissionDetail = async (req: Request, res: Response) => {
  try {
    const stage = (req.query.stage as string) || "ABSTRACT";
    const data = await judgeService.getSubmissionDetail(
      req.user!.id,
      req.params.submissionId,
      stage,
    );
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const upsertScore = async (req: Request, res: Response) => {
  try {
    const payload = {
      submissionId: req.body.submissionId,
      stage: req.body.stage as string,
      criteriaScores: req.body.criteriaScores,
      comment: req.body.comment,
      status: req.body.status,
    };
    const score = await judgeService.upsertScore(req.user!.id, payload);
    return success(res, score, "Score saved");
  } catch (err) {
    return mapError(err, res);
  }
};
