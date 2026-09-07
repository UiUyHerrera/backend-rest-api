import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { userResponse } from '../lib/user';
import { HttpError } from '../lib/httpError';

function canAccessUser(req: Request, id: string) {
  if (req.user!.role !== 'ADMIN' && req.user!.id !== id) {
    throw new HttpError(403, 'You can only access your own profile');
  }
}

export async function listUsers(req: Request, res: Response) {
  const users = await userService.listUsers();
  res.json(users.map(userResponse));
}

export async function getUser(req: Request, res: Response) {
  const id = req.params.id;
  canAccessUser(req, id);
  const user = await userService.getUserById(id);
  res.json(userResponse(user));
}

export async function updateUser(req: Request, res: Response) {
  const id = req.params.id;
  canAccessUser(req, id);
  const user = await userService.updateUser(id, req.body);
  res.json(userResponse(user));
}

export async function deleteUser(req: Request, res: Response) {
  const id = req.params.id;
  canAccessUser(req, id);
  await userService.deleteUser(id);
  res.status(204).send();
}