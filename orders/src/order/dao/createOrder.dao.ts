import { Order, NewOrder } from "@db/schema/order";
import { NewOrderDetail, OrderDetail } from "@db/schema/orderDetail";
import { db } from "@src/db";
import * as schemaCart from "@db/schema/cart";
import * as schemaOrder from "@db/schema/order";
import * as schemaOrderDetail from "@db/schema/orderDetail";
import { Cart } from "@db/schema/cart";
import { and, eq } from "drizzle-orm";
import { Product } from "@src/types";

export const createOrder = async (
  tenant_id: string,
  user_id: string,
  cart_items: Cart[],
  products_data: Product[],
  shipping_provider: "JNE" | "TIKI" | "SICEPAT" | "GOSEND" | "GRAB_EXPRESS"
) => {
  const result = await db.transaction(async (trx) => {
    // calculate total amount
    const total_amount = cart_items.reduce((acc, item) => {
      const product = products_data.find(
        (product) => product.id === item.product_id
      );

      if (!product) {
        throw new Error("Product not found");
      }

      return acc + item.quantity * product.price;
    }, 0);

    // create order
    const orderData: NewOrder = {
      tenant_id,
      user_id,
      total_amount,
      shipping_provider,
    };

    const order: Order[] = await trx
      .insert(schemaOrder.order)
      .values(orderData)
      .returning();

    const orderDict: Order = order[0];

    // create order details
    const orderDetailsData: NewOrderDetail[] = cart_items.map((item) => {
      const product = products_data.find(
        (product) => product.id === item.product_id
      );

      if (!product) {
        throw new Error("Product not found");
      }

      return {
        tenant_id,
        order_id: orderDict.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
      };
    });

    const orderDetails: OrderDetail[] = await trx
      .insert(schemaOrderDetail.orderDetail)
      .values(orderDetailsData)
      .returning();

    // empty the cart
    await trx
      .delete(schemaCart.cart)
      .where(
        and(
          eq(schemaCart.cart.tenant_id, tenant_id),
          eq(schemaCart.cart.user_id, user_id)
        )
      );

    return {
      order: orderDict,
      orderDetails,
    };
  });
  return result;
};
