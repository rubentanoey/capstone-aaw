import express from "express";
import { validate, verifyJWTTenant } from "@src/middleware";
import * as Validation from "./validation";
import * as Handler from "./tenant.handler";

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
  "/:old_tenant_id",
  verifyJWTTenant,
  validate(Validation.editTenantSchema),
  Handler.editTenantHandler
);
router.delete(
  "",
  verifyJWTTenant,
  validate(Validation.deleteTenantSchema),
  Handler.deleteTenantHandler
);

export default router;
