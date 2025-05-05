import { z } from "zod";

export const getManyProductDatasByIdSchema = z.object({
  body: z.object({
    productIds: z.array(z.string().uuid()).nonempty(),
  }),
});
