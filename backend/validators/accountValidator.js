import { z } from "zod";
import { nameSchema } from "./authValidator.js";

// "" from an empty form field means "clear this value".
const emptyToNull = (value) => (typeof value === "string" && value.trim() === "" ? null : value);

const phoneSchema = z.preprocess(
  emptyToNull,
  z.string().trim().regex(/^[0-9+()\-\s]{7,20}$/, "Enter a valid phone number.").nullable().optional()
);

const dateOfBirthSchema = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid date of birth.")
    .refine((value) => {
      const date = new Date(value);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value && // rejects overflow dates like 2001-02-31
        date <= new Date() &&
        date.getUTCFullYear() >= 1900
      );
    }, "Enter a valid date of birth.")
    .transform((value) => new Date(value))
    .nullable()
    .optional()
);

const genderSchema = z.preprocess(
  emptyToNull,
  z.enum(["female", "male", "other"], { message: "Please choose a valid option." }).nullable().optional()
);

// No `email` and no `role` here, and .strict() rejects anything not listed.
export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema,
    dateOfBirth: dateOfBirthSchema,
    gender: genderSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, { message: "Nothing to update." });

const flag = z.boolean();
const preferences = (shape) =>
  z
    .object(shape)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, { message: "No preferences provided." });

// Each role may only change its own preference keys.
export const preferenceSchemasByRole = {
  customer: preferences({
    orderNotifications: flag,
    promoEmails: flag,
    reviewReminders: flag,
    recommendations: flag,
    language: z.enum(["en", "ur", "es"]),
    currency: z.enum(["usd", "eur", "gbp"]),
  }),
  seller: preferences({ orders: flag, products: flag, system: flag }),
  admin: preferences({ newSellerApplications: flag, newProductSubmissions: flag, weeklySummary: flag }),
};

export const deleteAccountSchema = z
  .object({
    password: z.string().max(72).optional(), // required by the service only when the account has a password
    confirmation: z.literal("DELETE", { message: 'Type "DELETE" to confirm.' }),
  })
  .strict();