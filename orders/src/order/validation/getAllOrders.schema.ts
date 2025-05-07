import { z } from "zod";

export const getAllOrdersSchema = z.object({
  query: z.object({
    page_number: z.number(),
    page_size: z.number(),
  }),
});
