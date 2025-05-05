import express from "express";
import { validate } from "@src/middleware/validate";
import * as Validation from "@src/user/validation";
import * as Handler from "@src/user/user.handler";

const router = express.Router();

router.post(
  "/register",
  validate(Validation.registerSchema),
  Handler.registerHandler
);
router.post("/login", validate(Validation.loginSchema), Handler.loginHandler);
router.post(
  "/verify-token",
  validate(Validation.verifyTokenSchema),
  Handler.verifyTokenHandler
);
router.post(
  "/verify-admin-token",
  validate(Validation.verifyAdminTokenSchema),
  Handler.verifyAdminTokenHandler
);

export default router;
