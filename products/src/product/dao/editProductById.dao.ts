import { db } from "@src/db";
import * as schema from "@db/schema/products";
import { and, eq } from "drizzle-orm";

export const editProductById = async (
  tenant_id: string,
  id: string,
  data: {
    name: string | undefined;
    description: string | undefined;
    price: number | undefined;
    quantity_available: number | undefined;
    category_id: string | undefined;
  }
) => {
  const result = await db
    .update(schema.products)
    .set({
      name: data.name,
      description: data.description,
      price: data.price,
      quantity_available: data.quantity_available,
      category_id: data.category_id,
    })
    .where(
      and(eq(schema.products.tenant_id, tenant_id), eq(schema.products.id, id))
    )
    .returning({
      id: schema.products.id,
      name: schema.products.name,
      description: schema.products.description,
      price: schema.products.price,
      quantity_available: schema.products.quantity_available,
      category_id: schema.products.category_id,
    });
  return result?.[0];
};
