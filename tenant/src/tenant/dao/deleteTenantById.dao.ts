import * as schemaTenant from "@db/schema/tenants";
import * as schemaTenantDetails from "@db/schema/tenantDetails";
import { db } from "@src/db";
import { eq } from "drizzle-orm";

export const deleteTenantById = async (tenant_id: string) => {
  const result = await db.transaction(async (tx) => {
    const resultTenantDetails = await tx
      .delete(schemaTenantDetails.tenantDetails)
      .where(eq(schemaTenantDetails.tenantDetails.tenant_id, tenant_id))
      .returning();
    const resultTenants = await tx
      .delete(schemaTenant.tenants)
      .where(eq(schemaTenant.tenants.id, tenant_id))
      .returning();

    if (!resultTenants[0] || !resultTenantDetails[0]) {
      await tx.rollback();
      return null;
    }

    return {
      tenants: resultTenants[0],
      tenantDetails: resultTenantDetails[0],
    };
  });
  return result;
};
