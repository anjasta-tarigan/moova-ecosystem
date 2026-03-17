import { Request, Response } from "express";
import { error, paginated, success } from "../../utils/response";
import * as certService from "./certificates.service";

const mapError = (err: any, res: Response) => {
  if (err?.code === "P2025") return error(res, "Data not found", 404);
  return error(res, "Internal server error", 500);
};

export const verify = async (req: Request, res: Response) => {
  try {
    const cert = await certService.verifyCertificate(req.params.id);
    return success(res, cert);
  } catch (err) {
    return mapError(err, res);
  }
};

export const myCertificates = async (req: Request, res: Response) => {
  try {
    const certs = await certService.listMyCertificates(req.user!.id);
    return success(res, certs);
  } catch (err) {
    return mapError(err, res);
  }
};

export const createCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await certService.createCertificate(req.body);
    return success(res, cert, "Certificate created", 201);
  } catch (err) {
    return mapError(err, res);
  }
};

export const listCertificates = async (req: Request, res: Response) => {
  try {
    const result = await certService.listCertificates(req.query);
    return paginated(res, result.data, result.total, result.page, result.limit);
  } catch (err) {
    return mapError(err, res);
  }
};

export const revokeCertificate = async (req: Request, res: Response) => {
  try {
    const cert = await certService.revokeCertificate(
      req.params.id,
      req.body.reason,
    );
    return success(res, cert, "Certificate revoked");
  } catch (err) {
    return mapError(err, res);
  }
};
