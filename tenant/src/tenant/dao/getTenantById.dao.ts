import * as schemaTenant from "../../../db/schema/tenants";
import * as schemaTenantDetails from "../../../db/schema/tenantDetails";
import { db } from "@src/db";
import { eq } from "drizzle-orm";

export const getTenantById = async (tenant_id: string) => {
  const result = await db
    .select()
    .from(schemaTenant.tenants)
    .innerJoin(
      schemaTenantDetails.tenantDetails,
      eq(schemaTenant.tenants.id, schemaTenantDetails.tenantDetails.tenant_id)
    )
    .where(eq(schemaTenant.tenants.id, tenant_id));
  return result[0];
};
