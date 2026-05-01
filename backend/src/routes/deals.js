import express from 'express';
import { dealController } from '../controllers/dealController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', dealController.createDeal);
router.get('/', dealController.getAllDeals);
router.get('/my-deals', dealController.getMyDeals);
router.get('/:dealId', dealController.getDealDetail);
router.put('/:dealId/status', dealController.updateDealStatus);
router.post('/:dealId/comments', dealController.addComment);
router.post('/:dealId/documents', dealController.uploadDocument);

export default router;
