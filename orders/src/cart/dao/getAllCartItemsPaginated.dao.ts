import { cart } from "@db/schema/cart";
import { db } from "@src/db";
import { eq, and } from "drizzle-orm";

export const getAllCartItemsPaginated = async (
  tenant_id: string,
  user_id: string,
  limit: number,
  offset: number
) => {
  const result = await db
    .select()
    .from(cart)
    .where(and(eq(cart.tenant_id, tenant_id), eq(cart.user_id, user_id)))
    .limit(limit)
    .offset(offset);

  return result;
};
