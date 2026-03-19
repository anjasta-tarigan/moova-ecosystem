import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError, JsonWebTokenError } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "dev_access_secret";

interface TokenPayload {
  id: string;
  email: string;
  role: "SUPERADMIN" | "ADMIN" | "JUDGE" | "STUDENT";
  iat: number;
  exp: number;
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET) as TokenPayload;

    req.user = { id: payload.id, email: payload.email, role: payload.role };
    return next();
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    if (err instanceof JsonWebTokenError) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
};
