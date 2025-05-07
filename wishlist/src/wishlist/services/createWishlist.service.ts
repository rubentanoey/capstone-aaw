import { NewWishlist } from "@db/schema/wishlist";
import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { createWishlist } from "@src/wishlist/dao/createWishlist.dao";
import { User } from "@src/types";
import { RedisService } from "@src/commons/cache";

export const createWishlistService = async (user: User, name: string) => {
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

    const wishlistData: NewWishlist = {
      name,
      user_id: user.id,
      tenant_id: SERVER_TENANT_ID,
    };

    const wishlist = await createWishlist(wishlistData);
    if (!wishlist) {
      return new InternalServerErrorResponse(
        "Failed to create wishlist"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    await redisService.incr(
      `user-wishlists:${SERVER_TENANT_ID}:${user.id}:version`
    );

    return {
      data: wishlist,
      status: 201,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
