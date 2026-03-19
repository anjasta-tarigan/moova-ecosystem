import prisma from "../../config/database";

const calculateCompleteness = (user: { fullName?: string }, profile: any) => {
  const requiredFields = [
    Boolean(user.fullName),
    Boolean(profile.phone),
    Boolean(profile.birthDate),
    Boolean(profile.gender),
    Boolean(profile.schoolName),
    Boolean(profile.schoolLevel),
    Boolean(profile.grade),
    Boolean(profile.province),
    Boolean(profile.city),
  ];
  const perField = 80 / requiredFields.length;
  let score = requiredFields.reduce((acc, ok) => acc + (ok ? perField : 0), 0);

  if (profile.avatar) score += 5;
  if (profile.bio) score += 5;
  if (profile.skills && profile.skills.length > 0) score += 5;
  if (profile.github || profile.linkedin) score += 5;

  return Math.min(100, Math.round(score));
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  let profile = await prisma.siswaProfile.findUnique({ where: { userId } });

  if (!profile) {
    profile = await prisma.siswaProfile.create({ data: { userId } });
  }

  const completeness = calculateCompleteness(user, profile);

  return {
    user: { ...user, password: undefined },
    profile: { ...profile, completeness },
  };
};

export const updateProfile = async (userId: string, data: any) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const { fullName, birthDate, ...profileData } = data;
  const updatedUser = fullName
    ? await prisma.user.update({ where: { id: userId }, data: { fullName } })
    : user;

  const profilePayload = {
    ...profileData,
    birthDate: birthDate ? new Date(birthDate) : undefined,
  };

  const completeness = calculateCompleteness(updatedUser, profilePayload);

  const savedProfile = await prisma.siswaProfile.upsert({
    where: { userId },
    update: { ...profilePayload, completeness },
    create: { userId, ...profilePayload, completeness },
  });

  return {
    user: { ...updatedUser, password: undefined },
    profile: savedProfile,
  };
};

export const setAvatar = async (userId: string, avatarPath: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || !user.profile) {
    const err: any = new Error("Data not found");
    err.code = "P2025";
    throw err;
  }

  const updatedProfile = await prisma.siswaProfile.update({
    where: { id: user.profile.id },
    data: { avatar: avatarPath },
  });

  const completeness = calculateCompleteness(user, updatedProfile);
  const savedProfile = await prisma.siswaProfile.update({
    where: { id: updatedProfile.id },
    data: { completeness },
  });

  return savedProfile;
};

export const myEvents = async (userId: string) => {
  return prisma.eventRegistration.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          categories: true,
        },
      },
      team: true,
    },
  });
};

export const mySubmissions = async (userId: string) => {
  const memberships = await prisma.teamMember.findMany({ where: { userId } });
  const teamIds = memberships.map((m) => m.teamId);
  return prisma.submission.findMany({
    where: { teamId: { in: teamIds } },
    include: {
      files: true,
      scores: true,
      event: true,
      team: true,
    },
  });
};

export const myCertificates = async (userId: string) => {
  return prisma.certificate.findMany({
    where: { recipientId: userId },
    include: { event: true },
  });
};
