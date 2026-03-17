import { Request, Response } from "express";
import { paginated, error, success } from "../../utils/response";
import * as eventsService from "./events.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.code === "P2002") return error(res, "Data already exists", 409);
  if (err?.message === "Profile incomplete")
    return error(res, "Profile completeness must reach 80%", 400);
  if (err?.message === "Event not open")
    return error(res, "Event is not open for registration", 400);
  if (err?.message === "Already registered")
    return error(res, "Already registered to this event", 400);
  if (err?.message === "Not team member")
    return error(res, "Team not found or not a member", 403);
  return error(res, "Internal server error", 500);
};

export const getEvents = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.listEvents(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getEventDetail = async (req: Request, res: Response) => {
  try {
    const event = await eventsService.getEventById(req.params.id);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const registerEvent = async (req: Request, res: Response) => {
  try {
    const created = await eventsService.registerEvent(
      req.params.id,
      req.user!.id,
      req.body.teamId,
    );
    return success(res, created);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await eventsService.listQuestions(
      req.params.id,
      page,
      limit,
    );
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createQuestion = async (req: Request, res: Response) => {
  try {
    const question = await eventsService.createQuestion(
      req.params.id,
      req.user!.id,
      req.body.text,
    );
    return success(res, question, "Question created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createReply = async (req: Request, res: Response) => {
  try {
    const reply = await eventsService.createReply(
      req.params.questionId,
      req.user!.id,
      req.body.text,
      req.user!.role,
    );
    return success(res, reply, "Reply created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const toggleUpvote = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.toggleUpvote(
      req.params.questionId,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};
