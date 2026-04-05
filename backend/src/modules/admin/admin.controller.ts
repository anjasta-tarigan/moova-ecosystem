import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import sharp from "sharp";
import { error, paginated, success } from "../../utils/response";
import * as adminService from "./admin.service";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const resolveResourceType = (mimeType: string) => {
  const normalized = String(mimeType || "").toLowerCase();
  if (normalized.includes("pdf")) return "PDF";
  if (normalized.includes("word")) return "DOC";
  if (normalized.includes("presentation")) return "PPT";
  if (normalized.includes("sheet") || normalized.includes("excel"))
    return "XLS";
  if (normalized.includes("zip")) return "ZIP";
  if (normalized.includes("image")) return "IMAGE";
  return "OTHER";
};

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

export const getManageEvent = async (req: Request, res: Response) => {
  try {
    const event = await adminService.getManageEvent(req.params.id);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateEventConfiguration = async (req: Request, res: Response) => {
  try {
    const event = await adminService.updateEventConfiguration(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventFaqs = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventFaqs(req.params.id, req.body);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventCriteria = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventCriteria(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventTimeline = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventTimeline(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const updateEventRules = async (req: Request, res: Response) => {
  try {
    const event = await adminService.updateEventRules(req.params.id, req.body);
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventResources = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventResources(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventJudges = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventJudges(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventStages = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventStages(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const replaceEventAwards = async (req: Request, res: Response) => {
  try {
    const event = await adminService.replaceEventAwards(
      req.params.id,
      req.body,
    );
    return success(res, event);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listEventTaxonomies = async (_req: Request, res: Response) => {
  try {
    const payload = await adminService.listEventTaxonomies();
    return success(res, payload);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createEventTypeTaxonomy = async (req: Request, res: Response) => {
  try {
    const payload = await adminService.createEventTypeTaxonomy(req.body?.name);
    return success(res, payload, "Event type created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createEventEligibilityTaxonomy = async (
  req: Request,
  res: Response,
) => {
  try {
    const payload = await adminService.createEventEligibilityTaxonomy(
      req.body?.name,
    );
    return success(res, payload, "Eligibility category created", 201);
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

    const filename = `events/banner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.webp`;

    // 1. Optimasi gambar pakai Sharp, TAPI JANGAN toFile(), gunakan toBuffer()
    const optimizedBuffer = await sharp(req.file.buffer)
      .resize(1600, 900, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer(); // <--- Ini kunci rahasianya!

    // 2. Upload Buffer langsung ke Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from("giva-events") // <--- Ganti dengan nama bucket yang Anda buat di Langkah 1
      .upload(filename, optimizedBuffer, {
        contentType: "image/webp",
        upsert: false, // Jangan timpa file dengan nama sama
      });

    if (uploadError) {
      console.error("Supabase Error:", uploadError);
      throw new Error("Gagal mengunggah ke Cloud Storage");
    }

    // 3. Dapatkan URL Publik dari gambar yang baru diupload
    const { data: publicUrlData } = supabase.storage
      .from("giva-storage")
      .getPublicUrl(filename);

    // 4. Kembalikan URL tersebut ke Frontend
    return success(res, { url: publicUrlData.publicUrl }, "Banner uploaded");
  } catch (err: any) {
    console.error("🔥 UPLOAD BANNER ERROR:", err); // Agar log tidak bisu di Vercel
    if (err?.message?.includes("File too large"))
      return error(res, "Banner exceeds 2MB limit", 413);
    return mapError(err, res);
  }
};

export const uploadEventResources = async (req: Request, res: Response) => {
  try {
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) return error(res, "No files uploaded", 400);

    const titlesInput = req.body?.titles;
    const typesInput = req.body?.types;
    const titles = Array.isArray(titlesInput)
      ? titlesInput
      : typeof titlesInput === "string"
        ? [titlesInput]
        : [];
    const types = Array.isArray(typesInput)
      ? typesInput
      : typeof typesInput === "string"
        ? [typesInput]
        : [];

    const resourceDir = path.join(
      __dirname,
      "../../../uploads/events/resources",
    );
    fs.mkdirSync(resourceDir, { recursive: true });

    const uploaded = files.map((file, index) => {
      const extension = path.extname(file.originalname || "") || ".bin";
      const filename = `resource-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
      const fullPath = path.join(resourceDir, filename);
      fs.writeFileSync(fullPath, file.buffer);

      const userTitle = String(titles[index] || "").trim();
      const userType = String(types[index] || "")
        .trim()
        .toUpperCase();

      return {
        title: userTitle || path.parse(file.originalname || filename).name,
        fileName: file.originalname || filename,
        url: `/uploads/events/resources/${filename}`,
        mimeType: file.mimetype || "",
        sizeBytes: file.size || null,
        type: userType || resolveResourceType(file.mimetype),
      };
    });

    return success(res, { files: uploaded }, "Resources uploaded", 201);
  } catch (err: any) {
    if (err?.code === "LIMIT_FILE_SIZE") {
      return error(res, "Resource file exceeds 25MB limit", 413);
    }
    return mapError(err, res);
  }
};
