import { Router } from 'express';
import {
  createMeeting,
  acceptMeeting,
  rejectMeeting,
  getCalendar,
  getUpcomingMeetings,
  getMeeting,
  cancelMeeting,
  updateMeetingNotes,
  validateCreateMeeting,
} from '../controllers/meetingController.js';
import { authenticate } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.post('/', validateCreateMeeting, validateRequest, createMeeting);
router.get('/calendar', getCalendar);
router.get('/upcoming', getUpcomingMeetings);
router.get('/:meetingId', getMeeting);
router.patch('/:meetingId/accept', acceptMeeting);
router.patch('/:meetingId/reject', rejectMeeting);
router.patch('/:meetingId/cancel', cancelMeeting);
router.patch('/:meetingId/notes', updateMeetingNotes);

export default router;