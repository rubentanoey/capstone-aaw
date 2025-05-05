import { Request, Response } from "express";
import * as Service from "./services";

export const getAllProductsHandler = async (req: Request, res: Response) => {
  const response = await Service.getAllProductsService();
  return res.status(response.status).send(response.data);
};

export const getManyProductDatasByIdHandler = async (
  req: Request,
  res: Response
) => {
  const { productIds } = req.body;
  const response = await Service.getManyProductDatasByIdService(productIds);
  return res.status(response.status).send(response.data);
};

export const getProductByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const response = await Service.getProductByIdService(id);
  return res.status(response.status).send(response.data);
};

export const getProductByCategoryHandler = async (
  req: Request,
  res: Response
) => {
  const { category_id } = req.params;
  const response = await Service.getProductByCategoryService(category_id);
  return res.status(response.status).send(response.data);
};

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

export const getAllCategoryHandler = async (req: Request, res: Response) => {
  const response = await Service.getAllCategoriesService();
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

export const editCategoryHandler = async (req: Request, res: Response) => {
  const { category_id } = req.params;
  const { name } = req.body;
  const response = await Service.editCategoryService(category_id, name);
  return res.status(response.status).send(response.data);
};

export const deleteProductHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const response = await Service.deleteProductService(id);
  return res.status(response.status).send(response.data);
};

export const deleteCategoryHandler = async (req: Request, res: Response) => {
  const { category_id } = req.params;
  const response = await Service.deleteCategoryService(category_id);
  return res.status(response.status).send(response.data);
};
