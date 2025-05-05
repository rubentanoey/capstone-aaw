import { db } from "@src/db";
import { NewPayment } from "@db/schema/payment";
import * as schemaPayment from "@db/schema/payment";
import * as schemaOrder from "@db/schema/order";
import * as schemaOrderDetail from "@db/schema/orderDetail";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const payOrder = async (data: NewPayment) => {
  const result = await db.transaction(async (trx) => {
    const payment = await trx
      .insert(schemaPayment.payment)
      .values(data)
      .returning({
        id: schemaPayment.payment.id,
        order_id: schemaPayment.payment.order_id,
        payment_date: schemaPayment.payment.payment_date,
        payment_method: schemaPayment.payment.payment_method,
        payment_reference: schemaPayment.payment.payment_reference,
        amount: schemaPayment.payment.amount,
      });

    const order = await trx
      .update(schemaOrder.order)
      .set({
        order_status: "PAID",
        shipping_code: `MOCK-SHIPPING-${uuidv4()}`,
        shipping_status: "PENDING",
      })
      .where(
        and(
          eq(schemaOrder.order.id, data.order_id),
          eq(schemaOrder.order.tenant_id, data.tenant_id)
        )
      )
      .returning({
        id: schemaOrder.order.id,
        order_date: schemaOrder.order.order_date,
        total_amount: schemaOrder.order.total_amount,
        order_status: schemaOrder.order.order_status,
        shipping_provider: schemaOrder.order.shipping_provider,
        shipping_code: schemaOrder.order.shipping_code,
        shipping_status: schemaOrder.order.shipping_status,
      });

    const orderDetail = await trx
      .select()
      .from(schemaOrderDetail.orderDetail)
      .where(eq(schemaOrderDetail.orderDetail.order_id, data.order_id));

    const total_amount = orderDetail.reduce((acc, item) => {
      return acc + item.unit_price * item.quantity;
    }, 0);

    if (payment?.[0].amount !== total_amount) {
      await trx.rollback();
      return;
    }

    return {
      payment: payment?.[0],
      order: order?.[0],
    };
  });

  return result;
};
