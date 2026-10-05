import { z } from "zod";

export const rejectProductSchema = z.object({
  reason: z.string().min(5).max(500),
}).strict();