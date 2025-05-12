import { z } from "zod";

export const getAllOrdersSchema = z.object({
  query: z.object({
    page_number: z.coerce.number(),
    page_size: z.coerce.number(),
  }),
});
