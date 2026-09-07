import { Router } from 'express';
import * as productController from '../controllers/productController';
import { authRequired } from '../middlewares/authMiddleware';
import { adminRequired } from '../middlewares/adminMiddleware';
import { validate } from '../middlewares/validate';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  productListSchema,
} from '../schemas/productSchema';
import { asyncHandler } from '../lib/asyncHandler';

const router = Router();

router.get('/', validate(productListSchema, 'query'), asyncHandler(productController.listProducts));
router.get('/:id', validate(productIdSchema, 'params'), asyncHandler(productController.getProduct));
router.post(
  '/',
  authRequired,
  adminRequired,
  validate(createProductSchema),
  asyncHandler(productController.createProduct)
);
router.patch(
  '/:id',
  authRequired,
  adminRequired,
  validate(productIdSchema, 'params'),
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct)
);
router.delete(
  '/:id',
  authRequired,
  adminRequired,
  validate(productIdSchema, 'params'),
  asyncHandler(productController.deleteProduct)
);

export default router;