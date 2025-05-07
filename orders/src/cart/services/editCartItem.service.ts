import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { editCartDataById } from "../dao/editCartDataById.dao";
import { deleteCartItem } from "../dao/deleteCartItem.dao";
import { User } from "@src/types";

export const editCartItemService = async (
  user: User,
  cart_id: string,
  quantity?: number
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

    let cart;
    if (quantity !== undefined && quantity < 1) {
      cart = await deleteCartItem(SERVER_TENANT_ID, user.id, cart_id);
      cart.quantity = 0;
    } else if (quantity !== undefined) {
      cart = await editCartDataById(SERVER_TENANT_ID, cart_id, {
        quantity,
      });
    } else {
      return new BadRequestResponse(
        "No valid update parameters provided"
      ).generate();
    }

    return {
      data: cart,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
