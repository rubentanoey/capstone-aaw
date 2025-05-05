import { db } from "@src/db";
import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema/orderDetail";

export const getOrderDetail = async (tenant_id: string, order_id: string) => {
  const result = await db
    .select()
    .from(schema.orderDetail)
    .where(
      and(
        eq(schema.orderDetail.tenant_id, tenant_id),
        eq(schema.orderDetail.order_id, order_id)
      )
    );
  return result[0];
};
