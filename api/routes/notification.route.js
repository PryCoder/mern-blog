import express from 'express';
import { verifyToken } from '../utils/verifyUser.js';
import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.get('/unread-count', verifyToken, getUnreadCount);
router.put('/mark-all-read', verifyToken, markAllAsRead);
router.put('/:notificationId/mark-read', verifyToken, markAsRead);

export default router;
