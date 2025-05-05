import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/wishlist";

export const getAllUserWishlist = async (
  tenant_id: string,
  user_id: string
) => {
  const result = await db
    .select()
    .from(schema.wishlist)
    .where(
      and(
        eq(schema.wishlist.tenant_id, tenant_id),
        eq(schema.wishlist.user_id, user_id)
      )
    );
  return result;
};
