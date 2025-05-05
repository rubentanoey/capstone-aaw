import { z } from "zod";

export const editTenantSchema = z.object({
  params: z.object({
    old_tenant_id: z.string().uuid(),
  }),
  body: z.object({
    tenant_id: z.string().uuid().optional(),
    owner_id: z.string().uuid().optional(),
    name: z.string().optional(),
  }),
});
