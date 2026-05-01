import express from 'express';
import { messageController } from '../controllers/messageController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', messageController.sendMessage);
router.get('/history', messageController.getMessageHistory);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:userId/conversation', messageController.getConversation);
router.put('/:messageId/read', messageController.markAsRead);

export default router;
