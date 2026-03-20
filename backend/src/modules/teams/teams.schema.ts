import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(3, "Team name must be at least 3 characters"),
  description: z.string().max(300).optional().default(""),
});

export const updateTeamSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(300).optional(),
});

export const joinTeamSchema = z.object({
  code: z.string().min(1, "Team code is required"),
});

export const changeRoleSchema = z.object({
  role: z.enum(["LEADER", "MEMBER"]),
});
