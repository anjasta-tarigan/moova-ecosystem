import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createQuestion,
  createReply,
  getAdminEvents,
  getEventDetail,
  getEvents,
  getJudgeEvents,
  getPublicEvents,
  getStudentEventDetail,
  getStudentEvents,
  getQuestions,
  registerEvent,
  toggleUpvote,
} from "./events.controller";
import {
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
router.get("/", getEvents);
router.get("/:id", getEventDetail);
router.post(
  "/:id/register",
  authenticate,
  requireRole("STUDENT"),
  validate(registerEventSchema),
  registerEvent,
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

export default router;
