import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/wishlistDetail";

export const getWishlistDetailById = async (id: string) => {
  const result = await db
    .select()
    .from(schema.wishlistDetail)
    .where(and(eq(schema.wishlistDetail.id, id)));
  return result?.[0];
};
