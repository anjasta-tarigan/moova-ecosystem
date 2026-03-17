import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { login, logout, me, refresh, register } from "./auth.controller";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.schema";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", authenticate, validate(logoutSchema), logout);
router.get("/me", authenticate, me);

export default router;
