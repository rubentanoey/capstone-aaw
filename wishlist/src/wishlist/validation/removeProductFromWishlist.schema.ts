import { z } from "zod";

export const removeProductFromWishlistSchema = z.object({
  body: z.object({
    id: z.string().uuid(),
  }),
});
