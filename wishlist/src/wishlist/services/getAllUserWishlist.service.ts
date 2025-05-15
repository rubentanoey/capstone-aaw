import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllUserWishlist } from "@src/wishlist/dao/getAllUserWishlist.dao";
import { User } from "@src/types";

export const getAllUserWishlistService = async (
  user: User,
  page_number: number,
  page_size: number
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    if (!user?.id) {
      return new BadRequestResponse("User ID is required").generate();
    }

    const standardPageSizes = [10, 25, 50, 100];
    const normalizedPageSize =
      standardPageSizes.find((size) => size >= page_size) ||
      standardPageSizes[standardPageSizes.length - 1];

    const CHUNK_SIZE = 50;
    const chunkIndex = Math.floor(((page_number - 1) * page_size) / CHUNK_SIZE);
    const offset = chunkIndex * CHUNK_SIZE;

    const redisService = RedisService.getInstance();

    try {
      const version =
        (await redisService.get(
          `user-wishlists:${SERVER_TENANT_ID}:${user.id}:version`
        )) || 1;

      const cacheKey = `user-wishlists:${SERVER_TENANT_ID}:${user.id}:version-${version}:chunk-${chunkIndex}`;

      const cachedWishlists = await redisService.get(cacheKey);
      if (cachedWishlists) {
        return {
          data: cachedWishlists,
          status: 200,
        };
      }
    } catch (cacheError) {
      console.error("Error retrieving from cache:", cacheError);
    }

    const wishlists = await getAllUserWishlist(
      SERVER_TENANT_ID,
      user.id,
      normalizedPageSize,
      offset
    );

    try {
      const cacheKey = `user-wishlists:${SERVER_TENANT_ID}:${
        user.id
      }:version-${1}:chunk-${chunkIndex}`;
      await redisService.set(cacheKey, wishlists, 60 * 60 * 24);
    } catch (cacheError) {
      console.error("Error storing wishlists in cache:", cacheError);
    }

    return {
      data: wishlists,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
