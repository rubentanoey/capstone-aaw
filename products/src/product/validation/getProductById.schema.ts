import { z } from "zod";

export const getProductByIdSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Product ID is required" }).uuid(),
  }),
});
