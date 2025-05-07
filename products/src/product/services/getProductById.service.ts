import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getProductById } from "@src/product/dao/getProductById.dao";

export const getProductByIdService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }    

    const redisService = RedisService.getInstance();
    const cacheKey = `product:${SERVER_TENANT_ID}:${id}`;

    try {
      const cachedProduct = await redisService.get(cacheKey);
      if (cachedProduct) {
        return {
          data: cachedProduct,
          status: 200,
        };
      }
    } catch (cacheError) {
      console.error("Error retrieving product from cache:", cacheError);
    }

    const product = await getProductById(SERVER_TENANT_ID, id);
    if (product) {
      try {
        await redisService.set(cacheKey, product, 60 * 60 * 24);
      } catch (cacheError) {
        console.error("Error storing product in cache:", cacheError);
      }
    } else {
      return new NotFoundResponse("Product not found").generate();
    }

    return {
      data: product,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
