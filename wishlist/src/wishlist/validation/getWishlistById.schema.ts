import { z } from "zod";

export const getWishlistByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
