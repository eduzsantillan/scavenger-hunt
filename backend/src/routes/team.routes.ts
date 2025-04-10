import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validate-request';

const router = Router();
const teamController = new TeamController();

router.post(
  '/',
  [
    body('name').isString().notEmpty(),
    body('userId').isString().notEmpty(),
    body('categoryId').isString().notEmpty()
  ],
  validateRequest,
  teamController.createTeam
);

router.get(
  '/',
  teamController.listTeams
);

router.put(
  '/join',
  [
    body('userId').isString().notEmpty(),
    body('teamId').isString().notEmpty()
  ],
  validateRequest,
  teamController.joinTeam
);

router.get(
  '/:teamId/items',
  [
    param('teamId').isString().notEmpty()
  ],
  validateRequest,
  teamController.getTeamItems
);

router.get(
  '/user-teams/:userId',
  [
    param('userId').isString().notEmpty()
  ],
  validateRequest,
  teamController.getTeamsByUserId
);

export default router;
