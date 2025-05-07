import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { editProductById } from "@src/product/dao/editProductById.dao";
import { RedisService } from "@src/commons/cache/redis";
import { getProductById } from "@src/product/dao/getProductById.dao";

export const editProductService = async (
  id: string,
  name?: string,
  description?: string,
  price?: number,
  quantity_available?: number,
  category_id?: string
) => {
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

    if (
      !name &&
      !description &&
      price === undefined &&
      quantity_available === undefined &&
      !category_id
    ) {
      return new BadRequestResponse(
        "No valid update parameters provided"
      ).generate();
    }

    let oldCategoryId;
    if (category_id) {
      try {
        const existingProduct = await getProductById(SERVER_TENANT_ID, id);
        if (existingProduct) {
          oldCategoryId = existingProduct.category_id;
        }
      } catch (error) {
        console.error("Error fetching existing product:", error);
      }
    }

    const product = await editProductById(SERVER_TENANT_ID, id, {
      name,
      description,
      price,
      quantity_available,
      category_id,
    });

    if (!product) {
      return new NotFoundResponse("Product not found").generate();
    }

    const redisService = RedisService.getInstance();
    try {
      await redisService.incr(`products:${SERVER_TENANT_ID}:version`);
      // await redisService.del(`products:${SERVER_TENANT_ID}:all`);
      await redisService.del(`product:${SERVER_TENANT_ID}:${id}`);
      if (category_id) {
        await redisService.del(
          `products:${SERVER_TENANT_ID}:category:${category_id}`
        );
      }

      if (oldCategoryId && oldCategoryId !== category_id) {
        await redisService.del(
          `products:${SERVER_TENANT_ID}:category:${oldCategoryId}`
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
