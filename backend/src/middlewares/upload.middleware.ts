import multer from "multer";
import path from "path";
import fs from "fs";

// Memory storage for avatar (compress before write)
const avatarMemoryStorage = multer.memoryStorage();

// Memory storage for event banner uploads (superadmin only)
const bannerMemoryStorage = multer.memoryStorage();

export const uploadAvatar = multer({
  storage: avatarMemoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB raw limit
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
}).single("avatar");

export const uploadEventBannerMiddleware = multer({
  storage: bannerMemoryStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit per PRD
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
}).single("banner");

// Keep existing uploadSingle for submission files (diskStorage, unchanged)
const submissionStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(
      __dirname,
      "../../uploads/submissions",
      req.user?.id || "unknown",
    );
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${file.originalname}`;
    cb(null, unique);
  },
});

export const uploadSingle = multer({
  storage: submissionStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument" +
        ".wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument" +
        ".presentationml.presentation",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "video/mp4",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("File type not allowed"));
    }
  },
}).single("file");
