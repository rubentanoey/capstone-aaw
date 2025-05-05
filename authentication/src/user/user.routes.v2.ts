import express from "express";
import { validate } from "@src/middleware/validate";
import * as Validation from "@src/user/validation";
import * as Handler from "@src/user/user.handler.v2";

const router = express.Router();

router.post(
  "/register",
  validate(Validation.registerSchema),
  Handler.registerHandler
);
router.post("/login", validate(Validation.loginSchema), Handler.loginHandler);
router.post(
  "/verify-admin",
  validate(Validation.verifyAdminTokenSchema),
  Handler.verifyAdminTokenHandler
);

export default router;
