import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createTeam,
  deleteTeam,
  getTeam,
  joinTeam,
  leaveTeam,
  listTeams,
  removeMember,
  updateTeam,
  changeRole,
} from "./teams.controller";
import {
  changeRoleSchema,
  createTeamSchema,
  joinTeamSchema,
  updateTeamSchema,
} from "./teams.schema";

const router = Router();

router.use(authenticate, requireRole("STUDENT"));

router.get("/", listTeams);
router.get("/:id", getTeam);
router.post("/", validate(createTeamSchema), createTeam);
router.post("/join", validate(joinTeamSchema), joinTeam);
router.put("/:id", validate(updateTeamSchema), updateTeam);
router.delete("/:id", deleteTeam);
router.delete("/:id/leave", leaveTeam);
router.delete("/:id/members/:userId", removeMember);
router.patch(
  "/:id/members/:userId/role",
  validate(changeRoleSchema),
  changeRole,
);

export default router;
