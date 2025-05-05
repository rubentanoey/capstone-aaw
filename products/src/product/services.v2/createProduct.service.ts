import { NewProduct } from "@db/schema/products";
import {
  InternalServerErrorResponse,
  ConflictResponse,
  BadRequestResponse,
} from "@src/commons/patterns";
import { createNewProduct } from "@src/product/dao/createNewProduct.dao";

export const createProductService = async (
  name: string,
  description: string,
  price: number,
  quantity_available: number,
  category_id?: string
) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server Tenant ID not found"
      ).generate();
    }

    const productData: NewProduct = {
      tenant_id: SERVER_TENANT_ID,
      name,
      description,
      price,
      quantity_available,
    };
    if (category_id) {
      productData.category_id = category_id;
    }

    const newProduct = await createNewProduct(productData);

    return {
      data: newProduct,
      status: 201,
    };
  } catch (err: any) {
    if (err.code === "23505") {
      if (err.detail?.includes("name")) {
        return new ConflictResponse("Product name already exists").generate();
      }
    }

    if (err.code === "23503") {
      if (err.detail?.includes("category_id")) {
        return new BadRequestResponse("Invalid category ID").generate();
      }
    }

    if (err.code === "23514") {
      return new BadRequestResponse(
        "Invalid product data: check constraints failed"
      ).generate();
    }

    if (err.code) {
      return new InternalServerErrorResponse(
        "Database error occurred"
      ).generate();
    }

    return new InternalServerErrorResponse(err).generate();
  }
};
