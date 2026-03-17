import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(3).optional(),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  avatar: z.string().optional(),
  schoolName: z.string().optional(),
  schoolLevel: z.string().optional(),
  major: z.string().optional(),
  studentId: z.string().optional(),
  grade: z.string().optional(),
  province: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
  skills: z.array(z.string()).optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
});
