import jwt from 'jsonwebtoken';
import { config } from './config';
import { HttpError } from './httpError';

export function signToken(userId: string) {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string) {
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (typeof payload === 'string') {
      throw new Error('invalid token');
    }
    return payload as { userId: string };
  } catch {
    throw new HttpError(401, 'Invalid or expired token');
  }
}