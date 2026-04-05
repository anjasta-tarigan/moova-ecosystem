import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  bookmarkEvent,
  createCommunityMessage,
  createCommunityThread,
  createQuestion,
  createReply,
  getAdminEvents,
  getCommunityMessages,
  getCommunityThreads,
  getCalendarEventsRange,
  getEventDetailBySlug,
  getEventDetail,
  getGlobalEventsStream,
  getEventRealtimeStream,
  getEvents,
  getJudgeEvents,
  getPublicEvents,
  getStudentEventDetail,
  getStudentEvents,
  getQuestions,
  registerEvent,
  toggleCommunityMessageLike,
  toggleCommunityThreadLike,
  toggleUpvote,
  unbookmarkEvent,
} from "./events.controller";
import {
  communityMessageSchema,
  communityThreadSchema,
  questionSchema,
  registerEventSchema,
  replySchema,
} from "./events.schema";

const router = Router();

router.get("/public", getPublicEvents);
router.get("/student", authenticate, requireRole("STUDENT"), getStudentEvents);
router.get(
  "/student/:slug",
  authenticate,
  requireRole("STUDENT"),
  getStudentEventDetail,
);
router.get("/judge", authenticate, requireRole("JUDGE"), getJudgeEvents);
router.get(
  "/admin",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  getAdminEvents,
);
router.get("/calendar/range", getCalendarEventsRange);
router.get("/stream", getGlobalEventsStream);
router.get("/", getEvents);
router.get("/slug/:slug", getEventDetailBySlug);
router.get("/:id/stream", getEventRealtimeStream);
router.get("/:id", getEventDetail);
router.post(
  "/:id/register",
  authenticate,
  requireRole("STUDENT"),
  validate(registerEventSchema),
  registerEvent,
);
router.post(
  "/:id/bookmark",
  authenticate,
  requireRole("STUDENT"),
  bookmarkEvent,
);
router.delete(
  "/:id/bookmark",
  authenticate,
  requireRole("STUDENT"),
  unbookmarkEvent,
);
router.get("/:id/qa", getQuestions);
router.post(
  "/:id/qa",
  authenticate,
  requireRole("STUDENT", "ADMIN", "SUPERADMIN"),
  validate(questionSchema),
  createQuestion,
);
router.post(
  "/:id/qa/:questionId/replies",
  authenticate,
  validate(replySchema),
  createReply,
);
router.post(
  "/:id/qa/:questionId/upvote",
  authenticate,
  requireRole("STUDENT"),
  toggleUpvote,
);
router.get("/:id/community/threads", getCommunityThreads);
router.post(
  "/:id/community/threads",
  authenticate,
  requireRole("STUDENT", "ADMIN", "SUPERADMIN", "JUDGE"),
  validate(communityThreadSchema),
  createCommunityThread,
);
router.get("/:id/community/threads/:threadId/messages", getCommunityMessages);
router.post(
  "/:id/community/threads/:threadId/messages",
  authenticate,
  requireRole("STUDENT", "ADMIN", "SUPERADMIN", "JUDGE"),
  validate(communityMessageSchema),
  createCommunityMessage,
);
router.post(
  "/:id/community/threads/:threadId/likes",
  authenticate,
  requireRole("STUDENT", "ADMIN", "SUPERADMIN", "JUDGE"),
  toggleCommunityThreadLike,
);
router.post(
  "/:id/community/messages/:messageId/likes",
  authenticate,
  requireRole("STUDENT", "ADMIN", "SUPERADMIN", "JUDGE"),
  toggleCommunityMessageLike,
);

export default router;
