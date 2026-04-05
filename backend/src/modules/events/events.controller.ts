import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { paginated, error, success } from "../../utils/response";
import * as eventsService from "./events.service";
import {
  subscribeEventUpdates,
  subscribeGlobalEventUpdates,
} from "./events.realtime";

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "dev_access_secret";

const mapError = (err: any, res: Response) => {
  if (err?.status === 403) {
    const message =
      err?.message === "Registration closed by deadline"
        ? "Registration is closed for this event"
        : err?.message || "Forbidden";
    return error(res, message, 403);
  }
  if (
    typeof err?.status === "number" &&
    err.status >= 400 &&
    err.status < 500
  ) {
    return error(res, err?.message || "Bad request", err.status);
  }
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
  if (err?.message === "Thread title too short")
    return error(res, "Thread title must be at least 5 characters", 400);
  if (err?.message === "Thread content too short")
    return error(res, "Thread content must be at least 5 characters", 400);
  if (err?.message === "Reply content too short")
    return error(res, "Reply content must be at least 2 characters", 400);
  return error(res, "Internal server error", 500);
};

const resolveAuthContext = (req: Request) => {
  if (req.user) {
    return { role: req.user.role, userId: req.user.id };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { role: undefined, userId: undefined };
  }

  try {
    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as {
      id?: string;
      role?: string;
    };
    return { role: payload.role, userId: payload.id };
  } catch {
    return { role: undefined, userId: undefined };
  }
};

const resolveAudience = (role: unknown) => {
  const normalized = String(role || "PUBLIC").toUpperCase();
  if (normalized === "STUDENT" || normalized === "JUDGE") {
    return normalized;
  }
  return "PUBLIC";
};

const canAccessAudience = (
  audience: "PUBLIC" | "STUDENT" | "JUDGE",
  authRole?: string,
) => {
  if (audience === "PUBLIC") {
    return true;
  }
  return authRole === audience;
};

export const getPublicEvents = async (req: Request, res: Response) => {
  try {
    const authContext = resolveAuthContext(req);
    const studentId =
      authContext.role === "STUDENT" ? authContext.userId : undefined;
    const result = await eventsService.listPublicEvents(req.query, studentId);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getStudentEvents = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.listStudentEvents(
      req.user!.id,
      req.query,
    );
    return success(res, {
      registered: result.registered,
      discover: result.discover,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    return mapError(err, res);
  }
};

export const getJudgeEvents = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.listJudgeEvents(req.user!.id);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getAdminEvents = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.listAdminEvents(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getCalendarEventsRange = async (req: Request, res: Response) => {
  try {
    const start = String(req.query.start || "");
    const end = String(req.query.end || "");
    const role = resolveAudience(req.query.role) as
      | "PUBLIC"
      | "STUDENT"
      | "JUDGE";

    if (!start || !end) {
      return error(res, "Missing required start/end range", 400);
    }

    const auth = resolveAuthContext(req);
    if (!canAccessAudience(role, auth.role)) {
      return error(res, "Forbidden", 403);
    }

    const data = await eventsService.listCalendarEventsByRange({
      start,
      end,
      role,
      userId: auth.userId,
    });

    return success(res, {
      role,
      start,
      end,
      events: data,
    });
  } catch (err) {
    return mapError(err, res);
  }
};

export const getEvents = getPublicEvents;

export const getEventDetail = async (req: Request, res: Response) => {
  try {
    const authContext = resolveAuthContext(req);
    const event = await eventsService.getEventById(
      req.params.id,
      authContext.role,
      authContext.role === "STUDENT" ? authContext.userId : undefined,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getEventDetailBySlug = async (req: Request, res: Response) => {
  try {
    const authContext = resolveAuthContext(req);
    const event = await eventsService.getEventBySlug(
      req.params.slug,
      authContext.role,
      authContext.role === "STUDENT" ? authContext.userId : undefined,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getStudentEventDetail = async (req: Request, res: Response) => {
  try {
    const event = await eventsService.getStudentEventBySlug(
      req.params.slug,
      req.user!.id,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getStudentWorkspaceAccess = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await eventsService.getStudentWorkspaceAccessBySlug(
      req.params.slug,
      req.user!.id,
    );
    return success(res, result);
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

export const bookmarkEvent = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.bookmarkEvent(
      req.params.id,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const unbookmarkEvent = async (req: Request, res: Response) => {
  try {
    const result = await eventsService.unbookmarkEvent(
      req.params.id,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getCommunityThreads = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const sort = req.query.sort === "latest" ? "latest" : "top";
    const result = await eventsService.listCommunityThreads(
      req.params.id,
      page,
      limit,
      sort,
    );
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createCommunityThread = async (req: Request, res: Response) => {
  try {
    const thread = await eventsService.createCommunityThread(
      req.params.id,
      req.user!.id,
      {
        title: req.body?.title,
        content: req.body?.content,
      },
    );
    return success(res, thread, "Thread created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getCommunityMessages = async (req: Request, res: Response) => {
  try {
    const messages = await eventsService.listCommunityMessages(
      req.params.threadId,
    );
    return success(res, messages);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createCommunityMessage = async (req: Request, res: Response) => {
  try {
    const message = await eventsService.createCommunityMessage(
      req.params.threadId,
      req.user!.id,
      req.body?.content,
    );
    return success(res, message, "Reply created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const toggleCommunityThreadLike = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await eventsService.toggleCommunityThreadLike(
      req.params.threadId,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const toggleCommunityMessageLike = async (
  req: Request,
  res: Response,
) => {
  try {
    const result = await eventsService.toggleCommunityMessageLike(
      req.params.messageId,
      req.user!.id,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getEventRealtimeStream = async (req: Request, res: Response) => {
  const { id } = req.params;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const push = (payload: any) => {
    res.write(`event: event-update\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  push({ type: "connected", eventId: id });

  const unsubscribe = subscribeEventUpdates(id, push);
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: {"ok":true}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
};

export const getGlobalEventsStream = async (req: Request, res: Response) => {
  const audience = resolveAudience(req.query.role) as
    | "PUBLIC"
    | "STUDENT"
    | "JUDGE";
  const auth = resolveAuthContext(req);

  if (!canAccessAudience(audience, auth.role)) {
    return error(res, "Forbidden", 403);
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const push = (payload: any) => {
    res.write(`event: event-update\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  push({ type: "connected", audience });

  const unsubscribe = subscribeGlobalEventUpdates(audience, push);
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\n`);
    res.write(`data: {"ok":true}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
};
