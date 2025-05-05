import { db } from "@src/db";
import { eq, and } from "drizzle-orm";
import * as schema from "@db/schema/products";

export const deleteProductById = async (tenant_id: string, id: string) => {
  const result = await db
    .delete(schema.products)
    .where(
      and(eq(schema.products.tenant_id, tenant_id), eq(schema.products.id, id))
    )
    .returning();
  return result?.[0];
};
