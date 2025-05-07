import { NewCategory } from "@db/schema/categories";
import { RedisService } from "@src/commons/cache";
import { InternalServerErrorResponse } from "@src/commons/patterns";
import { createNewCategory } from "@src/product/dao/createNewCategory.dao";

export const createCategoryService = async (name: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const categoryData: NewCategory = {
      tenant_id: SERVER_TENANT_ID,
      name,
    };

    const newCategory = await createNewCategory(categoryData);

    const redisService = RedisService.getInstance();
    try {
      redisService.incr(`categories:${SERVER_TENANT_ID}:version`);
    } catch (err) {
      console.error("Error while invalidation cache key", err);
    }

    return {
      data: newCategory,
      status: 201,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
