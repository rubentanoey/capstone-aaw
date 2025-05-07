import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { User } from "@src/types";
import { getAllCartItemsPaginated } from "../dao/getAllCartItemsPaginated.dao";

export const getAllCartItemsService = async (
  user: User,
  page_number: string,
  page_size: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!user.id) {
      return new NotFoundResponse("User id not found").generate();
    }

    const limit = parseInt(page_size);
    const offset = (parseInt(page_number) - 1) * parseInt(page_size);

    const items = await getAllCartItemsPaginated(
      SERVER_TENANT_ID,
      user.id,
      limit,
      offset
    );

    return {
      data: items,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
