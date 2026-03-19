import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadSingle } from "../../middlewares/upload.middleware";
import {
  addFile,
  createSubmission,
  deleteFile,
  getSubmission,
  listMySubmissions,
  submit,
  updateSubmission,
  withdraw,
} from "./submissions.controller";
import {
  createSubmissionSchema,
  submitSchema,
  updateSubmissionSchema,
} from "./submissions.schema";

const router = Router();

router.use(authenticate, requireRole("STUDENT"));

router.get("/", listMySubmissions);
router.get("/:id", getSubmission);
router.post("/", validate(createSubmissionSchema), createSubmission);
router.put("/:id", validate(updateSubmissionSchema), updateSubmission);
router.post("/:id/files", uploadSingle, addFile);
router.delete("/:id/files/:fileId", deleteFile);
router.post("/:id/submit", validate(submitSchema), submit);
router.post("/:id/withdraw", withdraw);

export default router;
