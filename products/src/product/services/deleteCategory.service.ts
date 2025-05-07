import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { deleteCategoryById } from "@src/product/dao/deleteCategoryById.dao";
import { RedisService } from "@src/commons/cache/redis";

export const deleteCategoryService = async (category_id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!category_id) {
      return new NotFoundResponse("Category id not found").generate();
    }

    const category = await deleteCategoryById(SERVER_TENANT_ID, category_id);
    if (!category) {
      return new NotFoundResponse("Category not found").generate();
    }

    const redisService = RedisService.getInstance();
    try {
      await redisService.del(`categories:${SERVER_TENANT_ID}`);
      await redisService.del(`category:${SERVER_TENANT_ID}:${category_id}`);
      await redisService.del(
        `products:${SERVER_TENANT_ID}:category:${category_id}`
      );
      await redisService.del(`products:${SERVER_TENANT_ID}:all`);
    } catch (cacheError) {
      console.error("Error invalidating category caches:", cacheError);
    }

    return {
      data: category,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
