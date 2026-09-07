import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { HttpError } from '../lib/httpError';
import { config } from '../lib/config';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ error: 'That value is already in use' });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(409).json({ error: 'Cannot complete the operation because of an existing relationship' });
      return;
    }
  }

  if (config.nodeEnv !== 'production') {
    console.error(err);
  }

  res.status(500).json({ error: 'Something went wrong' });
}