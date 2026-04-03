import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  uploadEventBannerMiddleware,
  uploadEventResourceFilesMiddleware,
} from "../../middlewares/upload.middleware";
import {
  advanceStage,
  createEventEligibilityTaxonomy,
  createCertificate,
  createEvent,
  createEventTypeTaxonomy,
  dashboard,
  deleteEvent,
  eventReport,
  getManageEvent,
  getSiswaDetail,
  listCertificates,
  listEvents,
  listEventTaxonomies,
  listSiswa,
  listSubmissions,
  replaceEventAwards,
  replaceEventCriteria,
  replaceEventFaqs,
  replaceEventJudges,
  replaceEventResources,
  replaceEventStages,
  replaceEventTimeline,
  revokeCertificate,
  updateEvent,
  updateEventConfiguration,
  updateEventRules,
  updateEventStatus,
  uploadEventBanner,
  uploadEventResources,
} from "./admin.controller";

const router = Router();

router.use(authenticate, requireRole("ADMIN", "SUPERADMIN"));

router.get("/dashboard", dashboard);
router.get("/events", listEvents);
router.post("/events", requireRole("SUPERADMIN"), createEvent);
router.get("/events/taxonomies", listEventTaxonomies);
router.post(
  "/events/taxonomies/types",
  requireRole("SUPERADMIN"),
  createEventTypeTaxonomy,
);
router.post(
  "/events/taxonomies/eligibilities",
  requireRole("SUPERADMIN"),
  createEventEligibilityTaxonomy,
);
router.get("/events/:id/manage", getManageEvent);
router.patch(
  "/events/:id/config",
  requireRole("SUPERADMIN"),
  updateEventConfiguration,
);
router.patch("/events/:id/faqs", requireRole("SUPERADMIN"), replaceEventFaqs);
router.patch(
  "/events/:id/criteria",
  requireRole("SUPERADMIN"),
  replaceEventCriteria,
);
router.patch(
  "/events/:id/timeline",
  requireRole("SUPERADMIN"),
  replaceEventTimeline,
);
router.patch("/events/:id/rules", requireRole("SUPERADMIN"), updateEventRules);
router.patch(
  "/events/:id/resources",
  requireRole("SUPERADMIN"),
  replaceEventResources,
);
router.patch(
  "/events/:id/judges",
  requireRole("SUPERADMIN"),
  replaceEventJudges,
);
router.patch(
  "/events/:id/stages",
  requireRole("SUPERADMIN"),
  replaceEventStages,
);
router.patch(
  "/events/:id/awards",
  requireRole("SUPERADMIN"),
  replaceEventAwards,
);
router.post(
  "/events/banner",
  requireRole("SUPERADMIN"),
  uploadEventBannerMiddleware,
  uploadEventBanner,
);
router.post(
  "/events/resources/upload",
  requireRole("SUPERADMIN"),
  uploadEventResourceFilesMiddleware,
  uploadEventResources,
);
router.put("/events/:id", updateEvent);
router.patch(
  "/events/:id/status",
  requireRole("SUPERADMIN"),
  updateEventStatus,
);
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
