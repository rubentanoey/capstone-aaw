import express from "express";
import { validate, verifyJWTTenant } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./tenant.handler.v2";

const router = express.Router();

router.get(
  "/:tenant_id",
  verifyJWTTenant,
  validate(Validation.getTenantSchema),
  Handler.getTenantHandler
);
router.post(
  "",
  verifyJWTTenant,
  validate(Validation.createTenantSchema),
  Handler.createTenantHandler
);
router.put(
  "/:tenant_id",
  verifyJWTTenant,
  validate(Validation.editTenantSchema),
  Handler.editTenantHandler
);

export default router;
