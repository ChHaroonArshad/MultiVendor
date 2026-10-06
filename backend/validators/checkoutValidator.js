import { z } from "zod";

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().min(5).max(30),
    line: z.string().min(3).max(200),
    city: z.string().min(2).max(100),
    province: z.string().min(2).max(100),
    postalCode: z.string().min(2).max(20),
    country: z.string().min(2).max(100),
  }).strict(),
}).strict();