import { z } from "zod";

export const updateWishlistSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    name: z.string().min(3).max(255).optional(),
  }),
});
