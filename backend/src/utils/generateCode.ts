import { PrismaClient } from "@prisma/client";

const randomCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const generateTeamCode = async (
  prisma: PrismaClient,
): Promise<string> => {
  let code = randomCode();
  let exists = await prisma.team.findUnique({ where: { code } });
  while (exists) {
    code = randomCode();
    exists = await prisma.team.findUnique({ where: { code } });
  }
  return code;
};
