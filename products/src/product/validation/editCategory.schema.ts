import { z } from "zod";

export const editCategorySchema = z.object({
  params: z.object({
    category_id: z.string({ required_error: "Category ID is required" }).uuid(),
  }),
  body: z.object({
    name: z.string().optional(),
  }),
});
