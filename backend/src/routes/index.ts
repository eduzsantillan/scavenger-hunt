import { Router } from 'express';
import uploadRoutes from './upload.routes';
import seedRoutes from './seed.routes';
import userRoutes from './user.routes';
import teamRoutes from './team.routes';
import categoryRoutes from './category.routes';
import itemRoutes from './item.routes';

const router = Router();

// Simple test endpoint to verify routing
router.get('/test', (req, res) => {
  console.log('Main router test endpoint reached');
  return res.status(200).json({
    message: 'API is working correctly',
    timestamp: new Date().toISOString()
  });
});

router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/categories', categoryRoutes);
router.use('/upload', uploadRoutes);
router.use('/seed', seedRoutes);
router.use('/items', itemRoutes)

export { router };
