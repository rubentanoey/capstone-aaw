import { Request, Response } from "express";
import * as Service from "./services";

export const getAllUserWishlistHandler = async (
  req: Request,
  res: Response
) => {
  const { user } = req.body;
  const response = await Service.getAllUserWishlistService(user);
  return res.status(response.status).send(response.data);
};

export const getWishlistByIdHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { user } = req.body;
  const response = await Service.getWishlistByIdService(id, user);
  return res.status(response.status).send(response.data);
};

export const createWishlistHandler = async (req: Request, res: Response) => {
  const { user, name } = req.body;
  const response = await Service.createWishlistService(user, name);
  return res.status(response.status).send(response.data);
};

export const updateWishlistHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name } = req.body;
  const response = await Service.updateWishlistService(id, name);
  return res.status(response.status).send(response.data);
};

export const deleteWishlistHandler = async (req: Request, res: Response) => {
  const { id } = req.params;
  const response = await Service.deleteWishlistService(id);
  return res.status(response.status).send(response.data);
};

export const addProductToWishlistHandler = async (
  req: Request,
  res: Response
) => {
  const { user, wishlist_id, product_id } = req.body;
  const response = await Service.addProductToWishlistService(
    wishlist_id,
    product_id,
    user
  );
  return res.status(response.status).send(response.data);
};

export const removeProductFromWishlistHandler = async (
  req: Request,
  res: Response
) => {
  const { user, id } = req.body;
  const response = await Service.removeProductFromWishlistService(id, user);
  return res.status(response.status).send(response.data);
};
