import { integer, pgTable, uuid } from "drizzle-orm/pg-core";

export const cart = pgTable('cart', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    user_id: uuid('user_id').notNull(),
    product_id: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull(),
})

export type Cart = typeof cart.$inferSelect;
export type NewCart = typeof cart.$inferInsert;