import { Request, Response } from "express";
import * as Service from "./services.v2";

export const createProductHandler = async (req: Request, res: Response) => {
  const { name, description, price, quantity_available, category_id } =
    req.body;
  const response = await Service.createProductService(
    name,
    description,
    price,
    quantity_available,
    category_id
  );
  return res.status(response.status).send(response.data);
};

export const createCategoryHandler = async (req: Request, res: Response) => {
  const { name } = req.body;
  const response = await Service.createCategoryService(name);
  return res.status(response.status).send(response.data);
};

export const editProductHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, price, quantity_available, category_id } =
    req.body;
  const response = await Service.editProductService(
    id,
    name,
    description,
    price,
    quantity_available,
    category_id
  );
  return res.status(response.status).send(response.data);
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
  const { category_id } = req.params;
  const response = await Service.deleteCategoryService(category_id);
  return res.status(response.status).send(response.data);
};
