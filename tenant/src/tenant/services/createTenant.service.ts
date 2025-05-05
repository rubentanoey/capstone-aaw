import { InternalServerErrorResponse } from "@src/commons/patterns";
import { createNewTenant } from "../dao/createNewTenant.dao";

export const createTenantService = async (owner_id: string, name: string) => {
  try {
    const tenant = await createNewTenant(owner_id, name);
    if (!tenant) {
      return new InternalServerErrorResponse(
        "Error creating tenant"
      ).generate();
    }

    return {
      data: tenant,
      status: 201,
    };
  } catch (err: any) {
    return new InternalServerErrorResponse(err).generate();
  }
};
