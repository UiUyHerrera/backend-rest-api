import { Router } from 'express';
import * as orderController from '../controllers/orderController';
import { authRequired } from '../middlewares/authMiddleware';
import { validate } from '../middlewares/validate';
import { createOrderSchema, orderIdSchema, orderListSchema } from '../schemas/orderSchema';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get('/', authRequired, validate(orderListSchema, 'query'), asyncHandler(orderController.listOrders));
router.get('/:id', authRequired, validate(orderIdSchema, 'params'), asyncHandler(orderController.getOrder));
router.post('/', authRequired, validate(createOrderSchema), asyncHandler(orderController.createOrder));
router.patch('/:id/cancel', authRequired, validate(orderIdSchema, 'params'), asyncHandler(orderController.cancelOrder));

export default router;