import { InternalServerErrorResponse } from "@src/commons/patterns";
import { deleteProductById } from "@src/product/dao/deleteProductById.dao";

export const deleteProductService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const product = await deleteProductById(SERVER_TENANT_ID, id);

    return {
      data: {
        ...product,
      },
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
