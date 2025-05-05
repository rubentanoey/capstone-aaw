import { z } from "zod";

export const payOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
  body: z.object({
    payment_method: z.string(),
    payment_reference: z.string(),
    amount: z.number().int().positive(),
  }),
});
