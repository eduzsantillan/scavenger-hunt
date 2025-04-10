import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request';

const router = Router();
const categoryController = new CategoryController();

router.get(
  '/',
  categoryController.listCategories
);

router.get(
  '/:categoryId',
  [
    param('categoryId').isString().notEmpty()
  ],
  validateRequest,
  categoryController.getCategoryById
);

export default router;
