import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { getOrderById } from "@src/order/dao/getOrderById.dao";
import { cancelOrder } from "@src/order/dao/cancelOrder.dao";
import { User } from "@src/types";

export const cancelOrderService = async (user: User, order_id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!user.id) {
      return new NotFoundResponse("User id not found").generate();
    }

    const order = await getOrderById(SERVER_TENANT_ID, user.id, order_id);
    if (!order) {
      return new NotFoundResponse("Order not found").generate();
    }

    if (order.user_id !== user.id) {
      return new UnauthorizedResponse(
        "User not authorized to cancel this order"
      ).generate();
    }

    if (["CANCELLED", "REFUNDED"].includes(order.order_status)) {
      return new UnauthorizedResponse("Order already cancelled").generate();
    }

    await cancelOrder(SERVER_TENANT_ID, user.id, order_id);
    order.order_status = "CANCELLED";

    return {
      data: order,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
