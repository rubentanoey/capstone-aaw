import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { deleteProductById } from "@src/product/dao/deleteProductById.dao";
import { getProductById } from "@src/product/dao/getProductById.dao";
import { RedisService } from "@src/commons/cache/redis";

export const deleteProductService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!id) {
      return new NotFoundResponse("Product id not found").generate();
    }

    let categoryId;
    try {
      const existingProduct = await getProductById(SERVER_TENANT_ID, id);
      if (existingProduct) {
        categoryId = existingProduct.category_id;
      }
    } catch (error) {
      console.error("Error fetching existing product:", error);
    }

    const product = await deleteProductById(SERVER_TENANT_ID, id);
    if (!product) {
      return new NotFoundResponse("Product not found").generate();
    }

    const redisService = RedisService.getInstance();
    try {
      await redisService.del(`product:${SERVER_TENANT_ID}:${id}`);
      await redisService.del(`products:${SERVER_TENANT_ID}:all`);

      if (categoryId) {
        await redisService.del(
          `products:${SERVER_TENANT_ID}:category:${categoryId}`
        );
      }
    } catch (cacheError) {
      console.error("Error invalidating product caches:", cacheError);
    }

    return {
      data: product,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
