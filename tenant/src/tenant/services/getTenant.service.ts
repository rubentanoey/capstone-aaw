import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns/exceptions";
import { RedisService } from "@src/commons/cache/redis";
import { getTenantById } from "@src/tenant/dao/getTenantById.dao";

export const getTenantService = async (tenant_id: string) => {
  try {
    const redisService = RedisService.getInstance();

    const cacheKey = `tenant:${tenant_id}`;

    const cachedTenant = await redisService.get(cacheKey);
    if (cachedTenant) {
      return {
        data: cachedTenant,
        status: 200,
      };
    }

    const tenant = await getTenantById(tenant_id);
    if (!tenant) {
      return new NotFoundResponse("Tenant not found").generate();
    }

    await redisService.set(cacheKey, tenant, 60 * 60 * 24);
    return {
      data: tenant,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
