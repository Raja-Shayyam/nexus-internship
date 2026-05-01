import express from 'express';
import { collaborationController } from '../controllers/collaborationController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', collaborationController.createRequest);
router.get('/', collaborationController.getMyRequests);
router.get('/:requestId', collaborationController.getRequestDetail);
router.put('/:requestId/accept', collaborationController.acceptRequest);
router.put('/:requestId/reject', collaborationController.rejectRequest);
router.put('/:requestId/cancel', collaborationController.cancelRequest);

export default router;
