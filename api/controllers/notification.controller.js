import Notification from '../models/notification.model.js';
import { errorHandler } from '../utils/error.js';

export const getNotifications = async (req, res, next) => {
  try {
    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit)
      .populate('actorId', 'username profilePicture');

    const total = await Notification.countDocuments({ userId: req.user.id });
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });

    res.status(200).json({ notifications, total, unreadCount });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({ userId: req.user.id, isRead: false });
    res.status(200).json({ unreadCount });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) return next(errorHandler(404, 'Notification not found'));

    if (notification.userId.toString() !== req.user.id) {
      return next(errorHandler(403, 'You are not allowed to update this notification'));
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
