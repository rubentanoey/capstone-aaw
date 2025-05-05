import {
  InternalServerErrorResponse,
  NotFoundResponse,
} from "@src/commons/patterns/exceptions";
import { getTenantById } from "@src/tenant/dao/getTenantById.dao";

export const getTenantService = async (tenant_id: string) => {
  try {
    const tenant = await getTenantById(tenant_id);
    if (!tenant) {
      return new NotFoundResponse("Tenant not found").generate();
    }

    return {
      data: {
        ...tenant,
      },
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
