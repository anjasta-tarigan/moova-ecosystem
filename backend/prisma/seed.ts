import bcrypt from "bcryptjs";

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const hashPassword = async (password: string) => bcrypt.hash(password, 10);

const computeCompleteness = (
  fullName: string,
  profile: {
    phone?: string;
    birthDate?: Date | null;
    gender?: string;
    schoolName?: string;
    schoolLevel?: string;
    grade?: string;
    province?: string;
    city?: string;
    avatar?: string;
    bio?: string;
    skills?: string[];
    github?: string;
    linkedin?: string;
  },
) => {
  const requiredFields: Array<[string, boolean]> = [
    ["fullName", Boolean(fullName)],
    ["phone", Boolean(profile.phone)],
    ["birthDate", Boolean(profile.birthDate)],
    ["gender", Boolean(profile.gender)],
    ["schoolName", Boolean(profile.schoolName)],
    ["schoolLevel", Boolean(profile.schoolLevel)],
    ["grade", Boolean(profile.grade)],
    ["province", Boolean(profile.province)],
    ["city", Boolean(profile.city)],
  ];
  const requiredScore = 80;
  const perField = requiredScore / requiredFields.length;
  let score = requiredFields.reduce(
    (acc, [, ok]) => acc + (ok ? perField : 0),
    0,
  );

  const bonusFields: Array<[string, boolean, number]> = [
    ["avatar", Boolean(profile.avatar), 5],
    ["bio", Boolean(profile.bio), 5],
    ["skills", (profile.skills?.length ?? 0) > 0, 5],
    ["social", Boolean(profile.github || profile.linkedin), 5],
  ];
  score += bonusFields.reduce((acc, [, ok, pts]) => acc + (ok ? pts : 0), 0);
  return Math.min(100, Math.round(score));
};

async function main() {
  const passwords = {
    superadmin: await hashPassword("superadmin123"),
    admin: await hashPassword("admin123"),
    judge: await hashPassword("judge123"),
    siswa: await hashPassword("student123"),
  };

  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@giva.test" },
    update: {},
    create: {
      fullName: "Super Admin",
      email: "superadmin@giva.test",
      password: passwords.superadmin,
      role: "SUPERADMIN",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@giva.test" },
    update: {},
    create: {
      fullName: "Admin GIVA",
      email: "admin@giva.test",
      password: passwords.admin,
      role: "ADMIN",
    },
  });

  const judge1 = await prisma.user.upsert({
    where: { email: "judge1@giva.test" },
    update: {},
    create: {
      fullName: "Judge 1",
      email: "judge1@giva.test",
      password: passwords.judge,
      role: "JURI",
    },
  });

  const judge2 = await prisma.user.upsert({
    where: { email: "judge2@giva.test" },
    update: {},
    create: {
      fullName: "Judge 2",
      email: "judge2@giva.test",
      password: passwords.judge,
      role: "JURI",
    },
  });

  const siswa = await prisma.user.upsert({
    where: { email: "student@giva.test" },
    update: {},
    create: {
      fullName: "Alex Smith",
      email: "student@giva.test",
      password: passwords.siswa,
      role: "SISWA",
    },
  });

  const profileCompleteness = computeCompleteness("Alex Smith", {
    phone: "+62-812-3456-7890",
    birthDate: new Date("2008-01-01"),
    gender: "Male",
    schoolName: "Jakarta Science High School",
    schoolLevel: "High School",
    grade: "Grade 11",
    province: "DKI Jakarta",
    city: "South Jakarta",
    skills: ["Python", "Machine Learning"],
    github: "https://github.com/alex-smith",
  });

  await prisma.siswaProfile.upsert({
    where: { userId: siswa.id },
    update: {
      phone: "+62-812-3456-7890",
      birthDate: new Date("2008-01-01"),
      gender: "Male",
      schoolName: "Jakarta Science High School",
      schoolLevel: "High School",
      grade: "Grade 11",
      province: "DKI Jakarta",
      city: "South Jakarta",
      skills: ["Python", "Machine Learning"],
      github: "https://github.com/alex-smith",
      linkedin: "https://linkedin.com/in/alex-smith",
      completeness: profileCompleteness,
    },
    create: {
      userId: siswa.id,
      phone: "+62-812-3456-7890",
      birthDate: new Date("2008-01-01"),
      gender: "Male",
      schoolName: "Jakarta Science High School",
      schoolLevel: "High School",
      grade: "Grade 11",
      province: "DKI Jakarta",
      city: "South Jakarta",
      skills: ["Python", "Machine Learning"],
      github: "https://github.com/alex-smith",
      linkedin: "https://linkedin.com/in/alex-smith",
      completeness: profileCompleteness,
    },
  });

  const event = await prisma.event.upsert({
    where: { slug: "olimpiade-sains-dan-teknologi-nasional-2025" },
    update: {},
    create: {
      title: "Olimpiade Sains dan Teknologi Nasional 2025",
      slug: "olimpiade-sains-dan-teknologi-nasional-2025",
      shortDescription:
        "A national science and technology competition for Indonesian students.",
      fullDescription:
        "A platform to inspire science and technology innovation among students.",
      theme: "Innovation for the Nation",
      date: "2025-07-15",
      location: "Jakarta & Online",
      format: "HYBRID",
      category: "Science & Technology",
      image: "",
      status: "OPEN",
      deadline: "2025-06-30",
      fee: "Free",
      teamSizeMin: 1,
      teamSizeMax: 5,
      eligibility: ["Junior High", "Senior High", "College"],
      sdgs: [4, 9],
      prizePool: "Prize pool IDR 100,000,000",
      organizer: "GIVA",
      createdById: admin.id,
      timeline: {
        create: [
          {
            date: "2025-05-01",
            title: "Registration Opens",
            description: "Participant registration opens",
            order: 1,
          },
          {
            date: "2025-06-30",
            title: "Registration Closes",
            description: "Registration period ends",
            order: 2,
          },
          {
            date: "2025-07-15",
            title: "Grand Final",
            description: "Final presentations and awarding",
            order: 3,
          },
        ],
      },
      faqs: {
        create: [
          {
            question: "Is there a fee?",
            answer: "No, this competition is free.",
            order: 1,
          },
          {
            question: "Can teams be cross-school?",
            answer: "Yes, as long as they meet the requirements.",
            order: 2,
          },
        ],
      },
      categories: {
        create: [
          { name: "Mathematics" },
          { name: "Physics" },
          { name: "Informatics" },
        ],
      },
    },
  });

  const categories = await prisma.eventCategory.findMany({
    where: { eventId: event.id },
  });
  const informatics = categories.find((c) => c.name === "Informatics");
  if (!informatics) {
    throw new Error("Category Informatics not found");
  }

  const team = await prisma.team.upsert({
    where: { code: "ALPHA01" },
    update: {},
    create: {
      name: "Tim Alpha",
      code: "ALPHA01",
      status: "ACTIVE",
      members: {
        create: {
          userId: siswa.id,
          role: "LEADER",
        },
      },
    },
  });

  await prisma.eventRegistration.upsert({
    where: { userId_eventId: { userId: siswa.id, eventId: event.id } },
    update: { teamId: team.id },
    create: { userId: siswa.id, eventId: event.id, teamId: team.id },
  });

  await prisma.juriAssignment.upsert({
    where: {
      juriId_categoryId: { juriId: judge1.id, categoryId: informatics.id },
    },
    update: { currentStage: "PAPER" },
    create: {
      juriId: judge1.id,
      eventId: event.id,
      categoryId: informatics.id,
      currentStage: "PAPER",
    },
  });

  await prisma.certificate.upsert({
    where: { id: "sample-certificate" },
    update: {},
    create: {
      id: "sample-certificate",
      recipientId: siswa.id,
      eventId: event.id,
      type: "PARTICIPANT",
      award: "Certificate of Participation - GIVA 2024",
      issuedBy: "GIVA Global",
    },
  });

  console.log("Seeding completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
