import { Request, Response } from 'express';
import * as productService from '../services/productService';

export async function listProducts(req: Request, res: Response) {
  const result = await productService.listProducts(req.query as unknown as productService.ProductListQuery);
  res.json(result);
}

export async function getProduct(req: Request, res: Response) {
  const product = await productService.getProductById(req.params.id);
  res.json(product);
}

export async function createProduct(req: Request, res: Response) {
  const product = await productService.createProduct(req.body);
  res.status(201).json(product);
}

export async function updateProduct(req: Request, res: Response) {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json(product);
}

export async function deleteProduct(req: Request, res: Response) {
  await productService.deleteProduct(req.params.id);
  res.status(204).send();
}