import { getAllCartItems } from "@src/cart/dao/getAllCartItems.dao";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { ServiceBreaker } from "@src/commons/patterns/circuit-breaker";
import { createOrder } from "@src/order/dao/createOrder.dao";
import axios, { AxiosResponse } from "axios";
import { User, Product } from "@src/types";

const fetchProducts = async (productIds: string[]): Promise<AxiosResponse<Product[], any>> => {
  const response = await axios.post(
    `${process.env.PRODUCT_SERVICE_URL}/product/many`,
    { productIds },
  );
  if (response.status !== 200) {
    throw new Error(`Failed to get products: Status ${response.status}`);
  }
  return response;
};

const productServiceBreaker = new ServiceBreaker(
  fetchProducts,
  'ProductService',
  {
    timeout: 4000,
    errorThresholdPercentage: 50
  }
);

productServiceBreaker.fallback(() => {
  throw new Error('Product service is currently unavailable');
});

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
    
    try {
      const products = await productServiceBreaker.fire(productIds);
      
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
    } catch (breakerError) {
      console.error('Product service circuit breaker error:', breakerError);
      return new InternalServerErrorResponse(
        "Product service unavailable, please try again later"
      ).generate();
    }
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
