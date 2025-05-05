import { z } from "zod";

export const verifyAdminTokenSchema = z.object({
    body: z.object({
        token: z.string(),
    }),
})
