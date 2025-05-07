import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns";
import { deleteProductById } from "@src/product/dao/deleteProductById.dao";

export const deleteProductService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!id) {
      return new NotFoundResponse("Product id not found").generate();
    }

    const product = await deleteProductById(SERVER_TENANT_ID, id);
    if (!product) {
      return new NotFoundResponse("Product not found").generate();
    }

    return {
      data: product,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
