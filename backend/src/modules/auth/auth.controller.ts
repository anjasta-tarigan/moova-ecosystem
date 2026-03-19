import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as authService from "./auth.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2002") {
    return error(res, "Data already exists", 409);
  }
  if (err?.code === "P2025") {
    return error(res, "Data not found", 404);
  }
  if (err?.message === "Invalid credentials") {
    return error(res, "Invalid email or password", 401);
  }
  if (err?.message === "Invalid token") {
    return error(res, "Invalid token", 401);
  }
  return error(res, "Internal server error", 500);
};

export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;
    const result = await authService.register(fullName, email, password);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    return success(res, { message: "Logged out" });
  } catch (err) {
    return mapError(err, res);
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(
      req.user!.id,
      currentPassword,
      newPassword,
    );
    return success(res, result, "Password changed successfully");
  } catch (err: any) {
    if (err?.statusCode === 400) {
      return error(res, err.message, 400);
    }
    if (err?.code === "P2025") {
      return error(res, "User not found", 404);
    }
    return error(res, "Failed to change password", 500);
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const data = await authService.getMe(req.user!.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};
