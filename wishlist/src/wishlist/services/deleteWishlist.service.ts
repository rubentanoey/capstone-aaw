import { InternalServerErrorResponse, NotFoundResponse } from "@src/commons/patterns";
import { deleteWishlistById } from "@src/wishlist/dao/deleteWishlistById.dao";
import { RedisService } from "@src/commons/cache";

export const deleteWishlistService = async (id: string, user: { id: string }) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse("Server tenant ID is missing").generate();
    }

    const wishlist = await deleteWishlistById(SERVER_TENANT_ID, id);
    if (!wishlist) {
      return new NotFoundResponse("Wishlist not found").generate();
    }

    const redisService = RedisService.getInstance();
    await redisService.del(`user-wishlists:${SERVER_TENANT_ID}:${user.id}`);
    await redisService.del(`wishlist:${SERVER_TENANT_ID}:${id}:${user.id}`);

    return {
      data: wishlist,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};