import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as siswaService from "./siswa.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.code === "P2002") return error(res, "Data already exists", 409);
  return error(res, "Internal server error", 500);
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const data = await siswaService.getProfile(req.user!.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const data = await siswaService.updateProfile(req.user!.id, req.body);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return error(res, "No file uploaded", 400);
    }
    const avatarUrl = `/uploads/${req.file.path.split("uploads/")[1]}`;
    const profile = await siswaService.setAvatar(req.user!.id, avatarUrl);
    return success(res, { avatarUrl: profile.avatar });
  } catch (err) {
    return mapError(err, res);
  }
};

export const myEvents = async (req: Request, res: Response) => {
  try {
    const data = await siswaService.myEvents(req.user!.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const mySubmissions = async (req: Request, res: Response) => {
  try {
    const data = await siswaService.mySubmissions(req.user!.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const myCertificates = async (req: Request, res: Response) => {
  try {
    const data = await siswaService.myCertificates(req.user!.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};
