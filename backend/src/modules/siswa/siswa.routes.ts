import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { uploadAvatar as uploadAvatarMiddleware } from "../../middlewares/upload.middleware";
import {
  getProfile,
  myCertificates,
  myEvents,
  mySubmissions,
  updateProfile,
  uploadAvatar,
} from "./siswa.controller";
import { updateProfileSchema } from "./siswa.schema";

const router = Router();

router.get(
  "/profile",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  getProfile,
);
router.put(
  "/profile",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  validate(updateProfileSchema),
  updateProfile,
);
router.post(
  "/profile/avatar",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  uploadAvatarMiddleware,
  uploadAvatar,
);
router.get(
  "/my-events",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  myEvents,
);
router.get(
  "/my-submissions",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  mySubmissions,
);
router.get(
  "/my-certificates",
  authenticate,
  requireRole("STUDENT", "JUDGE"),
  myCertificates,
);

export default router;
