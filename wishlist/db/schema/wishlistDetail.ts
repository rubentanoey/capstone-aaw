import { pgTable, uuid } from "drizzle-orm/pg-core";
import { wishlist } from "./wishlist";

export const wishlistDetail = pgTable('wishlist_detail', {
    id: uuid('id').defaultRandom().primaryKey(),
    wishlist_id: uuid('wishlist_id').notNull().references(() => wishlist.id),
    product_id: uuid('product_id').notNull(),
});

export type WishlistDetail = typeof wishlistDetail.$inferSelect;
export type NewWishlistDetail = typeof wishlistDetail.$inferInsert;