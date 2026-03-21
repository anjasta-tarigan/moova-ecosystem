import { AwardType, CertStatus } from "@prisma/client";
import * as crypto from "crypto";
import prisma from "../../config/database";

function generateCertCode(): string {
  const year = new Date().getFullYear();
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `GIVA-${year}-${rand}`;
}

function computeHash(
  certCode: string,
  userId: string,
  eventId: string,
  issuedAt: Date,
  prevHash: string,
): string {
  const payload = `${certCode}|${userId}|${eventId}|${issuedAt.toISOString()}|${prevHash}`;
  return crypto.createHash("sha256").update(payload).digest("hex");
}

async function getLatestHash(): Promise<string> {
  const latest = await prisma.certificate.findFirst({
    orderBy: { issuedAt: "desc" },
    select: { certHash: true },
  });
  return latest?.certHash ?? "GENESIS";
}

const INCLUDE = {
  user: { select: { id: true, fullName: true, email: true } },
  event: { select: { id: true, title: true } },
  issuedBy: { select: { id: true, fullName: true } },
};

export async function issueCertificate(data: {
  userId: string;
  eventId?: string;
  awardType: AwardType;
  customTitle?: string;
  rankLabel?: string;
  issuedById: string;
  templateId?: string;
  bgDataUrl?: string;
}) {
  if (data.awardType === "WINNER" && !data.rankLabel) {
    throw new Error("rankLabel is required for WINNER");
  }
  if (data.awardType === "CUSTOM" && !data.customTitle) {
    throw new Error("customTitle is required for CUSTOM");
  }

  const certCode = generateCertCode();
  const issuedAt = new Date();
  const prevHash = await getLatestHash();
  const certHash = computeHash(
    certCode,
    data.userId,
    data.eventId ?? "NO_EVENT",
    issuedAt,
    prevHash,
  );

  return prisma.certificate.create({
    data: {
      certCode,
      issuedAt,
      certHash,
      prevHash,
      status: "ACTIVE",
      userId: data.userId,
      eventId: data.eventId ?? null,
      awardType: data.awardType,
      customTitle: data.customTitle ?? null,
      rankLabel: data.rankLabel ?? null,
      issuedById: data.issuedById,
      templateId: data.templateId ?? "modern",
      bgDataUrl: data.bgDataUrl ?? null,
    },
    include: INCLUDE,
  });
}

export async function listCertificates(filters: {
  userId?: string;
  eventId?: string;
  status?: CertStatus;
  page?: number;
  limit?: number;
  search?: string;
}) {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (filters.userId) where.userId = filters.userId;
  if (filters.eventId) where.eventId = filters.eventId;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { certCode: { contains: filters.search, mode: "insensitive" } },
      {
        user: {
          fullName: { contains: filters.search, mode: "insensitive" },
        },
      },
      { user: { email: { contains: filters.search, mode: "insensitive" } } },
    ];
  }

  const [total, data] = await Promise.all([
    prisma.certificate.count({ where }),
    prisma.certificate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { issuedAt: "desc" },
      include: INCLUDE,
    }),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getCertificateByCode(certCode: string) {
  return prisma.certificate.findUnique({
    where: { certCode },
    include: INCLUDE,
  });
}

export async function verifyCertificate(certCode: string) {
  const cert = await getCertificateByCode(certCode);
  if (!cert) {
    return { valid: false, reason: "CERT_NOT_FOUND", cert: null };
  }
  if (cert.status === "REVOKED") {
    return {
      valid: false,
      reason: "CERT_REVOKED",
      cert,
      revokedAt: cert.revokedAt,
      revocationReason: cert.revocationReason,
    };
  }

  const recomputed = computeHash(
    cert.certCode,
    cert.userId,
    cert.eventId ?? "NO_EVENT",
    cert.issuedAt,
    cert.prevHash,
  );

  if (recomputed !== cert.certHash) {
    return { valid: false, reason: "HASH_MISMATCH", cert };
  }

  return {
    valid: true,
    reason: "VERIFIED",
    cert,
    hashInfo: {
      certHash: cert.certHash,
      prevHash: cert.prevHash,
      algorithm: "SHA-256",
      isGenesis: cert.prevHash === "GENESIS",
    },
  };
}

export async function revokeCertificate(data: {
  certCode: string;
  revokedById: string;
  reason: string;
}) {
  const cert = await prisma.certificate.findUnique({
    where: { certCode: data.certCode },
  });
  if (!cert) throw new Error("Certificate not found");
  if (cert.status === "REVOKED") throw new Error("Already revoked");

  return prisma.certificate.update({
    where: { certCode: data.certCode },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
      revokedById: data.revokedById,
      revocationReason: data.reason,
    },
  });
}

export async function getMyCertificates(userId: string) {
  return prisma.certificate.findMany({
    where: { userId, status: "ACTIVE" },
    orderBy: { issuedAt: "desc" },
    include: INCLUDE,
  });
}
