import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(50, "Name must be under 50 characters.")
  .regex(/^[^0-9]*$/, "Name cannot contain numbers.")
  .regex(/^[A-Za-z\u00C0-\u017F' -]*$/, "Name can only contain letters, spaces, hyphens, and apostrophes.")
  .regex(/[A-Za-z\u00C0-\u017F]/, "Name must contain at least one letter."); // blocks "--" and "''"


  
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Email address is required.")
  .email("Please enter a valid email address.")
  .max(255, "Email is too long.");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be under 72 characters.") // bcrypt ignores bytes past 72
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

// The ONLY roles a client may ever pick. "admin" is rejected here, everywhere.
const roleSchema = z.enum(["customer", "seller"], {
  message: "Role must be either customer or seller.",
});

export const registerSchema = z
  .object({ name: nameSchema, email: emailSchema, password: passwordSchema, role: roleSchema })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();

export const resendVerificationSchema = z.object({ email: emailSchema }).strict();

export const forgotPasswordSchema = z.object({ email: emailSchema }).strict();

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Reset token is missing."),
    password: passwordSchema,
  })
  .strict();

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required."),
    newPassword: passwordSchema,
  })
  .strict()
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from your current password.",
    path: ["newPassword"],
  });

export const completeGoogleSignupSchema = z.object({ role: roleSchema }).strict();