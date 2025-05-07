import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { User } from "@src/types";
import { deleteCartItemByProductId } from "@src/cart/dao/deleteCartItemByProductId.dao";

export const deleteCartItemService = async (user: User, product_id: string) => {
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

    const cart = await deleteCartItemByProductId(
      SERVER_TENANT_ID,
      user.id,
      product_id
    );

    return {
      data: cart,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
