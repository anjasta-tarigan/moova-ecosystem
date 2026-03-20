import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { requireRole } from "../../middlewares/role.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createTeam,
  deleteTeam,
  getTeam,
  inviteMember,
  joinTeam,
  leaveTeam,
  listTeams,
  assignMentor,
  removeMentor,
  searchMentors,
  searchStudents,
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

// Search endpoints and mentor management should register before parameterized routes
router.get(
  "/search/students",
  authenticate,
  requireRole("STUDENT"),
  searchStudents,
);

router.get(
  "/search/mentors",
  authenticate,
  requireRole("STUDENT"),
  searchMentors,
);

router.post("/:id/invite", authenticate, requireRole("STUDENT"), inviteMember);

router.post("/:id/mentor", authenticate, requireRole("STUDENT"), assignMentor);

router.delete(
  "/:id/mentor/:userId",
  authenticate,
  requireRole("STUDENT"),
  removeMentor,
);

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
