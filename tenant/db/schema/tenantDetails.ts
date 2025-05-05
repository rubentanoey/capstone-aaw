import { pgTable, uuid, varchar } from "drizzle-orm/pg-core";
import { tenants } from "./tenants";

export const tenantDetails = pgTable("tenantDetails", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenant_id: uuid("tenant_id")
    .references(() => tenants.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  name: varchar("name").notNull(),
});

export type TenantDetail = typeof tenantDetails.$inferSelect;
export type NewTenantDetail = typeof tenantDetails.$inferInsert;
