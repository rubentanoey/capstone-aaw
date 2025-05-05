import { z } from "zod";

export const deleteCategorySchema = z.object({
  params: z.object({
    category_id: z.string({ required_error: "Category ID is required" }).uuid(),
  }),
});
