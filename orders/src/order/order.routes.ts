import express from "express";
import { validate, verifyJWT } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./order.handler";

const router = express.Router();

router.get("", verifyJWT, Handler.getAllOrdersHandler);
router.get(
  "/:orderId",
  verifyJWT,
  validate(Validation.getOrderDetailSchema),
  Handler.getOrderDetailHandler
);
router.post(
  "",
  verifyJWT,
  validate(Validation.placeOrderSchema),
  Handler.placeOrderHandler
);
router.post(
  "/:orderId/pay",
  validate(Validation.payOrderSchema),
  Handler.payOrderHandler
);
router.post(
  "/:orderId/cancel",
  verifyJWT,
  validate(Validation.cancelOrderSchema),
  Handler.cancelOrderHandler
);

export default router;
