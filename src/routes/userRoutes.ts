import { Router } from 'express';
import * as userController from '../controllers/userController';
import { authRequired } from '../middlewares/authMiddleware';
import { adminRequired } from '../middlewares/adminMiddleware';
import { validate } from '../middlewares/validate';
import { userIdSchema, updateUserSchema } from '../schemas/userSchema';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get('/', authRequired, adminRequired, asyncHandler(userController.listUsers));
router.get('/:id', authRequired, validate(userIdSchema, 'params'), asyncHandler(userController.getUser));
router.patch(
  '/:id',
  authRequired,
  validate(userIdSchema, 'params'),
  validate(updateUserSchema),
  asyncHandler(userController.updateUser)
);
router.delete('/:id', authRequired, validate(userIdSchema, 'params'), asyncHandler(userController.deleteUser));

export default router;