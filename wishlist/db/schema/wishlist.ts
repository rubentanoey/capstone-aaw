import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const wishlist = pgTable('wishlist', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    user_id: uuid('user_id').notNull(),
    name: text('name').notNull(),
})

export type Wishlist = typeof wishlist.$inferSelect;
export type NewWishlist = typeof wishlist.$inferInsert;