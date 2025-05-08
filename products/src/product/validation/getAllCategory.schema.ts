import { z } from "zod";

export const getAllCategorySchema = z.object({
  query: z.object({
    page_number: z.coerce.number(),
    page_size: z.coerce.number(),
  }),
});
