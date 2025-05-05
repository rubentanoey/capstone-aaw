import { InternalServerErrorResponse } from "@src/commons/patterns";
import { deleteWishlistById } from "@src/wishlist/dao/deleteWishlistById.dao";

export const deleteWishlistService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const wishlist = await deleteWishlistById(SERVER_TENANT_ID, id);
    if (!wishlist) {
      return new InternalServerErrorResponse("Wishlist not found").generate();
    }

    return {
      data: wishlist,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
