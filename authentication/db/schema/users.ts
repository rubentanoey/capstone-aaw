import {
  pgTable,
  primaryKey,
  uuid,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().unique(),
    tenant_id: uuid("tenant_id").default(
      "00000000-0000-0000-0000-000000000000"
    ),
    username: varchar("username", { length: 256 }).notNull(),
    email: varchar("email", { length: 256 }).notNull(),
    password: varchar("password", { length: 256 }).notNull(),
    full_name: varchar("full_name", { length: 256 }),
    address: text("address"),
    phone_number: varchar("phone_number", { length: 256 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.tenant_id, table.username, table.email] }),
  })
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
