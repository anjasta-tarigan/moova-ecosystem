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

router.use(authenticate, requireRole("STUDENT"));

router.get("/profile", getProfile);
router.put("/profile", validate(updateProfileSchema), updateProfile);
router.post("/profile/avatar", uploadAvatarMiddleware, uploadAvatar);
router.get("/my-events", myEvents);
router.get("/my-submissions", mySubmissions);
router.get("/my-certificates", myCertificates);

export default router;
