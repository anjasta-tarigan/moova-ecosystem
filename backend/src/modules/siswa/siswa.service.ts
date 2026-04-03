import prisma from "../../config/database";

const calculateCompleteness = (
  user: { fullName?: string },
  profile: any,
): number => {
  const requiredFields = [
    Boolean(user.fullName),
    Boolean(profile.phone),
    Boolean(profile.country),
    Boolean(
      profile.affiliationType && profile.affiliationType !== "University"
        ? profile.affiliationType
        : profile.schoolName || profile.affiliationType,
    ),
    Boolean(profile.schoolName),
    Boolean(profile.schoolLevel || profile.educationLevel),
    Boolean(profile.faculty || profile.major),
    Boolean(profile.fieldOfStudy || profile.major),
    Boolean(profile.grade || profile.graduationYear),
    Boolean(profile.province || profile.city),
  ];

  // Each required field = 8% (10 fields × 8 = 80%)
  const perField = 80 / requiredFields.length;
  let score = requiredFields.reduce((acc, ok) => acc + (ok ? perField : 0), 0);

  // Bonus fields (up to 20%)
  if (profile.avatar) score += 5;
  if (profile.bio && profile.bio.length > 10) score += 5;
  if (profile.skills && profile.skills.length > 0) score += 5;
  if (profile.github || profile.linkedin || profile.googleScholar) score += 5;

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
  // Get current user for completeness calc
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const err: any = new Error("User not found");
    err.code = "P2025";
    throw err;
  }

  // Remove fields that shouldn't be in profile table
  const { fullName, email, ...profileData } = data;

  // Update fullName on user if provided
  if (fullName) {
    await prisma.user.update({
      where: { id: userId },
      data: { fullName },
    });
  }

  // Upsert profile
  const profile = await prisma.siswaProfile.upsert({
    where: { userId },
    update: profileData,
    create: { userId, ...profileData },
  });

  // Recalculate completeness with updated data
  const updatedUser = await prisma.user.findUnique({ where: { id: userId } });
  const completeness = calculateCompleteness(updatedUser!, profile);

  // Save completeness
  const saved = await prisma.siswaProfile.update({
    where: { userId },
    data: { completeness },
  });

  return {
    user: {
      ...updatedUser,
      password: undefined,
    },
    profile: { ...saved, completeness },
  };
};

export const setAvatar = async (userId: string, avatarUrl: string) => {
  const profile = await prisma.siswaProfile.upsert({
    where: { userId },
    update: { avatar: avatarUrl },
    create: { userId, avatar: avatarUrl },
  });
  return profile;
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

export const mySavedEvents = async (userId: string) => {
  return prisma.savedEvent.findMany({
    where: { userId },
    include: {
      event: {
        include: {
          categories: true,
          _count: { select: { registrations: true } },
        },
      },
    },
    orderBy: { savedAt: "desc" },
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
    where: { userId },
    include: { event: true },
  });
};
