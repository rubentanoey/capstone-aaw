import { z } from "zod";

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
