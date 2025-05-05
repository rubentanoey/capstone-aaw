import { z } from "zod";

export const deleteCartItemSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
  }),
});
