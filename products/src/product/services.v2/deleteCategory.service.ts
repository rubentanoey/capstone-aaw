import {
  InternalServerErrorResponse,
  NotFoundResponse,
  BadRequestResponse,
  ConflictResponse,
} from "@src/commons/patterns";
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

    if (!category) {
      return new NotFoundResponse("Category not found").generate();
    }

    return {
      data: {
        ...category,
      },
      status: 200,
    };
  } catch (err: any) {
    if (err.code === "23503") {
      return new ConflictResponse(
        "Cannot delete category that is still referenced by products"
      ).generate();
    }

    if (err.code === "22P02") {
      return new BadRequestResponse("Invalid category ID format").generate();
    }

    if (err.code) {
      return new InternalServerErrorResponse(
        "Database error occurred"
      ).generate();
    }

    return new InternalServerErrorResponse(err).generate();
  }
};
