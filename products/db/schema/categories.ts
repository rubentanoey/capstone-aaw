import { pgTable, primaryKey, uuid, varchar } from "drizzle-orm/pg-core";

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom(),
    name: varchar("name").notNull(),
    tenant_id: uuid("tenant_id").notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.tenant_id] }),
    };
  }
);

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
