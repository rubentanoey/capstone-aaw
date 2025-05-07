import { InternalServerErrorResponse } from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getProductByCategory } from "@src/product/dao/getProductByCategory.dao";

export const getProductByCategoryService = async (category_id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    const cacheKey = `products:${SERVER_TENANT_ID}:category:${category_id}`;

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

    const products = await getProductByCategory(SERVER_TENANT_ID, category_id);

    try {
      await redisService.set(cacheKey, products, 60 * 60 * 24);
    } catch (cacheError) {
      console.error("Error storing in cache:", cacheError);
    }

    return {
      data: products,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
