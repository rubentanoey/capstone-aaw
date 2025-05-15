import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllProductsByTenantId } from "@src/product/dao/getAllProductsByTenantId.dao";

const STANDARD_PAGE_SIZES = [10, 25, 50, 100];
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export const getAllProductsService = async (
  pageNumber: number,
  pageSize: number
) => {
  try {
    const tenantId = process.env.TENANT_ID;
    if (!tenantId) {
      return new InternalServerErrorResponse(
        "Server tenant ID is missing"
      ).generate();
    }

    if (pageNumber < 1 || pageSize < 1) {
      return new BadRequestResponse("Invalid pagination parameters").generate();
    }

    const normalizedPageSize =
      STANDARD_PAGE_SIZES.find((size) => size >= pageSize) ||
      STANDARD_PAGE_SIZES[STANDARD_PAGE_SIZES.length - 1];
    const offset = (pageNumber - 1) * normalizedPageSize;

    const redisService = RedisService.getInstance();
    const version =
      (await redisService.get(`products:${tenantId}:version`)) || 1;
    const cacheKey = `products:${tenantId}:v${version}:p${pageNumber}:s${normalizedPageSize}`;

    const cached = await redisService.get(cacheKey).catch((err) => {
      console.error("Cache lookup error:", err);
      return null;
    });
    if (cached) {
      return { status: 200, data: { products: cached } };
    }

    const products = await getAllProductsByTenantId(
      tenantId,
      normalizedPageSize,
      offset
    );

    redisService
      .set(cacheKey, products, CACHE_TTL_SECONDS)
      .catch((err) => console.error("Cache set error:", err));

    return { status: 200, data: { products } };
  } catch (err: any) {
    return new InternalServerErrorResponse(err.message).generate();
  }
};
