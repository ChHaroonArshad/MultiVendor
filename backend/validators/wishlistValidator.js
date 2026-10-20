import { z } from "zod";

export const addWishlistSchema = z.object({ productId: z.string().trim().min(1).max(40) }).strict();