import { z } from "zod";

export const addItemToCartSchema = z.object({
  body: z.object({
    product_id: z.string().uuid(),
    quantity: z.number().int().positive(),
  }),
});
