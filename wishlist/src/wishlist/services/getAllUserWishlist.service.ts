import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllUserWishlist } from "@src/wishlist/dao/getAllUserWishlist.dao";
import { User } from "@src/types";

export const getAllUserWishlistService = async (user: User) => {
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

    const redisService = RedisService.getInstance();

    const cacheKey = `user-wishlists:${SERVER_TENANT_ID}:${user.id}`;
    const cachedWishlists = await redisService.get(cacheKey);
    if (cachedWishlists) {
      return {
        data: cachedWishlists,
        status: 200,
      };
    }

    const wishlists = await getAllUserWishlist(SERVER_TENANT_ID, user.id);
    await redisService.set(cacheKey, wishlists, 60 * 60 * 24);

    return {
      data: wishlists,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
