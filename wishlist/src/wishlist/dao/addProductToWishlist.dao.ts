import { db } from "@src/db";
import * as schema from "@db/schema/wishlistDetail";
import { NewWishlistDetail } from "@db/schema/wishlistDetail";

export const addProductToWishlist = async (data: NewWishlistDetail) => {
  const result = await db
    .insert(schema.wishlistDetail)
    .values(data)
    .returning();
  return result?.[0];
};
