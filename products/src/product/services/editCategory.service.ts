import { InternalServerErrorResponse } from "@src/commons/patterns";
import { editCategoryById } from "@src/product/dao/editCategoryById.dao";

export const editCategoryService = async (
  category_id: string,
  name?: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const category = await editCategoryById(SERVER_TENANT_ID, category_id, {
      name,
    });

    return {
      data: category,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
