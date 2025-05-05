import { db } from "@src/db";
import { eq } from "drizzle-orm";
import * as schema from "@db/schema/wishlistDetail";

export const removeProductFromWishlist = async (id: string) => {
  const result = await db
    .delete(schema.wishlistDetail)
    .where(eq(schema.wishlistDetail.id, id))
    .returning();
  return result?.[0];
};
