import {
  InternalServerErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
} from "@src/commons/patterns";
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
        "You are not allowed to edit this tenant"
      ).generate();
    }

    const tenant = await editTenantById(old_tenant_id, {
      tenant_id,
      owner_id,
      name,
    });
    if (!tenant) {
      return new InternalServerErrorResponse("Error editing tenant").generate();
    }

    return {
      data: tenant,
      status: 200,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
