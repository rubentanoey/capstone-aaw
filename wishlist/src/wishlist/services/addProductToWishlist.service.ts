import { NewWishlistDetail } from "@db/schema/wishlistDetail";
import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { addProductToWishlist } from "@src/wishlist/dao/addProductToWishlist.dao";
import { getWishlistById } from "@src/wishlist/dao/getWishlistById.dao";
import { User } from "@src/types";
import { RedisService } from "@src/commons/cache";

export const addProductToWishlistService = async (
  wishlist_id: string,
  product_id: string,
  user: User
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const wishlist = await getWishlistById(SERVER_TENANT_ID, wishlist_id);
    if (!wishlist) {
      return new NotFoundResponse("Wishlist not found").generate();
    }

    if (wishlist.user_id !== user.id) {
      return new UnauthorizedResponse(
        "You are not authorized to add product to this wishlist"
      ).generate();
    }

    const wishlistDetailData: NewWishlistDetail = {
      product_id,
      wishlist_id,
    };

    const wishlistDetail = await addProductToWishlist(wishlistDetailData);
    if (!wishlistDetail) {
      return new InternalServerErrorResponse(
        "Failed to add product to wishlist"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    await redisService.incr(
      `user-wishlists:${SERVER_TENANT_ID}:${user.id}:version`
    );

    return {
      data: wishlistDetail,
      status: 201,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
