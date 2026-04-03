import bcrypt from "bcryptjs";
import "../src/config/env";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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
    student: await hashPassword("student123"),
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
  console.log("[seed] superadmin@giva.test ensured");

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
  console.log("[seed] admin@giva.test ensured");

  const judge = await prisma.user.upsert({
    where: { email: "judge@giva.test" },
    update: {},
    create: {
      fullName: "Judge GIVA",
      email: "judge@giva.test",
      password: passwords.judge,
      role: "JUDGE",
    },
  });
  console.log("[seed] judge@giva.test ensured");

  const student = await prisma.user.upsert({
    where: { email: "student@giva.test" },
    update: {},
    create: {
      fullName: "Student GIVA",
      email: "student@giva.test",
      password: passwords.student,
      role: "STUDENT",
    },
  });
  console.log("[seed] student@giva.test ensured");

  const profileCompleteness = computeCompleteness("Student GIVA", {
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
    where: { userId: student.id },
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
      userId: student.id,
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
      customId: `GIVA-seed2025-${new Date().getUTCFullYear()}`,
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
      registrationOpenDate: new Date("2025-05-01T00:00:00.000Z"),
      registrationCloseDate: new Date("2025-06-30T23:59:59.999Z"),
      fee: "Free",
      teamSizeMin: 1,
      teamSizeMax: 5,
      eligibility: ["Junior High", "Senior High", "College"],
      prizePool: "Prize pool IDR 100,000,000",
      organizer: "GIVA",
      rules:
        "All submissions must be original and comply with ethical standards.",
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
  console.log("[seed] Sample event created/ensured");

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
          userId: student.id,
          role: "LEADER",
        },
      },
    },
  });

  await prisma.eventRegistration.upsert({
    where: { userId_eventId: { userId: student.id, eventId: event.id } },
    update: { teamId: team.id },
    create: { userId: student.id, eventId: event.id, teamId: team.id },
  });

  await prisma.judgeAssignment.upsert({
    where: {
      judgeId_categoryId: { judgeId: judge.id, categoryId: informatics.id },
    },
    update: { currentStage: "PAPER" },
    create: {
      judgeId: judge.id,
      eventId: event.id,
      categoryId: informatics.id,
      currentStage: "PAPER",
    },
  });

  // Generate a simple cert code and hash for the sample certificate
  const certCode =
    `GIVA-${Date.now()}-` +
    Math.random().toString(36).substring(2, 8).toUpperCase();
  const certHash = await hashPassword(certCode);

  await prisma.certificate.upsert({
    where: { certCode: certCode },
    update: {},
    create: {
      certCode: certCode,
      userId: student.id,
      eventId: event.id,
      awardType: "PARTICIPANT",
      customTitle: "Certificate of Participation - GIVA 2024",
      issuedById: admin.id,
      certHash: certHash,
      prevHash: "",
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
