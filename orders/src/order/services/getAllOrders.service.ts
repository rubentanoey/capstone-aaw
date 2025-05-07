import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { getAllOrders } from "@src/order/dao/getAllOrders.dao";
import { User } from "@src/types";

export const getAllOrdersService = async (
  user: User,
  page_number: number,
  page_size: number
) => {
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

    const limit = page_size;
    const offset = (page_number - 1) * page_size;

    const orders = await getAllOrders(SERVER_TENANT_ID, user.id, limit, offset);

    return {
      data: orders,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
