import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/cart";

export const deleteCartItemByProductId = async (
  tenant_id: string,
  user_id: string,
  product_id: string
) => {
  const result = await db
    .delete(schema.cart)
    .where(
      and(
        eq(schema.cart.tenant_id, tenant_id),
        eq(schema.cart.user_id, user_id),
        eq(schema.cart.product_id, product_id)
      )
    )
    .returning({
      id: schema.cart.id,
      product_id: schema.cart.product_id,
      quantity: schema.cart.quantity,
    });
  return result?.[0];
};
