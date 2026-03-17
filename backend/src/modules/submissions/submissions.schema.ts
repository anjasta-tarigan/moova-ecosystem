import { z } from "zod";

export const createSubmissionSchema = z.object({
  teamId: z.string(),
  eventId: z.string(),
  categoryId: z.string().optional(),
  projectTitle: z.string().min(3),
  tagline: z.string().optional(),
  description: z.string().min(10),
  techStack: z.string().optional(),
  githubLink: z.string().optional(),
  demoLink: z.string().optional(),
});

export const updateSubmissionSchema = z.object({
  projectTitle: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  techStack: z.string().optional(),
  githubLink: z.string().optional(),
  demoLink: z.string().optional(),
});

export const submitSchema = z.object({
  consentGiven: z.boolean(),
});
