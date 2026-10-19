import { z } from "zod";
import { REPORT_REASONS } from "../utils/reportConstants.js";

export const createReportSchema = z
  .object({
    targetType: z.enum(["product", "store"]),
    targetId: z.string().trim().min(1).max(40),
    reason: z.string().trim().min(1, "Please choose a reason."),
    details: z.string().trim().max(1000, "Details must be under 1000 characters.").default(""),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!REPORT_REASONS[data.targetType].includes(data.reason)) {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "Please choose a valid reason." });
    }
    if (data.reason === "other" && data.details.length < 10) {
      ctx.addIssue({ code: "custom", path: ["details"], message: "Please add a few details (at least 10 characters)." });
    }
  });

export const createSupportSchema = z
  .object({
    category: z.enum(REPORT_REASONS.support, { message: "Please choose a topic." }),
    message: z.string().trim().min(20, "Please describe the problem in at least 20 characters.").max(2000, "Message must be under 2000 characters."),
    name: z.string().trim().min(2, "Please enter your name.").max(80, "Name is too long.").optional(),
    email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(255, "Email is too long.").optional(),
  })
  .strict();

export const resolveReportSchema = z
  .object({
    outcome: z.enum(["resolved", "dismissed"]),
    note: z.string().trim().min(5, "Please write at least 5 characters.").max(500, "Note must be under 500 characters."),
  })
  .strict();