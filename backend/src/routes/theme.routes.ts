import { Router } from 'express';
import { ThemeController } from '../controllers/theme.controller';

const router = Router();
const themeController = new ThemeController();

router.get('/', themeController.getAllThemes);

export default router;
