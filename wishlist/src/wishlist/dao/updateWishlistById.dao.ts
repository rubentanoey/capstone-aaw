import { db } from "@src/db";
import * as schema from "@db/schema/wishlist";
import { and, eq } from "drizzle-orm";

export const updateWishlistById = async (
  tenant_id: string,
  id: string,
  data: {
    name: string | undefined;
  }
) => {
  const result = await db
    .update(schema.wishlist)
    .set({
      name: data.name,
    })
    .where(
      and(eq(schema.wishlist.id, id), eq(schema.wishlist.tenant_id, tenant_id))
    )
    .returning({
      id: schema.wishlist.id,
      name: schema.wishlist.name,
    });
  return result?.[0];
};
