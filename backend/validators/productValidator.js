import { z } from "zod";

export const PRODUCT_CATEGORIES = ["electronics", "fashion", "shoes", "beauty", "home", "accessories"];

const specSchema = z.object({
  key: z.string().min(1).max(50),
  value: z.string().min(1).max(200),
});

export const createProductSchema = z
  .object({
    name: z.string().min(3).max(100),
    description: z.string().min(10).max(2000),
    price: z.coerce.number().positive().max(1000000),
    originalPrice: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : val),
      z.coerce.number().positive().max(1000000).optional()
    ),
    stock: z.coerce.number().int().min(0),
    category: z.string().min(1).max(50),
    specs: z.preprocess((val) => {
      if (typeof val !== "string" || val.trim() === "") return [];
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }, z.array(specSchema).max(20).default([])),
  })
  .strict()
  .refine((data) => !data.originalPrice || data.originalPrice > data.price, {
    message: "Compare-at price must be higher than the price",
    path: ["originalPrice"],
  });

export const updateProductSchema = z
  .object({
    name: z.string().min(3).max(100).optional(),
    description: z.string().min(10).max(2000).optional(),
    price: z.coerce.number().positive().max(1000000).optional(),
    originalPrice: z.preprocess(
      (val) => (val === "" || val === undefined || val === null ? undefined : val),
      z.coerce.number().positive().max(1000000).optional()
    ),
    stock: z.coerce.number().int().min(0).optional(),
    category: z.string().min(1).max(50).optional(),
    specs: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (typeof val !== "string" || val.trim() === "") return [];
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }, z.array(specSchema).max(20).optional()),
    // Which existing images (by publicId) to keep. Anything already on the
    // product but NOT in this list gets deleted from Cloudinary.
    keepImagePublicIds: z.preprocess((val) => {
      if (val === undefined) return undefined;
      if (typeof val !== "string" || val.trim() === "") return [];
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }, z.array(z.string()).optional()),
  })
  .strict()
  .refine((data) => !data.originalPrice || !data.price || data.originalPrice > data.price, {
    message: "Compare-at price must be higher than the price",
    path: ["originalPrice"],
  });
  export const publishSchema = z.object({
  isPublished: z.boolean(),
}).strict();