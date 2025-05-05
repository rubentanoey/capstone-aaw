import { z } from "zod";

export const getProductByCategorySchema = z.object({
  params: z.object({
    category_id: z.string({ required_error: "Category ID is required" }).uuid(),
  }),
});
