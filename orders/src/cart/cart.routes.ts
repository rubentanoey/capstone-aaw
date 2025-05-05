import express from "express";
import { validate, verifyJWT } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./cart.handler";

const router = express.Router();

router.get("", verifyJWT, Handler.getAllCartItemsHandler);
router.post(
  "",
  verifyJWT,
  validate(Validation.addItemToCartSchema),
  Handler.addItemToCartHandler
);
router.put(
  "",
  verifyJWT,
  validate(Validation.editCartItemSchema),
  Handler.editCartItemHandler
);
router.delete(
  "",
  verifyJWT,
  validate(Validation.deleteCartItemSchema),
  Handler.deleteCartItemHandler
);

export default router;
