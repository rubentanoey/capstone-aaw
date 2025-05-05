import {
  foreignKey,
  integer,
  pgTable,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categories } from "./categories";

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenant_id: uuid("tenant_id").notNull(),
    name: varchar("name").notNull(),
    description: varchar("description"),
    price: integer("price").notNull(),
    quantity_available: integer("quantity_available").notNull(),
    category_id: uuid("category_id"),
  },
  (table) => {
    return {
      categoryReference: foreignKey({
        columns: [table.tenant_id, table.category_id],
        foreignColumns: [categories.tenant_id, categories.id],
        name: "products_category_id_fkey",
      }),
    };
  }
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
