import { db } from "@src/db";
import { eq } from "drizzle-orm";
import * as schema from "@db/schema/categories";

export const getAllCategoriesByTenantId = async (tenantId: string) => {
  const result = await db
    .select()
    .from(schema.categories)
    .where(eq(schema.categories.tenant_id, tenantId));
  return result;
};
