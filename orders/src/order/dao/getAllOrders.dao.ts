import { db } from "@src/db";
import { and, eq } from "drizzle-orm";
import * as schema from "@db/schema/order";

export const getAllOrders = async (tenant_id: string, user_id: string) => {
  const result = await db
    .select()
    .from(schema.order)
    .where(
      and(
        eq(schema.order.tenant_id, tenant_id),
        eq(schema.order.user_id, user_id)
      )
    );
  return result;
};
