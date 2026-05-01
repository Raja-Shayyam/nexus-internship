import { body, param, query } from 'express-validator';
import meetingService from '../services/meetingService.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../utils/constants.js';

export const validateCreateMeeting = [
  body('participantId').isMongoId().withMessage('Valid participant ID required'),
  body('title').trim().notEmpty().withMessage('Meeting title is required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').isISO8601().withMessage('Valid end time required'),
  body('meetingType')
    .isIn(['video_call', 'discussion', 'pitch', 'negotiation'])
    .withMessage('Valid meeting type required'),
];

export const createMeeting = asyncHandler(async (req, res) => {
  const { participantId, title, description, startTime, endTime, meetingType } = req.body;
  const meeting = await meetingService.createMeeting(req.user.id, participantId, {
    title,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    meetingType,
  });
  return sendSuccess(res, HTTP_STATUS.CREATED, 'Meeting scheduled', meeting);
});

export const acceptMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await meetingService.acceptMeeting(meetingId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Meeting accepted', meeting);
});

export const rejectMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await meetingService.rejectMeeting(meetingId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Meeting rejected', meeting);
});

export const getCalendar = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const now = new Date();
  const m = month ? parseInt(month) : now.getMonth();
  const y = year ? parseInt(year) : now.getFullYear();
  const meetings = await meetingService.getUserCalendar(req.user.id, m, y);
  return sendSuccess(res, HTTP_STATUS.OK, 'Calendar retrieved', meetings);
});

export const getUpcomingMeetings = asyncHandler(async (req, res) => {
  const meetings = await meetingService.getUpcomingMeetings(req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Upcoming meetings', meetings);
});

export const getMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await meetingService.getMeetingById(meetingId);
  return sendSuccess(res, HTTP_STATUS.OK, 'Meeting details', meeting);
});

export const cancelMeeting = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const meeting = await meetingService.cancelMeeting(meetingId, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Meeting cancelled', meeting);
});

export const updateMeetingNotes = asyncHandler(async (req, res) => {
  const { meetingId } = req.params;
  const { notes } = req.body;
  const meeting = await meetingService.updateMeetingNotes(meetingId, notes, req.user.id);
  return sendSuccess(res, HTTP_STATUS.OK, 'Notes updated', meeting);
});