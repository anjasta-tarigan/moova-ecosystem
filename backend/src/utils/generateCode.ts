import { PrismaClient } from "@prisma/client";

const randomSuffix = (length: number) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateTeamCode = async (
  prisma: PrismaClient,
): Promise<string> => {
  let code = `GIVA-${randomSuffix(5)}`;
  let exists = await prisma.team.findUnique({ where: { code } });
  while (exists) {
    code = `GIVA-${randomSuffix(5)}`;
    exists = await prisma.team.findUnique({ where: { code } });
  }
  return code;
};
