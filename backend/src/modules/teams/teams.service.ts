import prisma from "../../config/database";
import { generateTeamCode } from "../../utils/generateCode";

const ensureLeader = async (teamId: string, userId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  if (!membership) throw new Error("Not team member");
  if (membership.role !== "LEADER") throw new Error("Not team leader");
};

export const listTeams = async (userId: string) => {
  return prisma.team.findMany({
    where: { members: { some: { userId } } },
    include: { members: { include: { user: true } } },
  });
};

export const getTeam = async (teamId: string, userId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { include: { user: true } } },
  });
  if (!team) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  const member = team.members.find((m: any) => m.userId === userId);
  if (!member) throw new Error("Not team member");
  return team;
};

export const createTeam = async (userId: string, name: string) => {
  const code = await generateTeamCode(prisma);
  return prisma.team.create({
    data: {
      name,
      code,
      members: {
        create: { userId, role: "LEADER" },
      },
    },
    include: { members: true },
  });
};

export const joinTeam = async (userId: string, code: string) => {
  const team = await prisma.team.findUnique({
    where: { code },
    include: { members: true },
  });
  if (!team) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }
  if (team.status !== "ACTIVE") throw new Error("Team not active");
  if (team.members.some((m: any) => m.userId === userId))
    throw new Error("Already member");

  await prisma.teamMember.create({ data: { teamId: team.id, userId } });
  return prisma.team.findUnique({
    where: { id: team.id },
    include: { members: true },
  });
};

export const updateTeam = async (
  teamId: string,
  userId: string,
  name: string,
) => {
  await ensureLeader(teamId, userId);
  return prisma.team.update({ where: { id: teamId }, data: { name } });
};

export const deleteTeam = async (teamId: string, userId: string) => {
  await ensureLeader(teamId, userId);
  return prisma.team.update({
    where: { id: teamId },
    data: { status: "DISBANDED" },
  });
};

export const leaveTeam = async (teamId: string, userId: string) => {
  const membership = await prisma.teamMember.findFirst({
    where: { teamId, userId },
  });
  if (!membership) throw new Error("Not team member");

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    orderBy: { joinedAt: "asc" },
  });
  if (membership.role === "LEADER") {
    const others = members.filter((m: any) => m.userId !== userId);
    if (others.length === 0) {
      await prisma.team.update({
        where: { id: teamId },
        data: { status: "DISBANDED" },
      });
      await prisma.teamMember.delete({ where: { id: membership.id } });
      return { message: "Team disbanded" };
    }
    const nextLeader = others[0];
    await prisma.teamMember.update({
      where: { id: nextLeader.id },
      data: { role: "LEADER" },
    });
  }

  await prisma.teamMember.delete({ where: { id: membership.id } });
  return { message: "Left team" };
};

export const removeMember = async (
  teamId: string,
  leaderId: string,
  targetUserId: string,
) => {
  await ensureLeader(teamId, leaderId);
  if (leaderId === targetUserId) throw new Error("Cannot remove self");
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: targetUserId },
  });
  if (!member) throw new Error("Not team member");
  await prisma.teamMember.delete({ where: { id: member.id } });
  return { message: "Member removed" };
};

export const changeRole = async (
  teamId: string,
  leaderId: string,
  targetUserId: string,
  role: "LEADER" | "MEMBER",
) => {
  await ensureLeader(teamId, leaderId);
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId: targetUserId },
  });
  if (!member) throw new Error("Not team member");

  if (role === "LEADER") {
    const currentLeader = await prisma.teamMember.findFirst({
      where: { teamId, role: "LEADER" },
    });
    if (currentLeader) {
      await prisma.teamMember.update({
        where: { id: currentLeader.id },
        data: { role: "MEMBER" },
      });
    }
  }

  await prisma.teamMember.update({ where: { id: member.id }, data: { role } });
  return { message: "Role updated" };
};
