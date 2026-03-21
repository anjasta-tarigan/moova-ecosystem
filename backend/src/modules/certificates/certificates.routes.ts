import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import * as ctrl from "./certificates.controller";

const router = Router();

router.post(
  "/admin/certificates",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  ctrl.issueHandler,
);
router.get(
  "/admin/certificates",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  ctrl.listHandler,
);
router.delete(
  "/admin/certificates/:certCode",
  authenticate,
  requireRole("ADMIN", "SUPERADMIN"),
  ctrl.revokeHandler,
);
router.get(
  "/user/certificates",
  authenticate,
  requireRole("STUDENT"),
  ctrl.myHandler,
);
router.get("/certificates/verify/:certCode", ctrl.verifyHandler);

export default router;
