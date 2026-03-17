import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN_SECRET =
  process.env.ACCESS_TOKEN_SECRET || "dev_access_secret";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "dev_refresh_secret";

interface AccessPayload {
  id: string;
  email: string;
  role: string;
}

interface RefreshPayload {
  id: string;
}

export const generateAccessToken = (payload: AccessPayload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

export const generateRefreshToken = (payload: RefreshPayload) => {
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

export const verifyAccessToken = (token: string): AccessPayload | null => {
  try {
    return jwt.verify(token, ACCESS_TOKEN_SECRET) as AccessPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError)
      return null;
    return null;
  }
};

export const verifyRefreshToken = (token: string): RefreshPayload | null => {
  try {
    return jwt.verify(token, REFRESH_TOKEN_SECRET) as RefreshPayload;
  } catch (err) {
    if (err instanceof TokenExpiredError || err instanceof JsonWebTokenError)
      return null;
    return null;
  }
};
