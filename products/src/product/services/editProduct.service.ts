import { InternalServerErrorResponse } from "@src/commons/patterns";
import { editProductById } from "@src/product/dao/editProductById.dao";

export const editProductService = async (
  id: string,
  name?: string,
  description?: string,
  price?: number,
  quantity_available?: number,
  category_id?: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const product = await editProductById(SERVER_TENANT_ID, id, {
      name,
      description,
      price,
      quantity_available,
      category_id,
    });

    return {
      data: product,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
