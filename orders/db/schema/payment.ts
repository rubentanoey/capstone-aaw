import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { order } from "./order";

export const payment = pgTable('payment', {
    id: uuid('id').defaultRandom().primaryKey(),
    tenant_id: uuid('tenant_id').notNull(),
    order_id: uuid('order_id').notNull().references(() => order.id),
    payment_date: timestamp('payment_date', { withTimezone: true }).defaultNow(),
    payment_method: text('payment_method').notNull(),
    payment_reference: text('payment_reference').notNull(),
    amount: integer('amount').notNull(),
})

export type Payment = typeof payment.$inferSelect;
export type NewPayment = typeof payment.$inferInsert;