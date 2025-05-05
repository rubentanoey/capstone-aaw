import { db } from "@src/db";
import * as schema from "@db/schema/categories";
import { and, eq } from "drizzle-orm";

export const editCategoryById = async (
  tenant_id: string,
  category_id: string,
  data: {
    name: string | undefined;
  }
) => {
  const result = await db
    .update(schema.categories)
    .set({
      name: data.name,
    })
    .where(
      and(
        eq(schema.categories.tenant_id, tenant_id),
        eq(schema.categories.id, category_id)
      )
    )
    .returning({
      id: schema.categories.id,
      name: schema.categories.name,
    });
  return result?.[0];
};
