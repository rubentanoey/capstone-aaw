import { db } from "@src/db";
import * as schema from "@db/schema/order";
import { and, eq } from "drizzle-orm";

export const cancelOrder = async (
  tenant_id: string,
  user_id: string,
  order_id: string
) => {
  const result = await db
    .update(schema.order)
    .set({
      order_status: "CANCELLED",
    })
    .where(
      and(
        eq(schema.order.id, order_id),
        eq(schema.order.tenant_id, tenant_id),
        eq(schema.order.user_id, user_id)
      )
    )
    .returning({
      id: schema.order.id,
      user_id: schema.order.user_id,
      order_date: schema.order.order_date,
      total_amount: schema.order.total_amount,
      order_status: schema.order.order_status,
      shipping_provider: schema.order.shipping_provider,
      shipping_code: schema.order.shipping_code,
      shipping_status: schema.order.shipping_status,
    });
  return result?.[0];
};
