import { Request, Response } from "express";
import { error, paginated, success } from "../../utils/response";
import * as superService from "./superadmin.service";
import bcrypt from "bcryptjs";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.message === "Invalid judge")
    return error(res, "Invalid judge selection", 400);
  if (err?.message === "Invalid category")
    return error(res, "Category does not belong to event", 400);
  if (err?.message === "Cannot edit superadmin")
    return error(res, "Cannot edit superadmin", 400);
  if (err?.message === "Cannot delete superadmin")
    return error(res, "Cannot delete superadmin", 400);
  if (err?.message === "Cannot delete self")
    return error(res, "Cannot delete self", 400);
  return error(res, "Internal server error", 500);
};

export const listUsers = async (req: Request, res: Response) => {
  try {
    const result = await superService.listUsers(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const hashed = await bcrypt.hash(req.body.password, 10);
    const user = await superService.createUser({
      ...req.body,
      password: hashed,
    });
    return success(res, user, "User created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const data: any = { fullName: req.body.fullName, email: req.body.email };
    if (req.body.password)
      data.password = await bcrypt.hash(req.body.password, 10);
    const user = await superService.updateUser(req.params.id, data);
    return success(res, user);
  } catch (err) {
    return mapError(err, res);
  }
};

export const toggleActive = async (req: Request, res: Response) => {
  try {
    const user = await superService.toggleActive(req.params.id);
    return success(res, user);
  } catch (err) {
    return mapError(err, res);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const result = await superService.deleteUser(req.params.id, req.user!.id);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createAssignment = async (req: Request, res: Response) => {
  try {
    const assignment = await superService.createAssignment(req.body);
    return success(res, assignment, "Assignment created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  try {
    const result = await superService.deleteAssignment(req.params.id);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const systemStats = async (_req: Request, res: Response) => {
  try {
    const data = await superService.systemStats();
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};
