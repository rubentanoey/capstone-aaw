import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { editCategoryById } from "@src/product/dao/editCategoryById.dao";
import { RedisService } from "@src/commons/cache/redis";

export const editCategoryService = async (
  category_id: string,
  name?: string
) => {
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

    if (!name) {
      return new BadRequestResponse(
        "No valid update parameters provided"
      ).generate();
    }

    const category = await editCategoryById(SERVER_TENANT_ID, category_id, {
      name,
    });

    if (!category) {
      return new NotFoundResponse("Category not found").generate();
    }

    const redisService = RedisService.getInstance();
    try {
      await redisService.incr(`categories:${SERVER_TENANT_ID}:version`);
      // await redisService.del(`categories:${SERVER_TENANT_ID}`);
      await redisService.del(
        `products:${SERVER_TENANT_ID}:category:${category_id}`
      );
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
