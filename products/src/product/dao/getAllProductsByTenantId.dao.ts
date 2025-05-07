import { db } from "@src/db";
import { eq } from "drizzle-orm";
import * as schema from "@db/schema/products";

export const getAllProductsByTenantId = async (
  tenantId: string,
  limit: number,
  offset: number
) => {
  const result = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.tenant_id, tenantId))
    .limit(limit)
    .offset(offset);
  return result;
};
