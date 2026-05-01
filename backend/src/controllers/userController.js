import userService from '../services/userService.js';
import { sendSuccess, sendError } from '../utils/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS, SUCCESS_MESSAGES } from '../utils/constants.js';

export const getProfile = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.user?.id;
  const user = await userService.getUserById(userId);
  return sendSuccess(res, HTTP_STATUS.OK, 'Profile fetched', user);
});

export const getAllUsers = asyncHandler(async (req, res) => {
  const { role } = req.query;
  const users = await userService.getAllUsers(role);
  return sendSuccess(res, HTTP_STATUS.OK, 'Users fetched', users);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  return sendSuccess(res, HTTP_STATUS.OK, SUCCESS_MESSAGES.PROFILE_UPDATE_SUCCESS, user);
});

export const searchUsers = asyncHandler(async (req, res) => {
  const { q, role } = req.query;
  if (!q) return sendError(res, 400, 'Search query is required');
  const users = await userService.searchUsers(q, role);
  return sendSuccess(res, HTTP_STATUS.OK, 'Search results', users);
});