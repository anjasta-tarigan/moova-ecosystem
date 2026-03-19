import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getAssignments,
  getSubmissionDetail,
  listSubmissions,
  upsertScore,
} from "./judge.controller";
import { scoreSchema } from "./judge.schema";

const router = Router();

router.use(authenticate, requireRole("JUDGE"));

router.get("/assignments", getAssignments);
router.get("/assignments/:categoryId/submissions", listSubmissions);
router.get("/submissions/:submissionId", getSubmissionDetail);
router.post("/scores", validate(scoreSchema), upsertScore);

export default router;
