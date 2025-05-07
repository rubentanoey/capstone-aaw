import { cart } from "@db/schema/cart";
import { db } from "@src/db";
import { eq, and } from "drizzle-orm";

export const getAllCartItems = async (tenant_id: string, user_id: string) => {
  const result = await db
    .select()
    .from(cart)
    .where(and(eq(cart.tenant_id, tenant_id), eq(cart.user_id, user_id)));

  return result;
};
