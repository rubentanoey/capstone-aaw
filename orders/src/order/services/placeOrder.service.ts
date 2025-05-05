import { getAllCartItems } from "@src/cart/dao/getAllCartItems.dao";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { createOrder } from "@src/order/dao/createOrder.dao";
import axios, { AxiosResponse } from "axios";
import { User, Product } from "@src/types";

export const placeOrderService = async (
  user: User,
  shipping_provider: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (
      !["JNE", "TIKI", "SICEPAT", "GOSEND", "GRAB_EXPRESS"].includes(
        shipping_provider
      )
    ) {
      return new NotFoundResponse("Shipping provider not found").generate();
    }

    if (!user.id) {
      return new InternalServerErrorResponse("User id not found").generate();
    }

    // get the cart items
    const cartItems = await getAllCartItems(SERVER_TENANT_ID, user.id);

    // get the product datas
    const productIds = cartItems.map((item) => item.product_id);
    if (productIds.length === 0) {
      return new BadRequestResponse("Cart is empty").generate();
    }
    const products: AxiosResponse<Product[], any> = await axios.post(
      `${process.env.PRODUCT_SERVICE_URL}/product/many`,
      { productIds }
    );
    if (products.status !== 200) {
      return new InternalServerErrorResponse(
        "Failed to get products"
      ).generate();
    }

    // create order
    const order = await createOrder(
      SERVER_TENANT_ID,
      user.id,
      cartItems,
      products.data,
      shipping_provider as
        | "JNE"
        | "TIKI"
        | "SICEPAT"
        | "GOSEND"
        | "GRAB_EXPRESS"
    );

    return {
      data: order,
      status: 201,
    };
  } catch (err: any) {
    console.error(err);
    return new InternalServerErrorResponse(err).generate();
  }
};
