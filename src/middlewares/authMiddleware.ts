import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../lib/jwt';
import { HttpError } from '../lib/httpError';

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Authentication required');
    }
    const token = header.split(' ')[1];
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      throw new HttpError(401, 'Invalid or expired token');
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}