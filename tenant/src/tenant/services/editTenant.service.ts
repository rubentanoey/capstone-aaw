import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
import { RedisService } from "@src/commons/cache/redis";
import { editTenantById } from "@src/tenant/dao/editTenantById.dao";
import { getTenantById } from "@src/tenant/dao/getTenantById.dao";
import { User } from "@src/types/user";

export const editTenantService = async (
  old_tenant_id: string,
  user: User,
  tenant_id?: string,
  owner_id?: string,
  name?: string
) => {
  try {
    const tenant_information = await getTenantById(old_tenant_id);
    if (!tenant_information) {
      return new NotFoundResponse("Tenant not found").generate();
    }

    if (tenant_information.tenants.owner_id !== user.id) {
      return new UnauthorizedResponse(
        "You are not authorized to edit this tenant"
      ).generate();
    }

    const tenant = await editTenantById(old_tenant_id, {
      tenant_id,
      owner_id,
      name,
    });
    if (!tenant) {
      return new InternalServerErrorResponse(
        "Failed to update tenant"
      ).generate();
    }

    const redisService = RedisService.getInstance();
    try {
      await redisService.del(`tenant:${old_tenant_id}`);
      if (tenant_id && tenant_id !== old_tenant_id) {
        await redisService.del(`tenant:${tenant_id}`);
      }
    } catch (cacheError) {
      console.error("Failed to invalidate tenant cache:", cacheError);
    }

    return {
      data: tenant,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
