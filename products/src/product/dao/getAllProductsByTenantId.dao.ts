import { db } from "@src/db";
import { eq } from "drizzle-orm";
import * as schema from "@db/schema/products";

export const getAllProductsByTenantId = async (tenantId: string) => {
  const result = await db
    .select()
    .from(schema.products)
    .where(eq(schema.products.tenant_id, tenantId));
  return result;
};
