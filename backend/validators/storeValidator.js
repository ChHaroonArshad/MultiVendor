import { z } from "zod";

const emailOrEmpty = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, "Email is too long.")
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address.");

const phoneOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[0-9+()\-\s]{7,20}$/.test(v), "Enter a valid phone number.");

export const updateStoreSchema = z
  .object({
    storeName: z.string().trim().min(3, "Store name must be at least 3 characters.").max(60, "Store name must be under 60 characters."),
    description: z.string().trim().max(500, "Description must be under 500 characters."),
    category: z.string().trim().max(50, "Category must be under 50 characters."),
    contactEmail: emailOrEmpty,
    phone: phoneOrEmpty,
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });