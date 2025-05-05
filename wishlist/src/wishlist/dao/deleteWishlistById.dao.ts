import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/wishlist";

export const deleteWishlistById = async (tenant_id: string, id: string) => {
  const result = await db
    .delete(schema.wishlist)
    .where(
      and(eq(schema.wishlist.id, id), eq(schema.wishlist.tenant_id, tenant_id))
    )
    .returning();
  return result?.[0];
};
