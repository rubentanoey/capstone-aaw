import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export const validate = (schema: z.Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      const error = err as Error;

      if (error instanceof z.ZodError || error.name === "ZodError") {
        return res.status(400).json({
          message: "Validation failed",
          errors: (error as z.ZodError).issues.map((issue) => ({
            message: issue.message,
            path: issue.path,
          })),
        });
      }

      return res.status(500).json({
        message: "Internal server error",
        error: error.message,
      });
    }
  };
};
