import { z } from "zod";

export const deleteTenantSchema = z.object({
  body: z.object({
    tenant_id: z.string().uuid(),
  }),
});
