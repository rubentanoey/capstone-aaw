import { z } from "zod";

export const createWishlistSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(255),
  }),
});
