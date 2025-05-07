import { z } from "zod";

export const getAllCategorySchema = z.object({
  query: z.object({
    page_number: z.number(),
    page_size: z.number(),
  }),
});
