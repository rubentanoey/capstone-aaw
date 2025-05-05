import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Category name is required" }),
  }),
});
