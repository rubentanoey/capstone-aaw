import { InternalServerErrorResponse } from "@src/commons/patterns";
import { deleteCategoryById } from "@src/product/dao/deleteCategoryById.dao";

export const deleteCategoryService = async (category_id: string) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const category = await deleteCategoryById(SERVER_TENANT_ID, category_id);

    return {
      data: {
        ...category,
      },
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
