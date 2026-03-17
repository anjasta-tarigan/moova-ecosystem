import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createQuestion,
  createReply,
  getEventDetail,
  getEvents,
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

router.get("/", getEvents);
router.get("/:id", getEventDetail);
router.post(
  "/:id/register",
  authenticate,
  requireRole("SISWA"),
  validate(registerEventSchema),
  registerEvent,
);
router.get("/:id/qa", getQuestions);
router.post(
  "/:id/qa",
  authenticate,
  requireRole("SISWA", "ADMIN", "SUPERADMIN"),
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
  requireRole("SISWA"),
  toggleUpvote,
);

export default router;
