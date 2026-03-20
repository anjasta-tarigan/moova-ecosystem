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
    include: {
      members: { include: { user: true } },
      mentors: { include: { user: true } },
      registrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              status: true,
              date: true,
            },
          },
        },
        orderBy: { registeredAt: "desc" },
      },
    },
  });
};

export const getTeam = async (teamId: string, userId: string) => {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: { include: { user: true } },
      mentors: { include: { user: true } },
      registrations: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              status: true,
              date: true,
            },
          },
        },
        orderBy: { registeredAt: "desc" },
      },
    },
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

export const createTeam = async (
  userId: string,
  name: string,
  description: string = "",
) => {
  const code = await generateTeamCode(prisma);
  return prisma.team.create({
    data: {
      name,
      description,
      code,
      members: {
        create: { userId, role: "LEADER" },
      },
    },
    include: { members: { include: { user: true } } },
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

// Search students not already in a given team
// If teamId is not provided, returns all students
export const searchStudents = async (query: string, teamId?: string) => {
  const where: any = {
    role: "STUDENT",
    isActive: true,
  };

  if (query && query.trim().length > 0) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  // Exclude users already in the team
  if (teamId) {
    const existingMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true },
    });
    const existingIds = existingMembers.map((m) => m.userId);
    if (existingIds.length > 0) {
      where.id = { notIn: existingIds };
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      profile: {
        select: {
          avatar: true,
          schoolName: true,
          province: true,
        },
      },
    },
    take: 20,
    orderBy: { fullName: "asc" },
  });

  return users;
};

// Search admin users available as mentors for a team
export const searchMentors = async (query: string, teamId?: string) => {
  const where: any = {
    role: { in: ["ADMIN"] },
    isActive: true,
  };

  if (query && query.trim().length > 0) {
    where.OR = [
      { fullName: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
    ];
  }

  // Exclude users already mentoring this team
  if (teamId) {
    const existingMentors = await prisma.teamMentor.findMany({
      where: { teamId },
      select: { userId: true },
    });
    const existingIds = existingMentors.map((m) => m.userId);
    if (existingIds.length > 0) {
      where.id = { notIn: existingIds };
    }
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      profile: {
        select: {
          avatar: true,
          schoolName: true,
        },
      },
    },
    take: 20,
    orderBy: { fullName: "asc" },
  });

  return users;
};

// Invite (directly add) a student to a team
export const inviteMember = async (
  teamId: string,
  leaderId: string,
  targetUserId: string,
) => {
  // Verify the caller is the team leader
  await ensureLeader(teamId, leaderId);

  // Verify target user exists and is a STUDENT
  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
  });
  if (!target) {
    const err: any = new Error("User not found");
    err.code = "P2025";
    throw err;
  }
  if (target.role !== "STUDENT") {
    throw new Error("Only students can be invited as members");
  }

  // Check not already a member
  const existing = await prisma.teamMember.findFirst({
    where: { teamId, userId: targetUserId },
  });
  if (existing) {
    throw new Error("Already a member of this team");
  }

  // Check team is still active
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team || team.status !== "ACTIVE") {
    throw new Error("Team is not active");
  }

  return prisma.teamMember.create({
    data: {
      teamId,
      userId: targetUserId,
      role: "MEMBER",
    },
    include: { user: true },
  });
};

// Assign an admin/judge as mentor of a team
export const assignMentor = async (
  teamId: string,
  leaderId: string,
  mentorUserId: string,
) => {
  await ensureLeader(teamId, leaderId);

  const mentor = await prisma.user.findUnique({
    where: { id: mentorUserId },
  });
  if (!mentor) {
    const err: any = new Error("User not found");
    err.code = "P2025";
    throw err;
  }
  if (!["ADMIN"].includes(mentor.role)) {
    throw new Error("Only admin or judge users can be mentors");
  }

  // Check not already a mentor
  const existing = await prisma.teamMentor.findUnique({
    where: { teamId_userId: { teamId, userId: mentorUserId } },
  });
  if (existing) {
    throw new Error("Already a mentor of this team");
  }

  return prisma.teamMentor.create({
    data: { teamId, userId: mentorUserId },
    include: { user: true },
  });
};

// Remove a mentor from a team
export const removeMentor = async (
  teamId: string,
  leaderId: string,
  mentorUserId: string,
) => {
  await ensureLeader(teamId, leaderId);

  const mentor = await prisma.teamMentor.findUnique({
    where: { teamId_userId: { teamId, userId: mentorUserId } },
  });
  if (!mentor) {
    const err: any = new Error("Mentor not found");
    err.code = "P2025";
    throw err;
  }

  return prisma.teamMentor.delete({
    where: { teamId_userId: { teamId, userId: mentorUserId } },
  });
};
