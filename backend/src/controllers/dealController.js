import Deal from '../models/Deal.js';
import { getPaginationParams, getResponseMeta } from '../utils/helpers.js';
import { DEAL_STATUS } from '../config/constants.js';

export const dealController = {
  createDeal: async (req, res, next) => {
    try {
      const { investorId, title, description, fundingAmount, currency, equityPercentage } =
        req.body;
      const entrepreneurId = req.userId;

      if (!investorId || !title || !description || !fundingAmount) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const deal = new Deal({
        entrepreneurId,
        investorId,
        title,
        description,
        fundingAmount,
        currency: currency || 'USD',
        equityPercentage: equityPercentage || 0,
      });

      await deal.save();
      await deal.populate('entrepreneurId', 'firstName lastName profileImage companyName');
      await deal.populate('investorId', 'firstName lastName profileImage');

      res.status(201).json({ success: true, deal });
    } catch (error) {
      next(error);
    }
  },

  getDealDetail: async (req, res, next) => {
    try {
      const { dealId } = req.params;

      const deal = await Deal.findById(dealId)
        .populate('entrepreneurId', 'firstName lastName profileImage companyName')
        .populate('investorId', 'firstName lastName profileImage')
        .populate('comments.userId', 'firstName lastName profileImage');

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      res.json({ success: true, deal });
    } catch (error) {
      next(error);
    }
  },

  getMyDeals: async (req, res, next) => {
    try {
      const userId = req.userId;
      const { page, limit, skip } = getPaginationParams(req.query);
      const status = req.query.status;

      const query = {
        $or: [{ entrepreneurId: userId }, { investorId: userId }],
      };

      if (status) {
        query.status = status;
      }

      const deals = await Deal.find(query)
        .populate('entrepreneurId', 'firstName lastName profileImage companyName')
        .populate('investorId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Deal.countDocuments(query);

      res.json({
        success: true,
        deals,
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },

  updateDealStatus: async (req, res, next) => {
    try {
      const { dealId } = req.params;
      const { status } = req.body;
      const userId = req.userId;

      if (!Object.values(DEAL_STATUS).includes(status)) {
        return res.status(400).json({ error: 'Invalid deal status' });
      }

      const deal = await Deal.findById(dealId);
      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' });
      }

      if (
        deal.entrepreneurId.toString() !== userId &&
        deal.investorId.toString() !== userId
      ) {
        return res.status(403).json({ error: 'Not authorized to update this deal' });
      }

      deal.status = status;

      if (status === DEAL_STATUS.FUNDED) {
        deal.startDate = new Date();
      }

      if (status === DEAL_STATUS.CLOSED) {
        deal.closureDate = new Date();
      }

      await deal.save();

      res.json({ success: true, deal });
    } catch (error) {
      next(error);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const { dealId } = req.params;
      const { text } = req.body;
      const userId = req.userId;

      if (!text || text.trim() === '') {
        return res.status(400).json({ error: 'Comment text is required' });
      }

      const deal = await Deal.findByIdAndUpdate(
        dealId,
        {
          $push: {
            comments: {
              userId,
              text,
              createdAt: new Date(),
            },
          },
        },
        { new: true }
      )
        .populate('comments.userId', 'firstName lastName profileImage')
        .populate('entrepreneurId', 'firstName lastName profileImage')
        .populate('investorId', 'firstName lastName profileImage');

      res.json({ success: true, deal });
    } catch (error) {
      next(error);
    }
  },

  uploadDocument: async (req, res, next) => {
    try {
      const { dealId } = req.params;
      const { filename, url, type } = req.body;

      if (!filename || !url || !type) {
        return res.status(400).json({ error: 'Missing document information' });
      }

      const deal = await Deal.findByIdAndUpdate(
        dealId,
        {
          $push: {
            documents: {
              filename,
              url,
              type,
              uploadedAt: new Date(),
            },
          },
        },
        { new: true }
      );

      res.json({ success: true, deal });
    } catch (error) {
      next(error);
    }
  },

  getAllDeals: async (req, res, next) => {
    try {
      const { page, limit, skip } = getPaginationParams(req.query);
      const status = req.query.status;

      const query = {};
      if (status) {
        query.status = status;
      }

      const deals = await Deal.find(query)
        .populate('entrepreneurId', 'firstName lastName profileImage companyName')
        .populate('investorId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Deal.countDocuments(query);

      res.json({
        success: true,
        deals,
        meta: getResponseMeta(page, limit, total),
      });
    } catch (error) {
      next(error);
    }
  },
};

export default dealController;
