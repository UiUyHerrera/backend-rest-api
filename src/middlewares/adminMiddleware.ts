import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../lib/httpError';

export function adminRequired(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    next(new HttpError(403, 'Admin access required'));
    return;
  }
  next();
}