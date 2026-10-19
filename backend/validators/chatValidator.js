import { z } from "zod";

// multipart sends empty fields as "", so treat "" as "not provided".
const emptyToUndefined = (value) => (value === "" || value === null ? undefined : value);
const objectId = z.string().length(24);

export const startConversationSchema = z
  .object({
    type: z.enum(["direct", "support"]),
    sellerId: z.preprocess(emptyToUndefined, objectId.optional()),
    customerId: z.preprocess(emptyToUndefined, objectId.optional()),
  })
  .strict();

export const sendMessageSchema = z
  .object({
    text: z.string().max(2000).default(""),
    clientId: z.preprocess(emptyToUndefined, z.string().min(8).max(64).regex(/^[A-Za-z0-9_-]+$/).optional()),
    contextKind: z.preprocess(emptyToUndefined, z.enum(["product", "order"]).optional()),
    contextId: z.preprocess(emptyToUndefined, objectId.optional()),
  })
  .strict()
  .refine((d) => Boolean(d.contextKind) === Boolean(d.contextId), {
    message: "contextKind and contextId must be sent together",
    path: ["contextId"],
  });