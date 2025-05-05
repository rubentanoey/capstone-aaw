import { InternalServerErrorResponse } from "@src/commons/patterns";
import { getProductById } from "@src/product/dao/getProductById.dao";

export const getProductByIdService = async (id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const products = await getProductById(SERVER_TENANT_ID, id);

    return {
      data: {
        ...products,
      },
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
