import express from "express";
import { validate, verifyJWT } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./wishlist.handler";

const router = express.Router();

router.get("/", verifyJWT, Handler.getAllUserWishlistHandler);
router.get(
  "/:id",
  verifyJWT,
  validate(Validation.getWishlistByIdSchema),
  Handler.getWishlistByIdHandler
);
router.post(
  "/",
  verifyJWT,
  validate(Validation.createWishlistSchema),
  Handler.createWishlistHandler
);
router.put(
  "/:id",
  verifyJWT,
  validate(Validation.updateWishlistSchema),
  Handler.updateWishlistHandler
);
router.delete(
  "/remove",
  verifyJWT,
  validate(Validation.removeProductFromWishlistSchema),
  Handler.removeProductFromWishlistHandler
);
router.delete(
  "/:id",
  verifyJWT,
  validate(Validation.deleteWishlistSchema),
  Handler.deleteWishlistHandler
);
router.post(
  "/add",
  verifyJWT,
  validate(Validation.addProductToWishlistSchema),
  Handler.addProductToWishlistHandler
);

export default router;
