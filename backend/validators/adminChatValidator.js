import { z } from "zod";

export const mediatorMessageSchema = z.object({ text: z.string().trim().min(1).max(1000) }).strict();
export const lockSchema = z.object({ reason: z.string().trim().min(5).max(300) }).strict();
export const resolveSchema = z
  .object({ outcome: z.enum(["resolved", "dismissed"]), note: z.string().trim().min(5).max(500) })
  .strict();