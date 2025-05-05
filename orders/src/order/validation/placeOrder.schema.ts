import { z } from "zod";

export const placeOrderSchema = z.object({
  body: z.object({
    shipping_provider: z.enum([
      "JNE",
      "TIKI",
      "SICEPAT",
      "GOSEND",
      "GRAB_EXPRESS",
    ]),
  }),
});
