import {
  BadRequestResponse,
  InternalServerErrorResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { getAllUserWishlist } from "@src/wishlist/dao/getAllUserWishlist.dao";
import { User } from "@src/types";

const STANDARD_PAGE_SIZES = [10, 25, 50, 100];
const CACHE_TTL_SECONDS = 60 * 60 * 24;

export const getAllUserWishlistService = async (
  user: User,
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

    if (!user?.id) {
      return new BadRequestResponse("User ID is required").generate();
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
      (await redisService.get(
        `user-wishlists:${tenantId}:${user.id}:version`
      )) || 1;
    const cacheKey = `user-wishlists:${tenantId}:${user.id}:v${version}:p${pageNumber}:s${normalizedPageSize}`;

    const cached = await redisService.get(cacheKey).catch((err) => {
      console.error("Cache lookup error:", err);
      return null;
    });
    if (cached) {
      return { status: 200, data: { wishlists: cached } };
    }

    const wishlists = await getAllUserWishlist(
      tenantId,
      user.id,
      normalizedPageSize,
      offset
    );

    redisService
      .set(cacheKey, wishlists, CACHE_TTL_SECONDS)
      .catch((err) => console.error("Cache set error:", err));

    return { status: 200, data: { wishlists } };
  } catch (err: any) {
    return new InternalServerErrorResponse(err.message).generate();
  }
};
