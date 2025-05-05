import { z } from "zod";

export const editCartItemSchema = z.object({
  body: z.object({
    cart_id: z.string().uuid(),
    quantity: z.number().int().nonnegative().optional(),
  }),
});
