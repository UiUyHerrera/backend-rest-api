import { Request, Response } from 'express';
import { getStats } from '../services/statsService';

export async function stats(req: Request, res: Response) {
  res.json(await getStats());
}