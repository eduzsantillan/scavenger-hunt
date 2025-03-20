import { Router } from 'express';
import themeRoutes from './theme.routes';
import itemRoutes from './item.routes';
import sessionRoutes from './session.routes';
import uploadRoutes from './upload.routes';
import seedRoutes from './seed.routes';

const router = Router();

router.use('/themes', themeRoutes);
router.use('/items', itemRoutes);
router.use('/session', sessionRoutes);
router.use('/upload', uploadRoutes);
router.use('/seed', seedRoutes);

export { router };
