import { z } from "zod";

export const addProductToWishlistSchema = z.object({
  body: z.object({
    wishlist_id: z.string().uuid(),
    product_id: z.string().uuid(),
  }),
});
