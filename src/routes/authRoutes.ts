import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middlewares/validate';
import { authRequired } from '../middlewares/authMiddleware';
import { registerSchema, loginSchema } from '../schemas/authSchema';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(authController.register));
router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authRequired, asyncHandler(authController.me));

export default router;