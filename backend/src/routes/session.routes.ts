import { Router } from 'express';
import { SessionController } from '../controllers/session.controller';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validate-request';

const router = Router();
const sessionController = new SessionController();

router.post(
  '/',
  [
    body('email').isEmail().notEmpty(),
    body('themeId').isString().notEmpty()
  ],
  validateRequest,
  sessionController.startSession
);

export default router;
