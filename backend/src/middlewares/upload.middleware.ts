import multer, { FileFilterCallback } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userId = req.user?.id || "public";
    const dest = path.join("uploads", userId, `${Date.now()}`);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, "_");
    cb(null, `${timestamp}_${sanitized}`);
  },
});

const allowedMime = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "video/mp4",
];
const allowedExt = [".pdf", ".docx", ".pptx", ".jpg", ".jpeg", ".png", ".mp4"];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMime.includes(file.mimetype) && allowedExt.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"));
  }
};

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
}).single("file");

export const uploadAvatar = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if ([".jpg", ".jpeg", ".png"].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid avatar type"));
    }
  },
  limits: { fileSize: 2 * 1024 * 1024 },
}).single("avatar");
