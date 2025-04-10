import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request';

const router = Router();
const userController = new UserController();

router.post(
  '/',
  [
    body('name').isString().notEmpty(),
    body('email').isEmail().notEmpty()
  ],
  validateRequest,
  userController.createUser
);

router.get(
  '/id/:userId',
  userController.getUserById
);

router.get(
  '/email/:email',
  userController.getUserByEmail
);

export default router;
