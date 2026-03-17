import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as submissionService from "./submissions.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.message === "Not team member")
    return error(res, "Not authorized for this submission", 403);
  if (err?.message === "Not team leader")
    return error(res, "Only team leader can perform this action", 403);
  if (err?.message === "Team not registered")
    return error(res, "Team not registered for this event", 400);
  if (err?.message === "Cannot edit")
    return error(res, "Submission cannot be edited", 400);
  if (err?.message === "Cannot upload file")
    return error(res, "Cannot upload file at this stage", 400);
  if (err?.message === "Cannot submit")
    return error(res, "Cannot submit at this stage", 400);
  if (err?.message === "Consent required")
    return error(res, "Consent is required to submit", 400);
  if (err?.message === "File required")
    return error(res, "At least one file is required", 400);
  if (err?.message === "Cannot withdraw")
    return error(res, "Cannot withdraw at this stage", 400);
  if (err?.message === "Already scored")
    return error(res, "Submission already scored", 400);
  return error(res, "Internal server error", 500);
};

export const listMySubmissions = async (req: Request, res: Response) => {
  try {
    const submissions = await submissionService.listMySubmissions(req.user!.id);
    return success(res, submissions);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getSubmission = async (req: Request, res: Response) => {
  try {
    const submission = await submissionService.getSubmission(
      req.params.id,
      req.user!.id,
    );
    return success(res, submission);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createSubmission = async (req: Request, res: Response) => {
  try {
    const submission = await submissionService.createSubmission(
      req.user!.id,
      req.body,
    );
    return success(res, submission, "Submission created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateSubmission = async (req: Request, res: Response) => {
  try {
    const submission = await submissionService.updateSubmission(
      req.params.id,
      req.user!.id,
      req.body,
    );
    return success(res, submission);
  } catch (err) {
    return mapError(err, res);
  }
};

export const addFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) return error(res, "No file uploaded", 400);
    const file = await submissionService.addFile(
      req.params.id,
      req.user!.id,
      req.file,
    );
    return success(res, file, "File uploaded", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  try {
    const result = await submissionService.deleteFile(
      req.params.id,
      req.params.fileId,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const submit = async (req: Request, res: Response) => {
  try {
    const submission = await submissionService.submit(
      req.params.id,
      req.user!.id,
      req.body.consentGiven,
    );
    return success(res, submission, "Submission submitted");
  } catch (err) {
    return mapError(err, res);
  }
};

export const withdraw = async (req: Request, res: Response) => {
  try {
    const submission = await submissionService.withdraw(
      req.params.id,
      req.user!.id,
    );
    return success(res, submission, "Submission withdrawn");
  } catch (err) {
    return mapError(err, res);
  }
};
