import { InternalServerErrorResponse } from "@src/commons/patterns";
import { getAllCategoriesByTenantId } from "@src/product/dao/getAllCategoriesByTenantId.dao";

export const getAllCategoriesService = async () => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    const categories = await getAllCategoriesByTenantId(SERVER_TENANT_ID);

    return {
      data: categories,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
