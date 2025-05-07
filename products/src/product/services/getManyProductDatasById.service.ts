import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { getManyProductDatasById } from "@src/product/dao/getManyProductDatasById.dao";

export const getManyProductDatasByIdService = async (productIds: string[]) => {
  try {
    const SERVER_TENANT_ID = process.env.TENANT_ID;
    if (!SERVER_TENANT_ID) {
      return new InternalServerErrorResponse(
        "Server tenant id not found"
      ).generate();
    }

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return new BadRequestResponse(
        "Valid product ids are required"
      ).generate();
    }

    const products = await getManyProductDatasById(
      SERVER_TENANT_ID,
      productIds
    );

    return {
      data: products,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
