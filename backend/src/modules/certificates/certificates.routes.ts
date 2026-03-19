import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  verify,
  myCertificates,
  createCertificate,
  listCertificates,
  revokeCertificate,
} from "./certificates.controller";

const router = Router();

router.get("/verify/:id", verify);
router.use(authenticate);
router.get("/", requireRole("STUDENT"), myCertificates);
router.post("/", requireRole("ADMIN", "SUPERADMIN"), createCertificate);
router.get("/all", requireRole("ADMIN", "SUPERADMIN"), listCertificates);
router.patch(
  "/:id/revoke",
  requireRole("ADMIN", "SUPERADMIN"),
  revokeCertificate,
);

export default router;
