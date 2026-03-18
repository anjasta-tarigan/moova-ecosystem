import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import {
  createAssignment,
  createUser,
  deleteAssignment,
  deleteUser,
  listUsers,
  systemStats,
  toggleActive,
  updateUser,
} from "./superadmin.controller";

const router = Router();

router.use(authenticate, requireRole("SUPERADMIN"));

router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.patch("/users/:id/toggle-active", toggleActive);
router.delete("/users/:id", deleteUser);

router.post("/judge-assignments", createAssignment);
router.delete("/judge-assignments/:id", deleteAssignment);

router.get("/system-stats", systemStats);

export default router;
