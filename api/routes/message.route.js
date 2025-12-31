import express from 'express';
import {
  sendMessage,
  getConversations,
  getMessages,
  markAsRead,
  deleteMessage,
  getUnreadCount,
  getOnlineStatus,
  getFollowingForMessaging,
  addReaction,
  editMessage,
  getMessageReactions
} from '../controllers/message.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Send message (text or media with Firebase URL)
router.post('/send', verifyToken, sendMessage);

// Get conversations
router.get('/conversations', verifyToken, getConversations);

// Get messages with a user
router.get('/:userId', verifyToken, getMessages);

// Mark messages as read
router.put('/mark-read', verifyToken, markAsRead);

// Delete a message
router.delete('/:messageId', verifyToken, deleteMessage);

// Get unread message count
router.get('/unread/count', verifyToken, getUnreadCount);

// Get online status of users
router.post('/online-status', verifyToken, getOnlineStatus);

// Get following users for messaging
router.get('/following/messaging', verifyToken, getFollowingForMessaging);

// Add/remove reaction to message
router.post('/:messageId/reactions', verifyToken, addReaction);

// Edit message
router.put('/:messageId', verifyToken, editMessage);

// Get message reactions
router.get('/:messageId/reactions', verifyToken, getMessageReactions);

export default router;