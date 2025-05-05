import express from "express";
import { validate, verifyJWTProduct } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./product.handler.v2";

const router = express.Router();

router.post(
  "/",
  verifyJWTProduct,
  validate(Validation.createCategorySchema),
  Handler.createCategoryHandler
);
router.delete(
  "/:category_id",
  verifyJWTProduct,
  validate(Validation.deleteCategorySchema),
  Handler.deleteCategoryHandler
);

export default router;
