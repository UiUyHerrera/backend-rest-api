import { Router } from 'express';
import { stats } from '../controllers/statsController';
import { authRequired } from '../middlewares/authMiddleware';
import { adminRequired } from '../middlewares/adminMiddleware';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get('/', authRequired, adminRequired, asyncHandler(stats));

export default router;