import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/cart";

export const getAllCartItems = async (tenant_id: string, user_id: string) => {
  const result = await db
    .select()
    .from(schema.cart)
    .where(
      and(
        eq(schema.cart.tenant_id, tenant_id),
        eq(schema.cart.user_id, user_id)
      )
    );
  return result;
};
