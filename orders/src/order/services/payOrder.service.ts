import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { NewPayment } from "@db/schema/payment";
import { payOrder } from "@src/order/dao/payOrder.dao";

export const payOrderService = async (
  orderId: string,
  payment_method: string,
  payment_reference: string,
  amount: number
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const paymentData: NewPayment = {
      tenant_id: SERVER_TENANT_ID,
      order_id: orderId,
      payment_method,
      payment_reference,
      amount,
    };

    const payment = await payOrder(paymentData);

    return {
      data: payment,
      status: 200,
    };
  } catch (err: any) {
    if (err.message === "Rollback") {
      return new BadRequestResponse(
        "Payment amount does not match order total amount"
      ).generate();
    }

    return new InternalServerErrorResponse(err).generate();
  }
};
