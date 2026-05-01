import Notification from '../models/Notification.js';
import { logger } from '../utils/logger.js';

export const notificationService = {
  createNotification: async (userId, type, title, message, relatedData = {}) => {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        ...relatedData,
      });

      await notification.save();
      logger.info('Notification created', {
        userId,
        type,
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification', error.message);
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    try {
      return await Notification.findByIdAndUpdate(
        notificationId,
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );
    } catch (error) {
      logger.error('Error marking notification as read', error.message);
      throw error;
    }
  },

  getUserNotifications: async (userId, limit = 10) => {
    try {
      return await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('relatedUserId', 'firstName lastName profileImage')
        .populate('relatedDealId', 'title')
        .populate('relatedCollaborationId', 'title');
    } catch (error) {
      logger.error('Error fetching notifications', error.message);
      throw error;
    }
  },
};

export default notificationService;
