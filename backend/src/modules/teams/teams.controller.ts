import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as teamService from "./teams.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.message === "Not team member")
    return error(res, "Not authorized for this team", 403);
  if (err?.message === "Not team leader")
    return error(res, "Only team leader can perform this action", 403);
  if (err?.message === "Team not active")
    return error(res, "Team is not active", 400);
  if (err?.message === "Already member")
    return error(res, "Already a team member", 400);
  if (err?.message === "Cannot remove self")
    return error(res, "Leader cannot remove self", 400);
  if (err?.message === "Only students can be invited as members")
    return error(res, "Only students can be invited as members", 400);
  if (err?.message === "Already a member of this team")
    return error(res, "User is already a member of this team", 409);
  if (err?.message === "Only admin or judge users can be mentors")
    return error(
      res,
      "Only admin or judge users can be assigned as mentors",
      400,
    );
  if (err?.message === "Already a mentor of this team")
    return error(res, "User is already a mentor of this team", 409);
  return error(res, "Internal server error", 500);
};

export const listTeams = async (req: Request, res: Response) => {
  try {
    const teams = await teamService.listTeams(req.user!.id);
    return success(res, teams);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.getTeam(req.params.id, req.user!.id);
    return success(res, team);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.createTeam(
      req.user!.id,
      req.body.name,
      req.body.description || "",
    );
    return success(res, team, "Team created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const joinTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.joinTeam(req.user!.id, req.body.code);
    return success(res, team, "Joined team");
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.updateTeam(
      req.params.id,
      req.user!.id,
      req.body.name,
    );
    return success(res, team);
  } catch (err) {
    return mapError(err, res);
  }
};

export const deleteTeam = async (req: Request, res: Response) => {
  try {
    const team = await teamService.deleteTeam(req.params.id, req.user!.id);
    return success(res, team);
  } catch (err) {
    return mapError(err, res);
  }
};

export const leaveTeam = async (req: Request, res: Response) => {
  try {
    const result = await teamService.leaveTeam(req.params.id, req.user!.id);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const removeMember = async (req: Request, res: Response) => {
  try {
    const result = await teamService.removeMember(
      req.params.id,
      req.user!.id,
      req.params.userId,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const changeRole = async (req: Request, res: Response) => {
  try {
    const result = await teamService.changeRole(
      req.params.id,
      req.user!.id,
      req.params.userId,
      req.body.role,
    );
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const searchStudents = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const teamId = (req.query.teamId as string) || undefined;
    const users = await teamService.searchStudents(query, teamId);
    return success(res, users);
  } catch (err) {
    return mapError(err, res);
  }
};

export const searchMentors = async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || "";
    const teamId = (req.query.teamId as string) || undefined;
    const users = await teamService.searchMentors(query, teamId);
    return success(res, users);
  } catch (err) {
    return mapError(err, res);
  }
};

export const inviteMember = async (req: Request, res: Response) => {
  try {
    const member = await teamService.inviteMember(
      req.params.id,
      req.user!.id,
      req.body.userId,
    );
    return success(res, member, "Member invited successfully", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const assignMentor = async (req: Request, res: Response) => {
  try {
    const mentor = await teamService.assignMentor(
      req.params.id,
      req.user!.id,
      req.body.userId,
    );
    return success(res, mentor, "Mentor assigned successfully", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const removeMentor = async (req: Request, res: Response) => {
  try {
    await teamService.removeMentor(
      req.params.id,
      req.user!.id,
      req.params.userId,
    );
    return success(res, null, "Mentor removed");
  } catch (err) {
    return mapError(err, res);
  }
};
