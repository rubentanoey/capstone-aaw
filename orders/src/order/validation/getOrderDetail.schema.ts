import { z } from "zod";

export const getOrderDetailSchema = z.object({
  params: z.object({
    orderId: z.string().uuid(),
  }),
});
