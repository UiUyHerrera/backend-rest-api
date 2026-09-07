import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { userResponse } from '../lib/user';

export async function register(req: Request, res: Response) {
  const user = await authService.register(req.body);
  res.status(201).json(user);
}

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body.email, req.body.password);
  res.json(result);
}

export async function me(req: Request, res: Response) {
  res.json(userResponse(req.user!));
}