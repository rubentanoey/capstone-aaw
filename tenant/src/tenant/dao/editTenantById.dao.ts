import { db } from "@src/db";
import * as schemaTenant from "@db/schema/tenants";
import * as schemaTenantDetails from "@db/schema/tenantDetails";
import { eq } from "drizzle-orm";

export const editTenantById = async (
  tenant_id: string,
  data: {
    tenant_id: string | undefined;
    owner_id: string | undefined;
    name: string | undefined;
  }
) => {
  const result = await db.transaction(async (tx) => {
    if (!data.tenant_id) {
      let resultTenant;
      if (data.owner_id) {
        resultTenant = await tx
          .update(schemaTenant.tenants)
          .set({
            id: data.tenant_id,
            owner_id: data.owner_id,
          })
          .where(eq(schemaTenant.tenants.id, tenant_id))
          .returning();
      }

      let resultTenantDetails;
      if (data.name) {
        resultTenantDetails = await tx
          .update(schemaTenantDetails.tenantDetails)
          .set({
            tenant_id: data.tenant_id,
            name: data.name,
          })
          .where(eq(schemaTenantDetails.tenantDetails.tenant_id, tenant_id))
          .returning();
      }

      if (
        (!!data.owner_id && !resultTenant) ||
        (!!data.name && !resultTenantDetails)
      ) {
        await tx.rollback();
        return null;
      }

      return {
        tenant: resultTenant?.[0],
        tenantDetails: resultTenantDetails?.[0],
      };
    } else {
      const newTenantId = data.tenant_id;
      const oldTenantId = tenant_id;

      const tenantDetail = await tx
        .delete(schemaTenantDetails.tenantDetails)
        .where(eq(schemaTenantDetails.tenantDetails.tenant_id, oldTenantId))
        .returning();

      if (!tenantDetail?.[0]?.id) {
        await tx.rollback();
        return null;
      }

      const tenant = await tx
        .delete(schemaTenant.tenants)
        .where(eq(schemaTenant.tenants.id, oldTenantId))
        .returning();

      if (!tenant?.[0]?.id) {
        await tx.rollback();
        return null;
      }

      const newTenant = await tx
        .insert(schemaTenant.tenants)
        .values({
          id: newTenantId,
          owner_id: data.owner_id ?? tenant[0].owner_id ?? "",
        })
        .returning();

      if (!newTenant?.[0]?.id) {
        await tx.rollback();
        return null;
      }

      const newTenantDetail = await tx
        .insert(schemaTenantDetails.tenantDetails)
        .values({
          id: tenantDetail[0].id,
          tenant_id: newTenantId,
          name: data.name ?? tenantDetail[0].name ?? "",
        })
        .returning();

      if (!newTenantDetail?.[0]?.id) {
        await tx.rollback();
        return null;
      }

      return {
        tenant: newTenant[0],
        tenantDetails: newTenantDetail[0],
      };
    }
  });

  return result;
};
