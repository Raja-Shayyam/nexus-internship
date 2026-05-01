import Notification from '../models/Notification.js';
import { getPaginationParams, getResponseMeta } from '../utils/helpers.js';

export const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const currentUserId = req.userId;
      const { page, limit, skip } = getPaginationParams(req.query);

      const notifications = await Notification.find({ userId: currentUserId })
        .populate('relatedUserId', 'firstName lastName profileImage')
        .populate('relatedDealId', 'title')
        .populate('relatedCollaborationId', 'title')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Notification.countDocuments({ userId: currentUserId });

      res.json({
        success: true,
        notifications,
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const { notificationId } = req.params;

      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );

      res.json({ success: true, notification });
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const currentUserId = req.userId;

      await Notification.updateMany(
        { userId: currentUserId, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
      next(error);
    }
  },

  deleteNotification: async (req, res, next) => {
    try {
      const { notificationId } = req.params;
      const currentUserId = req.userId;

      const notification = await Notification.findById(notificationId);
      if (!notification || notification.userId.toString() !== currentUserId) {
        return res.status(403).json({ error: 'Not authorized to delete this notification' });
      }

      await Notification.findByIdAndDelete(notificationId);

      res.json({ success: true, message: 'Notification deleted' });
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const currentUserId = req.userId;

      const unreadCount = await Notification.countDocuments({
        userId: currentUserId,
        isRead: false,
      });

      res.json({ success: true, unreadCount });
    } catch (error) {
      next(error);
    }
  },
};

export default notificationController;
