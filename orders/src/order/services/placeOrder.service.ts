import { getAllCartItems } from "@src/cart/dao/getAllCartItems.dao";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { createOrder } from "@src/order/dao/createOrder.dao";
import axios, { AxiosResponse } from "axios";
import { User, Product } from "@src/types";

type ShippingProvider = "JNE" | "TIKI" | "SICEPAT" | "GOSEND" | "GRAB_EXPRESS";
const VALID_SHIPPING_PROVIDERS = [
  "JNE",
  "TIKI",
  "SICEPAT",
  "GOSEND",
  "GRAB_EXPRESS",
];

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

    if (!user.id) {
      return new NotFoundResponse("User id not found").generate();
    }

    if (!VALID_SHIPPING_PROVIDERS.includes(shipping_provider)) {
      return new NotFoundResponse("Shipping provider not found").generate();
    }

    const cartItems = await getAllCartItems(SERVER_TENANT_ID, user.id);
    if (!cartItems || cartItems.length === 0) {
      return new BadRequestResponse("Cart is empty").generate();
    }

    const productIds = cartItems.map((item) => item.product_id);

    try {
      const products: AxiosResponse<Product[], any> = await axios.post(
        `${process.env.PRODUCT_SERVICE_URL}/product/many`,
        { productIds }
      );

      if (products.status !== 200 || !products.data) {
        return new InternalServerErrorResponse(
          "Failed to get products"
        ).generate();
      }

      const order = await createOrder(
        SERVER_TENANT_ID,
        user.id,
        cartItems,
        products.data,
        shipping_provider as ShippingProvider
      );

      return {
        data: order,
        status: 201,
      };
    } catch (apiError) {
      return new InternalServerErrorResponse(
        "Failed to communicate with product service"
      ).generate();
    }
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
