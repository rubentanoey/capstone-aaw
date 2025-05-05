import { integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { order } from "./order";

export const orderDetail = pgTable('order_detail', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    order_id: uuid('order_id').notNull().references(() => order.id),
    product_id: uuid('product_id').notNull(),
    quantity: integer('quantity').notNull(),
    unit_price: integer('unit_price').notNull(),
})

export type OrderDetail = typeof orderDetail.$inferSelect;
export type NewOrderDetail = typeof orderDetail.$inferInsert;