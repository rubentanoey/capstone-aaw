import { z } from "zod";

export const deleteProductSchema = z.object({
  params: z.object({
    id: z.string({ required_error: "Product ID is required" }).uuid(),
  }),
});
