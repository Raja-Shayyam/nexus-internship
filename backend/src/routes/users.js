import { Router } from 'express';
import {
  getProfile,
  getAllUsers,
  updateProfile,
  searchUsers,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', getAllUsers);
router.get('/search', searchUsers);
router.get('/:id', getProfile);
router.patch('/update', updateProfile);

export default router;