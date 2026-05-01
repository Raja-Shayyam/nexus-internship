import Message from '../models/Message.js';
import { getPaginationParams, getResponseMeta } from '../utils/helpers.js';

export const messageController = {
  sendMessage: async (req, res, next) => {
    try {
      const { recipientId, content, attachments } = req.body;
      const senderId = req.userId;

      if (!recipientId || !content) {
        return res.status(400).json({ error: 'Recipient ID and content are required' });
      }

      const message = new Message({
        senderId,
        recipientId,
        content,
        attachments: attachments || [],
      });

      await message.save();
      await message.populate('senderId', 'firstName lastName profileImage');
      await message.populate('recipientId', 'firstName lastName profileImage');

      res.status(201).json({ success: true, message });
    } catch (error) {
      next(error);
    }
  },

  getConversation: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const currentUserId = req.userId;
      const { page, limit, skip } = getPaginationParams(req.query);

      const messages = await Message.find({
        $or: [
          { senderId: currentUserId, recipientId: userId },
          { senderId: userId, recipientId: currentUserId },
        ],
      })
        .populate('senderId', 'firstName lastName profileImage')
        .populate('recipientId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Message.countDocuments({
        $or: [
          { senderId: currentUserId, recipientId: userId },
          { senderId: userId, recipientId: currentUserId },
        ],
      });

      res.json({
        success: true,
        messages: messages.reverse(),
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const { messageId } = req.params;

      const message = await Message.findByIdAndUpdate(
        messageId,
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );

      res.json({ success: true, message });
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const currentUserId = req.userId;

      const unreadCount = await Message.countDocuments({
        recipientId: currentUserId,
        isRead: false,
      });

      res.json({ success: true, unreadCount });
    } catch (error) {
      next(error);
    }
  },

  getMessageHistory: async (req, res, next) => {
    try {
      const currentUserId = req.userId;
      const { page, limit, skip } = getPaginationParams(req.query);

      const messages = await Message.find({
        $or: [{ senderId: currentUserId }, { recipientId: currentUserId }],
      })
        .populate('senderId', 'firstName lastName profileImage email')
        .populate('recipientId', 'firstName lastName profileImage email')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Message.countDocuments({
        $or: [{ senderId: currentUserId }, { recipientId: currentUserId }],
      });

      res.json({
        success: true,
        messages,
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },
};

export default messageController;
