import { pgTable, uuid } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner_id: uuid("owner_id").notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;
