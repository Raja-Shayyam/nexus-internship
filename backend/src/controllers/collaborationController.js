import CollaborationRequest from '../models/CollaborationRequest.js';
import { getPaginationParams, getResponseMeta } from '../utils/helpers.js';
import { COLLABORATION_STATUS } from '../config/constants.js';
import { notificationService } from '../services/notificationService.js';

export const collaborationController = {
  createRequest: async (req, res, next) => {
    try {
      const { recipientId, title, description, collaborationType, message } = req.body;
      const initiatorId = req.userId;

      if (!recipientId || !title || !description || !collaborationType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const collaborationRequest = new CollaborationRequest({
        initiatorId,
        recipientId,
        title,
        description,
        collaborationType,
        message: message || '',
      });

      await collaborationRequest.save();
      await collaborationRequest.populate('initiatorId', 'firstName lastName profileImage');
      await collaborationRequest.populate('recipientId', 'firstName lastName profileImage');

      // Create notification
      await notificationService.createNotification(
        recipientId,
        'collaboration_request',
        `New ${collaborationType} request from ${req.user.email}`,
        `${title}: ${description}`,
        { relatedCollaborationId: collaborationRequest._id }
      );

      res.status(201).json({ success: true, collaborationRequest });
    } catch (error) {
      next(error);
    }
  },

  getMyRequests: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { page, limit, skip } = getPaginationParams(req.query);
      const status = req.query.status;

      const query = {
        $or: [{ initiatorId: userId }, { recipientId: userId }],
      };

      if (status) {
        query.status = status;
      }

      const requests = await CollaborationRequest.find(query)
        .populate('initiatorId', 'firstName lastName profileImage')
        .populate('recipientId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await CollaborationRequest.countDocuments(query);

      res.json({
        success: true,
        requests,
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },

  acceptRequest: async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const userId = req.userId;

      const collaborationRequest = await CollaborationRequest.findById(requestId);
      if (!collaborationRequest) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (collaborationRequest.recipientId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to accept this request' });
      }

      collaborationRequest.status = COLLABORATION_STATUS.ACCEPTED;
      collaborationRequest.acceptedAt = new Date();
      await collaborationRequest.save();

      // Create notification for initiator
      await notificationService.createNotification(
        collaborationRequest.initiatorId,
        'collaboration_request',
        'Collaboration request accepted',
        `Your ${collaborationRequest.collaborationType} request has been accepted`,
        { relatedCollaborationId: collaborationRequest._id }
      );

      res.json({ success: true, collaborationRequest });
    } catch (error) {
      next(error);
    }
  },

  rejectRequest: async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const { rejectionReason } = req.body;
      const userId = req.userId;

      const collaborationRequest = await CollaborationRequest.findById(requestId);
      if (!collaborationRequest) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (collaborationRequest.recipientId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to reject this request' });
      }

      collaborationRequest.status = COLLABORATION_STATUS.REJECTED;
      collaborationRequest.rejectionReason = rejectionReason || '';
      collaborationRequest.rejectedAt = new Date();
      await collaborationRequest.save();

      res.json({ success: true, collaborationRequest });
    } catch (error) {
      next(error);
    }
  },

  cancelRequest: async (req, res, next) => {
    try {
      const { requestId } = req.params;
      const userId = req.userId;

      const collaborationRequest = await CollaborationRequest.findById(requestId);
      if (!collaborationRequest) {
        return res.status(404).json({ error: 'Request not found' });
      }

      if (collaborationRequest.initiatorId.toString() !== userId) {
        return res.status(403).json({ error: 'Not authorized to cancel this request' });
      }

      collaborationRequest.status = COLLABORATION_STATUS.CANCELLED;
      await collaborationRequest.save();

      res.json({ success: true, collaborationRequest });
    } catch (error) {
      next(error);
    }
  },

  getRequestDetail: async (req, res, next) => {
    try {
      const { requestId } = req.params;

      const collaborationRequest = await CollaborationRequest.findById(requestId)
        .populate('initiatorId', 'firstName lastName profileImage bio')
        .populate('recipientId', 'firstName lastName profileImage bio');

      if (!collaborationRequest) {
        return res.status(404).json({ error: 'Request not found' });
      }

      res.json({ success: true, collaborationRequest });
    } catch (error) {
      next(error);
    }
  },
};

export default collaborationController;
