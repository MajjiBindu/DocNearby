import { Notification } from '../models/Notification.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/response.js';

/**
 * @desc Get all notifications for logged-in user
 * @route GET /api/notifications
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const notifications = await Notification.find({ userId: req.user.userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Notification.countDocuments({ userId: req.user.userId });
  const pages = Math.ceil(total / limit);

  return sendResponse(res, 200, "Notifications fetched", { 
    notifications, 
    pagination: { page, limit, total, pages } 
  });
});

/**
 * @desc Get unread notification count
 * @route GET /api/notifications/unread/count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user.userId, isRead: false });
  return sendResponse(res, 200, "Unread count fetched", { count });
});

/**
 * @desc Mark a specific notification as read
 * @route PATCH /api/notifications/:id/read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.user.userId },
    { isRead: true },
    { new: true }
  );
  return sendResponse(res, 200, "Notification marked as read", { notification });
});

/**
 * @desc Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user.userId, isRead: false },
    { isRead: true }
  );
  return sendResponse(res, 200, "All notifications marked as read");
});
