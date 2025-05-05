import { InternalServerErrorResponse } from "@src/commons/patterns";
import { getAllOrders } from "@src/order/dao/getAllOrders.dao";
import { User } from "@src/types";

export const getAllOrdersService = async (user: User) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      throw new Error("SERVER_TENANT_ID is not defined");
    }

    if (!user.id) {
      return new InternalServerErrorResponse(
        "User ID is not defined"
      ).generate();
    }

    const orders = await getAllOrders(SERVER_TENANT_ID, user.id);

    return {
      data: orders,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
