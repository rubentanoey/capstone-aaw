import { z } from "zod";

export const deleteWishlistSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
