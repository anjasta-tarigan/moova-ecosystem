import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().min(3),
});

export const joinTeamSchema = z.object({
  code: z.string().min(6),
});

export const updateTeamSchema = z.object({
  name: z.string().min(3),
});

export const changeRoleSchema = z.object({
  role: z.enum(["LEADER", "MEMBER"]),
});
