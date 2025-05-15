import { InternalServerErrorResponse } from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllCategoriesByTenantId } from "@src/product/dao/getAllCategoriesByTenantId.dao";

export const getAllCategoriesService = async (
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

    const standardPageSizes = [10, 25, 50, 100];
    const normalizedPageSize =
      standardPageSizes.find((size) => size >= pageSize) ||
      standardPageSizes[standardPageSizes.length - 1];

    const CHUNK_SIZE = 50;
    const chunkIndex = Math.floor((pageNumber - 1) * pageSize / CHUNK_SIZE);
    
    const redisService = RedisService.getInstance();

    const version =
      (await redisService.get(`categories:${SERVER_TENANT_ID}:version`)) || 1;
    const cacheKey = `categories:${SERVER_TENANT_ID}:version-${version}:chunk-${chunkIndex}`;

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
    
    console.log("Cache miss, fetching from database...");

    const offset = chunkIndex * CHUNK_SIZE;
    const categories = await getAllCategoriesByTenantId(
      SERVER_TENANT_ID,
      normalizedPageSize,
      offset
    );
    
    try {
      await redisService.set(cacheKey, categories, 60 * 60 * 24);
    } catch (cacheError) {
      console.error("Error storing in cache:", cacheError);
    }

    return {
      data: {
        categories: categories,
      },
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
