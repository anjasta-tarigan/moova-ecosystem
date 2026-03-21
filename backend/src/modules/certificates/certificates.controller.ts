import { Request, Response } from "express";
import { error, success } from "../../utils/response";
import * as svc from "./certificates.service";

export async function issueHandler(req: Request, res: Response) {
  try {
    const issuedById = req.user!.id;
    const cert = await svc.issueCertificate({ ...req.body, issuedById });
    return success(res, cert, "Certificate issued", 201);
  } catch (e: any) {
    return error(res, e.message, 400);
  }
}

export async function listHandler(req: Request, res: Response) {
  try {
    const { userId, eventId, status, page, limit, search } = req.query;
    const result = await svc.listCertificates({
      userId: userId as string | undefined,
      eventId: eventId as string | undefined,
      status: status as any,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      search: search as string | undefined,
    });
    return res.json({ success: true, ...result });
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

export async function revokeHandler(req: Request, res: Response) {
  try {
    const revokedById = req.user!.id;
    const cert = await svc.revokeCertificate({
      certCode: req.params.certCode,
      revokedById,
      reason: req.body.reason ?? "Revoked by administrator",
    });
    return success(res, cert, "Certificate revoked");
  } catch (e: any) {
    return error(res, e.message, 400);
  }
}

export async function verifyHandler(req: Request, res: Response) {
  try {
    const result = await svc.verifyCertificate(req.params.certCode);
    return success(res, result);
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}

export async function myHandler(req: Request, res: Response) {
  try {
    const userId = req.user!.id;
    const certs = await svc.getMyCertificates(userId);
    return success(res, certs);
  } catch (e: any) {
    return error(res, e.message, 500);
  }
}
