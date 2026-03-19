import { Request, Response } from "express";
import sharp from "sharp";
import path from "path";
import fs from "fs";
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
      return error(res, "No image file provided", 400);
    }

    const userId = req.user!.id;

    // Create user avatar directory
    const avatarDir = path.join(__dirname, "../../../uploads/avatars", userId);
    fs.mkdirSync(avatarDir, { recursive: true });

    // Delete old avatar files for this user
    const existingFiles = fs.readdirSync(avatarDir);
    for (const f of existingFiles) {
      fs.unlinkSync(path.join(avatarDir, f));
    }

    // Compress with sharp:
    // - Resize to max 400x400 (maintain aspect ratio)
    // - Convert to WebP
    // - Quality 80 (good balance: quality vs size)
    const filename = `avatar-${Date.now()}.webp`;
    const outputPath = path.join(avatarDir, filename);

    await sharp(req.file.buffer)
      .resize(400, 400, {
        fit: "cover", // crop to fill square
        position: "center",
      })
      .webp({ quality: 80 })
      .toFile(outputPath);

    // Build public URL
    const avatarUrl = `/uploads/avatars/${userId}/${filename}`;

    // Save URL to profile
    const updatedProfile = await siswaService.setAvatar(userId, avatarUrl);

    return success(
      res,
      {
        avatarUrl,
        profile: updatedProfile,
      },
      "Avatar updated successfully",
    );
  } catch (err: any) {
    console.error("Avatar upload error:", err);
    return error(res, "Failed to upload avatar", 500);
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
