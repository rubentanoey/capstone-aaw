import { Request, Response } from "express";
import * as Service from "./services";

export const getTenantHandler = async (req: Request, res: Response) => {
  const { tenant_id } = req.params;
  const response = await Service.getTenantService(tenant_id);
  return res.status(response.status).send(response.data);
};

export const createTenantHandler = async (req: Request, res: Response) => {
  const { name, user } = req.body;
  const response = await Service.createTenantService(user.id, name);
  return res.status(response.status).send(response.data);
};

export const editTenantHandler = async (req: Request, res: Response) => {
  const { old_tenant_id } = req.params;
  const { user, tenant_id, owner_id, name } = req.body;
  const response = await Service.editTenantService(
    old_tenant_id,
    user,
    tenant_id,
    owner_id,
    name
  );
  return res.status(response.status).send(response.data);
};

export const deleteTenantHandler = async (req: Request, res: Response) => {
  const { user, tenant_id } = req.body;
  const response = await Service.deleteTenantService(user, tenant_id);
  return res.status(response.status).send(response.data);
};
