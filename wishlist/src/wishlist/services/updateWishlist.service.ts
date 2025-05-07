import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { getWishlistById } from "@src/wishlist/dao/getWishlistById.dao";
import { updateWishlistById } from "@src/wishlist/dao/updateWishlistById.dao";

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

    const wishlist = await updateWishlistById(SERVER_TENANT_ID, id, {
      name,
    });

    if (!wishlist) {
      return new InternalServerErrorResponse(
        "Failed to update wishlist"
      ).generate();
    }

    return {
      data: wishlist,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
