import { z } from "zod";

// export const registerSchema = z
//   .object({
//     name: z
//       .string()
//       .trim()
//       .min(2, "Name must be at least 2 characters.")
//       .max(50, "Name must be under 50 characters.")
//       .regex(/^[A-Za-z\u00C0-\u017F' -]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes."),
//     email: z
//       .string()
//       .trim()
//       .toLowerCase()
//       .min(1, "Email address is required.")
//       .email("Please enter a valid email address.")
//       .max(255, "Email is too long."),
//     password: z
//       .string()
//       .min(8, "Password must be at least 8 characters.")
//       .max(72, "Password must be under 72 characters.") // bcrypt silently ignores bytes past 72
//       .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
//       .regex(/[0-9]/, "Password must contain at least one number."),
//     role: z.enum(["customer", "seller"], {
//       errorMap: () => ({ message: "Role must be either customer or seller." }),
//     }),
//   })
//   .strict(); // rejects any extra field (e.g. someone trying to sneak in isEmailVerified: true)

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
    password: z.string().min(1, "Password is required."),
  })
  .strict();





export const resendVerificationSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  })
  .strict();


export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email("Please enter a valid email address."),
  })
  .strict();




const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be under 72 characters.")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
  .regex(/[0-9]/, "Password must contain at least one number.");

// in registerSchema, replace the whole password field with:   password: passwordSchema,

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

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(50, "Name must be under 50 characters.")
      .regex(/^[A-Za-z\u00C0-\u017F' -]+$/, "Name can only contain letters, spaces, hyphens, and apostrophes."),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .min(1, "Email address is required.")
      .email("Please enter a valid email address.")
      .max(255, "Email is too long."),
    password: passwordSchema,
  })
  .strict();