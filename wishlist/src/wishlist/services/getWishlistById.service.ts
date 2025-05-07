import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache";
import { getWishlistDetailByWishlistId } from "@src/wishlist/dao/getWishlistDetailByWishlistId.dao";
import { getWishlistById } from "@src/wishlist/dao/getWishlistById.dao";
import { User } from "@src/types";

export const getWishlistByIdService = async (
  wishlist_id: string,
  user: User
) => {
  try {
    if (!user?.id) {
      return new BadRequestResponse("User ID is required").generate();
    }

    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const redisService = RedisService.getInstance();

    const cacheKey = `wishlist:${SERVER_TENANT_ID}:${wishlist_id}:${user.id}`;
    const cachedData = await redisService.get(cacheKey);
    if (cachedData) {
      return {
        data: cachedData,
        status: 200,
      };
    }

    const wishlist = await getWishlistById(SERVER_TENANT_ID, wishlist_id);
    if (!wishlist) {
      return new NotFoundResponse("Wishlist not found").generate();
    }

    if (wishlist.user_id !== user.id) {
      return new UnauthorizedResponse(
        "You are not authorized to access this wishlist"
      ).generate();
    }

    const wishlistDetail = await getWishlistDetailByWishlistId(wishlist_id);
    if (!wishlistDetail) {
      return new NotFoundResponse("Wishlist is empty").generate();
    }

    await redisService.set(cacheKey, wishlistDetail, 60 * 60 * 24);

    return {
      data: wishlistDetail,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
