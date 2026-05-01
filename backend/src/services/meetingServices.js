import Meeting from '../models/Meeting.js';
import { User } from '../models/User.js';
import { ValidationError, NotFoundError, ConflictError, AppError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class MeetingService {
  async createMeeting(initiatorId, participantId, meetingData) {
    try {
      const initiator = await User.findById(initiatorId);
      const participant = await User.findById(participantId);
      if (!initiator || !participant) throw new NotFoundError('User');

      const hasConflict = await this._checkConflictForUser(
        participantId,
        meetingData.startTime,
        meetingData.endTime
      );
      if (hasConflict) throw new ConflictError('Participant has a conflict at the requested time');

      const meeting = new Meeting({
        ...meetingData,
        initiatorId,
        participantId,
        roomId: this._generateRoomId(),
      });

      await meeting.save();
      logger.info(`Meeting created: ${meeting._id}`);
      return await meeting.populate(['initiatorId', 'participantId']);
    } catch (error) {
      logger.error(`Create meeting error: ${error.message}`);
      throw error;
    }
  }

  async acceptMeeting(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting');

    if (meeting.participantId.toString() !== userId) {
      throw new AppError(403, 'Only the participant can accept this meeting');
    }
    if (meeting.status !== 'pending') {
      throw new ValidationError('Meeting is not in pending status');
    }

    meeting.status = 'accepted';
    await meeting.save();
    logger.info(`Meeting accepted: ${meetingId}`);
    return await meeting.populate(['initiatorId', 'participantId']);
  }

  async rejectMeeting(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting');

    if (meeting.participantId.toString() !== userId) {
      throw new AppError(403, 'Only the participant can reject this meeting');
    }
    if (meeting.status !== 'pending') {
      throw new ValidationError('Meeting is not in pending status');
    }

    meeting.status = 'rejected';
    await meeting.save();
    logger.info(`Meeting rejected: ${meetingId}`);
    return await meeting.populate(['initiatorId', 'participantId']);
  }

  async getUserCalendar(userId, month, year) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const meetings = await Meeting.find({
      $or: [{ initiatorId: userId }, { participantId: userId }],
      startTime: { $gte: startDate, $lte: endDate },
      status: { $ne: 'rejected' },
    })
      .populate(['initiatorId', 'participantId'])
      .sort({ startTime: 1 });

    logger.info(`Calendar retrieved for user: ${userId}`);
    return meetings;
  }

  async getUpcomingMeetings(userId, limit = 10) {
    const meetings = await Meeting.find({
      $or: [{ initiatorId: userId }, { participantId: userId }],
      status: { $in: ['pending', 'accepted'] },
      startTime: { $gt: new Date() },
    })
      .populate(['initiatorId', 'participantId'])
      .sort({ startTime: 1 })
      .limit(limit);
    return meetings;
  }

  async getMeetingById(meetingId) {
    const meeting = await Meeting.findById(meetingId).populate(['initiatorId', 'participantId']);
    if (!meeting) throw new NotFoundError('Meeting');
    return meeting;
  }

  async cancelMeeting(meetingId, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting');

    if (meeting.initiatorId.toString() !== userId) {
      throw new AppError(403, 'Only initiator can cancel this meeting');
    }
    if (meeting.status === 'completed' || meeting.status === 'rejected') {
      throw new ValidationError('Cannot cancel this meeting');
    }

    meeting.status = 'cancelled';
    await meeting.save();
    logger.info(`Meeting cancelled: ${meetingId}`);
    return meeting;
  }

  async updateMeetingNotes(meetingId, notes, userId) {
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) throw new NotFoundError('Meeting');

    if (
      meeting.initiatorId.toString() !== userId &&
      meeting.participantId.toString() !== userId
    ) {
      throw new AppError(403, 'Unauthorized to update meeting notes');
    }

    meeting.meetingNotes = notes;
    await meeting.save();
    logger.info(`Meeting notes updated: ${meetingId}`);
    return meeting;
  }

  // Private helpers
  async _checkConflictForUser(userId, startTime, endTime) {
    const conflict = await Meeting.findOne({
      $or: [{ initiatorId: userId }, { participantId: userId }],
      status: { $in: ['pending', 'accepted'] },
      $or: [{ startTime: { $lt: endTime }, endTime: { $gt: startTime } }],
    });
    return !!conflict;
  }

  _generateRoomId() {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default new MeetingService();