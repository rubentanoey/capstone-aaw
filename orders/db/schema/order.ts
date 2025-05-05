import { integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED']);
export const shippingProviderEnum = pgEnum('shipping_provider', ['JNE', 'TIKI', 'SICEPAT', 'GOSEND', 'GRAB_EXPRESS']);
export const shippingStatusEnum = pgEnum('shipping_status', ['PENDING', 'SHIPPED', 'DELIVERED', 'RETURNED']);

export const order = pgTable('order', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    user_id: uuid('user_id').notNull(),
    order_date: timestamp('order_date', { withTimezone: true }).defaultNow(),
    total_amount: integer('total_amount').notNull(),
    order_status: orderStatusEnum('order_status').default('PENDING').notNull(),
    shipping_provider: shippingProviderEnum('shipping_provider').notNull(),
    shipping_code: text('shipping_code'),
    shipping_status: shippingStatusEnum('shipping_status'),
})

export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;
