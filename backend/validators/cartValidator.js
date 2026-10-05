import { z } from "zod";

export const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(99).optional(),
}).strict();

export const updateItemSchema = z.object({
  quantity: z.number().int().min(1).max(99),
}).strict();