import { InternalServerErrorResponse } from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllCategoriesByTenantId } from "@src/product/dao/getAllCategoriesByTenantId.dao";

export const getAllCategoriesService = async () => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    const cacheKey = `categories:${SERVER_TENANT_ID}`;

    try {
      const cachedCategories = await redisService.get(cacheKey);
      if (cachedCategories) {
        return {
          data: {
            categories: cachedCategories,
          },
          status: 200,
        };
      }
    } catch (cacheError) {
      console.error("Error retrieving from cache:", cacheError);
    }

    const categories = await getAllCategoriesByTenantId(SERVER_TENANT_ID);
    try {
      await redisService.set(cacheKey, categories, 60 * 60 * 24);
    } catch (cacheError) {
      console.error("Error storing in cache:", cacheError);
    }

    return {
      data: categories,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
