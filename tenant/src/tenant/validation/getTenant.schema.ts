import { z } from "zod";

export const getTenantSchema = z.object({
  params: z.object({
    tenant_id: z.string().uuid(),
  }),
});
