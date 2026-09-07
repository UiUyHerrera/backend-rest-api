import { Request, Response } from 'express';
import * as orderService from '../services/orderService';

export async function createOrder(req: Request, res: Response) {
  const order = await orderService.createOrder(req.user!.id, req.body.items);
  res.status(201).json(order);
}

export async function listOrders(req: Request, res: Response) {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const result = await orderService.listOrders(req.user!, page, limit);
  res.json(result);
}

export async function getOrder(req: Request, res: Response) {
  const order = await orderService.getOrderById(req.user!, req.params.id);
  res.json(order);
}

export async function cancelOrder(req: Request, res: Response) {
  const order = await orderService.cancelOrder(req.user!, req.params.id);
  res.json(order);
}