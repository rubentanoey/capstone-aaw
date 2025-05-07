import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { getOrderById } from "@src/order/dao/getOrderById.dao";
import { getOrderDetail } from "@src/order/dao/getOrderDetail.dao";
import { User } from "@src/types";

export const getOrderDetailService = async (user: User, order_id: string) => {
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

    if (!order_id) {
      return new NotFoundResponse("Order id not found").generate();
    }

    const orderDetail = await getOrderDetail(SERVER_TENANT_ID, order_id);
    if (!orderDetail) {
      return new NotFoundResponse("Order detail not found").generate();
    }

    const order = await getOrderById(
      SERVER_TENANT_ID,
      user.id,
      orderDetail.order_id
    );
    if (!order) {
      return new NotFoundResponse("Order not found").generate();
    }

    if (order.user_id !== user.id) {
      return new UnauthorizedResponse(
        "User not authorized to view this order"
      ).generate();
    }

    return {
      data: orderDetail,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
