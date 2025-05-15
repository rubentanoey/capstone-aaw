import { z } from "zod";

export const getAllCategorySchema = z.object({
  query: z.object({
    page_number: z.coerce.number().min(1).max(1000),
    page_size: z.coerce.number().min(1).max(100),
  }),
});
