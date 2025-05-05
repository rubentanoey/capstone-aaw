import { InternalServerErrorResponse } from "@src/commons/patterns";
import { updateWishlistById } from "@src/wishlist/dao/updateWishlistById.dao";

export const updateWishlistService = async (id: string, name?: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    const wishlist = await updateWishlistById(SERVER_TENANT_ID, id, {
      name,
    });

    return {
      data: wishlist,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
