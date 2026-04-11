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
  getMessageReactions,
  createGroupConversation,
  getConversationMessages,
  markConversationRead
} from '../controllers/message.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

// Send message (text or media with Firebase URL)
router.post('/send', verifyToken, sendMessage);

// Get conversations
router.get('/conversations', verifyToken, getConversations);

// Create group conversation
router.post('/conversations/group', verifyToken, createGroupConversation);

// Get messages for a conversation (group or 1:1)
router.get('/conversations/:conversationId/messages', verifyToken, getConversationMessages);

// Mark conversation read
router.put('/conversations/:conversationId/mark-read', verifyToken, markConversationRead);

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
router.post('/message/:messageId/reactions', verifyToken, addReaction);

// Edit message
router.put('/message/:messageId', verifyToken, editMessage);

// Get message reactions
router.get('/message/:messageId/reactions', verifyToken, getMessageReactions);

// Delete a message
router.delete('/message/:messageId', verifyToken, deleteMessage);

// Get messages with a user (1:1)
router.get('/user/:userId', verifyToken, getMessages);

export default router;