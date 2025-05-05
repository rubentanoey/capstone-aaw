import { z } from "zod";

export const verifyTokenSchema = z.object({
    body: z.object({
        token: z.string(),
    }),
})
