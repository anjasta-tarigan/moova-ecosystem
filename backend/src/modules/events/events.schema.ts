import { z } from "zod";

export const registerEventSchema = z.object({
  teamId: z.string().optional(),
});

export const questionSchema = z.object({
  text: z.string().min(5),
});

export const replySchema = z.object({
  text: z.string().min(2),
});

export const communityThreadSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(5),
});

export const communityMessageSchema = z.object({
  content: z.string().min(2),
});
