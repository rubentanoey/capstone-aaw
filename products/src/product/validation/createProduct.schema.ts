import { z } from "zod";

export const createProductSchema = z.object({
  body: z.object({
    name: z.string({ required_error: "Product name is required" }),
    description: z.string().optional(),
    price: z.number({ required_error: "Product price is required" }),
    quantity_available: z.number({
      required_error: "Product stock is required",
    }),
    category_id: z.string().uuid().optional(),
  }),
});
