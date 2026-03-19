import bcrypt from "bcryptjs";
import prisma from "../../config/database";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../utils/jwt";

type UserRecord = Awaited<ReturnType<typeof prisma.user.create>>;

const sanitizeUser = (user: UserRecord) => {
  const { password, ...rest } = user;
  return rest;
};

const refreshExpiry = () => {
  const expires = new Date();
  expires.setDate(expires.getDate() + 7);
  return expires;
};

export const register = async (
  fullName: string,
  email: string,
  password: string,
) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    const err: any = new Error("Data already exists");
    err.code = "P2002";
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashed,
      role: "STUDENT",
      profile: {
        create: {},
      },
    },
  });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ id: user.id });

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiry() },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  // clear expired/old tokens for the user
  await prisma.refreshToken.deleteMany({
    where: { userId: user.id, expiresAt: { lt: new Date() } },
  });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ id: user.id });
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiry() },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const refreshTokens = async (token: string) => {
  const payload = verifyRefreshToken(token);
  if (!payload) {
    throw new Error("Invalid token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new Error("Invalid token");
  }

  const user = await prisma.user.findUnique({ where: { id: stored.userId } });
  if (!user) {
    throw new Error("Invalid token");
  }

  await prisma.refreshToken.delete({ where: { token } });

  const accessToken = generateAccessToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });
  const refreshToken = generateRefreshToken({ id: user.id });
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id, expiresAt: refreshExpiry() },
  });

  return { user: sanitizeUser(user), accessToken, refreshToken };
};

export const logout = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
  return true;
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
    },
  });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const { password, ...rest } = user;
  return rest;
};
