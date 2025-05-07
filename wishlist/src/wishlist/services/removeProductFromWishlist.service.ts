import {
  BadRequestResponse,
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { getWishlistDetailById } from "@src/wishlist/dao/getWishlistDetailById.dao";
import { getWishlistById } from "@src/wishlist/dao/getWishlistById.dao";
import { removeProductFromWishlist } from "@src/wishlist/dao/removeProductFromWishlist.dao";
import { User } from "@src/types";
import { RedisService } from "@src/commons/cache";

export const removeProductFromWishlistService = async (
  id: string,
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

    const wishlistDetail = await getWishlistDetailById(id);
    if (!wishlistDetail) {
      return new NotFoundResponse("Wishlist detail not found").generate();
    }

    const wishlist = await getWishlistById(
      SERVER_TENANT_ID,
      wishlistDetail.wishlist_id
    );
    if (!wishlist) {
      return new NotFoundResponse("Wishlist not found").generate();
    }

    if (wishlist.user_id !== user.id) {
      return new UnauthorizedResponse(
        "You are not authorized to remove product from this wishlist"
      ).generate();
    }

    const removeWishlistDetailData = await removeProductFromWishlist(id);
    if (!removeWishlistDetailData) {
      return new InternalServerErrorResponse(
        "Failed to remove product from wishlist"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    await redisService.incr(
      `user-wishlists:${SERVER_TENANT_ID}:${user.id}:version`
    );

    return {
      data: removeWishlistDetailData,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
