import {
  PrismaClient,
  UserRole,
  JudgingStage,
  EventFormat,
  EventStatus,
  CertificateType,
  TeamMemberRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";

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
    juri: await hashPassword("juri123"),
    siswa: await hashPassword("siswa123"),
  };

  const superadmin = await prisma.user.upsert({
    where: { email: "superadmin@moova.test" },
    update: {},
    create: {
      fullName: "Super Admin",
      email: "superadmin@moova.test",
      password: passwords.superadmin,
      role: UserRole.SUPERADMIN,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@moova.test" },
    update: {},
    create: {
      fullName: "Admin MOOVA",
      email: "admin@moova.test",
      password: passwords.admin,
      role: UserRole.ADMIN,
    },
  });

  const juri1 = await prisma.user.upsert({
    where: { email: "juri1@moova.test" },
    update: {},
    create: {
      fullName: "Juri 1",
      email: "juri1@moova.test",
      password: passwords.juri,
      role: UserRole.JURI,
    },
  });

  const juri2 = await prisma.user.upsert({
    where: { email: "juri2@moova.test" },
    update: {},
    create: {
      fullName: "Juri 2",
      email: "juri2@moova.test",
      password: passwords.juri,
      role: UserRole.JURI,
    },
  });

  const siswa = await prisma.user.upsert({
    where: { email: "siswa@moova.test" },
    update: {},
    create: {
      fullName: "Budi Santoso",
      email: "siswa@moova.test",
      password: passwords.siswa,
      role: UserRole.SISWA,
    },
  });

  const profileCompleteness = computeCompleteness("Budi Santoso", {
    phone: "08123456789",
    birthDate: new Date("2008-01-01"),
    gender: "Laki-laki",
    schoolName: "SMAN 1 Jakarta",
    schoolLevel: "SMA",
    grade: "Kelas 11",
    province: "DKI Jakarta",
    city: "Jakarta Selatan",
    skills: ["Python", "Machine Learning"],
    github: "https://github.com/budi",
  });

  await prisma.siswaProfile.upsert({
    where: { userId: siswa.id },
    update: {
      phone: "08123456789",
      birthDate: new Date("2008-01-01"),
      gender: "Laki-laki",
      schoolName: "SMAN 1 Jakarta",
      schoolLevel: "SMA",
      grade: "Kelas 11",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      skills: ["Python", "Machine Learning"],
      completeness: profileCompleteness,
    },
    create: {
      userId: siswa.id,
      phone: "08123456789",
      birthDate: new Date("2008-01-01"),
      gender: "Laki-laki",
      schoolName: "SMAN 1 Jakarta",
      schoolLevel: "SMA",
      grade: "Kelas 11",
      province: "DKI Jakarta",
      city: "Jakarta Selatan",
      skills: ["Python", "Machine Learning"],
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
        "Kompetisi sains dan teknologi tingkat nasional untuk siswa Indonesia.",
      fullDescription:
        "Ajang kompetisi untuk mendorong inovasi sains dan teknologi bagi siswa.",
      theme: "Inovasi untuk Negeri",
      date: "2025-07-15",
      location: "Jakarta & Online",
      format: EventFormat.HYBRID,
      category: "Sains & Teknologi",
      image: "",
      status: EventStatus.OPEN,
      deadline: "2025-06-30",
      fee: "Gratis",
      teamSizeMin: 1,
      teamSizeMax: 5,
      eligibility: ["SMP", "SMA/SMK", "Mahasiswa"],
      sdgs: [4, 9],
      prizePool: "Total hadiah Rp100.000.000",
      organizer: "MOOVA",
      createdById: admin.id,
      timeline: {
        create: [
          {
            date: "2025-05-01",
            title: "Pendaftaran Dibuka",
            description: "Mulai pendaftaran peserta",
            order: 1,
          },
          {
            date: "2025-06-30",
            title: "Pendaftaran Ditutup",
            description: "Penutupan pendaftaran",
            order: 2,
          },
          {
            date: "2025-07-15",
            title: "Grand Final",
            description: "Presentasi final dan awarding",
            order: 3,
          },
        ],
      },
      faqs: {
        create: [
          {
            question: "Apakah berbayar?",
            answer: "Tidak, kompetisi ini gratis.",
            order: 1,
          },
          {
            question: "Apakah bisa tim lintas sekolah?",
            answer: "Bisa selama memenuhi syarat.",
            order: 2,
          },
        ],
      },
      categories: {
        create: [
          { name: "Matematika" },
          { name: "Fisika" },
          { name: "Informatika" },
        ],
      },
    },
  });

  const categories = await prisma.eventCategory.findMany({
    where: { eventId: event.id },
  });
  const informatika = categories.find((c) => c.name === "Informatika");
  if (!informatika) {
    throw new Error("Category Informatika not found");
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
          role: TeamMemberRole.LEADER,
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
      juriId_categoryId: { juriId: juri1.id, categoryId: informatika.id },
    },
    update: { currentStage: JudgingStage.PAPER },
    create: {
      juriId: juri1.id,
      eventId: event.id,
      categoryId: informatika.id,
      currentStage: JudgingStage.PAPER,
    },
  });

  await prisma.certificate.upsert({
    where: { id: "sample-certificate" },
    update: {},
    create: {
      id: "sample-certificate",
      recipientId: siswa.id,
      eventId: event.id,
      type: CertificateType.PARTICIPANT,
      award: "Peserta Olimpiade 2024",
      issuedBy: "Admin MOOVA",
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
