import { InternalServerErrorResponse } from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllProductsByTenantId } from "@src/product/dao/getAllProductsByTenantId.dao";

export const getAllProductsService = async (
  pageNumber: number,
  pageSize: number
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const limit = pageSize;
    const offset = (pageNumber - 1) * pageSize;

    const redisService = RedisService.getInstance();
    const cacheKey = `products:${SERVER_TENANT_ID}:all:limit-${limit}:offset-${offset}`;

    try {
      const cachedProducts = await redisService.get(cacheKey);
      if (cachedProducts) {
        return {
          data: {
            products: cachedProducts,
          },
          status: 200,
        };
      }
    } catch (cacheError) {
      console.error("Error retrieving from cache:", cacheError);
    }

    const products = await getAllProductsByTenantId(
      SERVER_TENANT_ID,
      limit,
      offset
    );
    try {
      await redisService.set(cacheKey, products, 60 * 60 * 24);
    } catch (cacheError) {
      console.error("Error storing products in cache:", cacheError);
    }

    return {
      data: products,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
