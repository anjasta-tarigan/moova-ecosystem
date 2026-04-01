import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { uploadEventBannerMiddleware } from "../../middlewares/upload.middleware";
import {
  advanceStage,
  createCertificate,
  createEvent,
  dashboard,
  deleteEvent,
  eventReport,
  getSiswaDetail,
  listCertificates,
  listEvents,
  listSiswa,
  listSubmissions,
  revokeCertificate,
  updateEvent,
  updateEventStatus,
  uploadEventBanner,
} from "./admin.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "SUPERADMIN"));

router.get("/dashboard", dashboard);
router.get("/events", listEvents);
router.post("/events", requireRole("SUPERADMIN"), createEvent);
router.post(
  "/events/banner",
  requireRole("SUPERADMIN"),
  uploadEventBannerMiddleware,
  uploadEventBanner,
);
router.put("/events/:id", updateEvent);
router.patch("/events/:id/status", updateEventStatus);
router.delete("/events/:id", deleteEvent);

router.get("/submissions", listSubmissions);
router.patch("/submissions/:id/stage", advanceStage);

router.post("/certificates", createCertificate);
router.get("/certificates", listCertificates);
router.patch("/certificates/:id/revoke", revokeCertificate);

router.get("/siswa", listSiswa);
router.get("/siswa/:id", getSiswaDetail);

router.get("/reports/event/:eventId", eventReport);

export default router;
