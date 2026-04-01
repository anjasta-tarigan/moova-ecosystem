import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { error, paginated, success } from "../../utils/response";
import * as adminService from "./admin.service";

const mapError = (err: any, res: Response) => {
  if (err?.status === 400 || err?.code === "VALIDATION_ERROR")
    return error(res, err?.message || "Invalid request", 400);
  if (err?.status === 403) return error(res, err?.message || "Forbidden", 403);
  if (err?.code === "SLUG_CONFLICT") return error(res, err?.message, 409);
  if (err?.code === "P2002")
    return error(res, "Unique constraint violated", 409);
  if (err?.code === "LIMIT_FILE_SIZE") return error(res, "File too large", 413);
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  if (err?.message === "Has registrations")
    return error(res, "Cannot delete event with registrations", 400);
  return error(res, "Internal server error", 500);
};

export const dashboard = async (_req: Request, res: Response) => {
  try {
    const data = await adminService.dashboard();
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listEvents = async (req: Request, res: Response) => {
  try {
    const result = await adminService.listEvents(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const event = await adminService.createEvent(req.body, req.user!.id);
    return success(res, event, "Event created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const event = await adminService.updateEvent(req.params.id, req.body);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateEventStatus = async (req: Request, res: Response) => {
  try {
    const status = req.body.status as string;
    const event = await adminService.updateEventStatus(req.params.id, status);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const result = await adminService.deleteEvent(req.params.id);
    return success(res, result);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listSubmissions = async (req: Request, res: Response) => {
  try {
    const result = await adminService.listSubmissions(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const advanceStage = async (req: Request, res: Response) => {
  try {
    const stage = req.body.stage as string;
    const submission = await adminService.advanceStage(req.params.id, stage);
    return success(res, submission);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await adminService.createCertificate(req.body);
    return success(res, cert, "Certificate created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listCertificates = async (req: Request, res: Response) => {
  try {
    const result = await adminService.listCertificates(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await adminService.revokeCertificate(
      req.params.id,
      req.body.reason,
    );
    return success(res, cert, "Certificate revoked");
  } catch (err) {
    return mapError(err, res);
  }
};

export const listSiswa = async (req: Request, res: Response) => {
  try {
    const result = await adminService.listSiswa(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const getSiswaDetail = async (req: Request, res: Response) => {
  try {
    const data = await adminService.getSiswaDetail(req.params.id);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const eventReport = async (req: Request, res: Response) => {
  try {
    const data = await adminService.eventReport(req.params.eventId);
    return success(res, data);
  } catch (err) {
    return mapError(err, res);
  }
};

export const uploadEventBanner = async (req: Request, res: Response) => {
  try {
    if (!req.file) return error(res, "No file uploaded", 400);

    const bannerDir = path.join(__dirname, "../../../uploads/events");
    fs.mkdirSync(bannerDir, { recursive: true });

    const filename = `event-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;
    const filePath = path.join(bannerDir, filename);

    await sharp(req.file.buffer)
      .resize(1600, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filePath);

    const publicUrl = `/uploads/events/${filename}`;
    return success(res, { url: publicUrl }, "Banner uploaded");
  } catch (err: any) {
    if (err?.message?.includes("File too large"))
      return error(res, "Banner exceeds 2MB limit", 413);
    return mapError(err, res);
  }
};
