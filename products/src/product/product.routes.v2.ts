import express from "express";
import { validate, verifyJWTProduct } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./product.handler.v2";

const router = express.Router();

router.post(
  "",
  verifyJWTProduct,
  validate(Validation.createProductSchema),
  Handler.createProductHandler
);
router.put(
  "/:id",
  verifyJWTProduct,
  validate(Validation.editProductSchema),
  Handler.editProductHandler
);

export default router;
