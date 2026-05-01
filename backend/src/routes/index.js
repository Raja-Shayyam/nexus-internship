import { Router } from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import meetingRoutes from './meetings.js';
import documentRoutes from './documents.js';
import paymentRoutes from './payments.js';

const router = Router();

router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/meetings', meetingRoutes);
router.use('/api/documents', documentRoutes);
router.use('/api/payments', paymentRoutes);

router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

export default router;