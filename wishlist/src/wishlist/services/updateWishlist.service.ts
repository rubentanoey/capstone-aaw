import { InternalServerErrorResponse, NotFoundResponse } from "@src/commons/patterns";
import { updateWishlistById } from "@src/wishlist/dao/updateWishlistById.dao";
import { RedisService } from "@src/commons/cache";
import { getWishlistById } from "@src/wishlist/dao/getWishlistById.dao";

export const updateWishlistService = async (id: string, name?: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const existingWishlist = await getWishlistById(SERVER_TENANT_ID, id);
    if (!existingWishlist) {
      return new NotFoundResponse("Wishlist not found").generate();
    }

    const userId = existingWishlist.user_id;
    
    const wishlist = await updateWishlistById(SERVER_TENANT_ID, id, {
      name,
    });

    const redisService = RedisService.getInstance();
    try {
      await redisService.del(`user-wishlists:${SERVER_TENANT_ID}:${userId}`);
      await redisService.del(`wishlist:${SERVER_TENANT_ID}:${id}:${userId}`);
    } catch (cacheError) {
      console.error("Failed to invalidate cache:", cacheError);
    }

    return {
      data: wishlist,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
