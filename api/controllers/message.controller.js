import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.model.js';
import { errorHandler } from '../utils/error.js';
import { emitToUser, emitToConversation } from '../utils/socketEmit.js';
import Notification from '../models/notification.model.js';

// Check if user can message another user
const canMessageUser = async (senderId, receiverId) => {
  try {
    // Default behavior: allow messaging unless explicitly restricted.
    // Set REQUIRE_FOLLOW_FOR_MESSAGES=true to enforce follow/follower-only messaging.
    if (String(process.env.REQUIRE_FOLLOW_FOR_MESSAGES || '').toLowerCase() !== 'true') {
      return true;
    }

    const sender = await User.findById(senderId).select('followers following').lean();
    const receiver = await User.findById(receiverId).select('_id').lean();

    if (!sender || !receiver) return false;

    const receiverIdStr = receiverId?.toString();
    if (!receiverIdStr) return false;

    // Check if users follow each other
    const isFollowing = Array.isArray(sender.following) && sender.following.some((id) => id.toString() === receiverIdStr);
    const isFollower = Array.isArray(sender.followers) && sender.followers.some((id) => id.toString() === receiverIdStr);
    
    return isFollowing || isFollower;
  } catch (error) {
    console.error('Error in canMessageUser:', error);
    return false;
  }
};

// Send a message (handles both text and media from frontend Firebase URL)
export const sendMessage = async (req, res, next) => {
  try {
    const { receiverId, conversationId, content, imageUrl, messageType, replyTo, fileName, fileSize, fileType } = req.body;
    const senderId = req.user.id;

    // Validate input - either content or imageUrl must be provided
    if ((!receiverId && !conversationId) || (!content?.trim() && !imageUrl)) {
      return next(errorHandler(400, 'receiverId or conversationId is required, and content or imageUrl must be provided'));
    }

    // Group conversation send
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId).lean();
      if (!conversation) return next(errorHandler(404, 'Conversation not found'));

      const isParticipant = Array.isArray(conversation.participants) && conversation.participants.some((p) => p.toString() === senderId.toString());
      if (!isParticipant) return next(errorHandler(403, 'You are not a participant of this conversation'));

      const message = new Message({
        conversationId,
        sender: senderId,
        receiver: null,
        content: content?.trim() || '',
        image: imageUrl || null,
        fileName: fileName || null,
        fileSize: typeof fileSize === 'number' ? fileSize : null,
        fileType: fileType || null,
        messageType: messageType || (imageUrl ? 'image' : 'text'),
        replyTo: replyTo || null,
      });

      await message.save();

      // Update conversation
      const convoToUpdate = await Conversation.findById(conversationId);
      convoToUpdate.lastMessage = message._id;
      convoToUpdate.lastMessageAt = Date.now();

      // Ensure unreadCount is usable
      if (!convoToUpdate.unreadCount || typeof convoToUpdate.unreadCount !== 'object') {
        convoToUpdate.unreadCount = {};
      }

      // Increment unread count for all other participants
      const participantIds = (convoToUpdate.participants || []).map((p) => p.toString());
      participantIds.forEach((pid) => {
        if (pid !== senderId.toString()) {
          const currentUnread = convoToUpdate.unreadCount[pid] || 0;
          convoToUpdate.unreadCount[pid] = currentUnread + 1;
        }
      });

      await convoToUpdate.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username profilePicture fullName')
        .populate({
          path: 'replyTo',
          populate: {
            path: 'sender',
            select: 'username profilePicture'
          }
        });

      // Emit to conversation room
      emitToConversation(conversationId, 'messageAdded', {
        conversationId,
        message: populatedMessage,
        timestamp: new Date(),
      });

      // Emit to each participant (so their inbox updates even if not in room)
      participantIds.forEach((pid) => {
        if (pid !== senderId.toString()) {
          emitToUser(pid, 'newMessage', {
            conversationId,
            message: populatedMessage,
            unreadCount: convoToUpdate.unreadCount,
            timestamp: new Date(),
          });
        }
      });

      // Lightweight notifications for each participant except sender
      await Promise.all(
        participantIds
          .filter((pid) => pid !== senderId.toString())
          .map((pid) => Notification.create({
            userId: pid,
            actorId: senderId,
            type: 'message',
            title: convoToUpdate.isGroup ? 'New group message' : 'New message',
            body: convoToUpdate.isGroup && convoToUpdate.name
              ? `New message in ${convoToUpdate.name}`
              : 'New message',
            data: {
              conversationId: convoToUpdate._id.toString(),
            },
          }))
      );

      participantIds
        .filter((pid) => pid !== senderId.toString())
        .forEach((pid) => {
          emitToUser(pid, 'conversationUpdated', {
            _id: convoToUpdate._id,
            participants: convoToUpdate.participants,
            lastMessage: populatedMessage,
            lastMessageAt: convoToUpdate.lastMessageAt,
            unreadCount: convoToUpdate.unreadCount,
            isGroup: convoToUpdate.isGroup,
            name: convoToUpdate.name,
            updatedAt: new Date(),
          });
        });

      // Also notify sender inbox
      emitToUser(senderId, 'conversationUpdated', {
        _id: convoToUpdate._id,
        participants: convoToUpdate.participants,
        lastMessage: populatedMessage,
        lastMessageAt: convoToUpdate.lastMessageAt,
        unreadCount: convoToUpdate.unreadCount,
        isGroup: convoToUpdate.isGroup,
        name: convoToUpdate.name,
        updatedAt: new Date(),
      });

      return res.status(201).json({
        success: true,
        message: populatedMessage,
        conversationId: convoToUpdate._id,
      });
    }

    // Check if sender can message receiver
    const canMessage = await canMessageUser(senderId, receiverId);
    if (!canMessage) {
      return next(errorHandler(403, 'You can only message users you follow or who follow you'));
    }

    // Create or find conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
        unreadCount: {}
      });
    }

    // Initialize unreadCount if it doesn't exist
    if (!conversation.unreadCount || typeof conversation.unreadCount !== 'object') {
      conversation.unreadCount = {};
    }

    // Create message
    const message = new Message({
      conversationId: conversation._id,
      sender: senderId,
      receiver: receiverId,
      content: content?.trim() || '',
      image: imageUrl || null,
      fileName: fileName || null,
      fileSize: typeof fileSize === 'number' ? fileSize : null,
      fileType: fileType || null,
      messageType: messageType || (imageUrl ? 'image' : 'text'),
      replyTo: replyTo || null
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = Date.now();
    
    // Update unread count for receiver
    const receiverIdStr = receiverId.toString();
    const currentUnread = conversation.unreadCount[receiverIdStr] || 0;
    conversation.unreadCount[receiverIdStr] = currentUnread + 1;
    
    await conversation.save();

    // Populate message with sender and receiver info
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username profilePicture fullName')
      .populate('receiver', 'username profilePicture fullName')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username profilePicture'
        }
      });

    // Emit socket events
    emitToUser(receiverId, 'newMessage', {
      conversationId: conversation._id,
      message: populatedMessage,
      unreadCount: conversation.unreadCount,
      timestamp: new Date()
    });

    // Persist notification for receiver (bell)
    const notification = await Notification.create({
      userId: receiverId,
      actorId: senderId,
      type: 'message',
      title: 'New message',
      body: `New message from ${populatedMessage.sender?.username || 'someone'}`,
      data: {
        conversationId: conversation._id.toString(),
      },
    });

    emitToUser(receiverId, 'notificationCreated', {
      notification,
      timestamp: new Date(),
    });

    emitToConversation(conversation._id, 'messageAdded', {
      conversationId: conversation._id,
      message: populatedMessage,
      timestamp: new Date()
    });

    // Also emit to sender for immediate update
    emitToUser(senderId, 'conversationUpdated', {
      _id: conversation._id,
      participants: conversation.participants,
      lastMessage: populatedMessage,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation.unreadCount,
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: populatedMessage,
      conversationId: conversation._id
    });
  } catch (error) {
    console.error('Error in sendMessage:', error);
    next(error);
  }
};

// Create a group conversation
export const createGroupConversation = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, participantIds } = req.body;

    const cleanedName = typeof name === 'string' ? name.trim() : '';
    if (!cleanedName) {
      return next(errorHandler(400, 'Group name is required'));
    }

    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      return next(errorHandler(400, 'Select at least 2 members to create a group'));
    }

    const uniqueIds = Array.from(new Set([userId.toString(), ...participantIds.map((id) => id.toString())]));
    if (uniqueIds.length < 3) {
      return next(errorHandler(400, 'Group must include at least 3 participants (including you)'));
    }

    // Validate users exist
    const users = await User.find({ _id: { $in: uniqueIds } }).select('_id');
    if (users.length !== uniqueIds.length) {
      return next(errorHandler(400, 'One or more selected users do not exist'));
    }

    // Optional restriction: only allow adding users you can message (follow/follower)
    // Controlled by REQUIRE_FOLLOW_FOR_MESSAGES=true
    if (String(process.env.REQUIRE_FOLLOW_FOR_MESSAGES || '').toLowerCase() === 'true') {
      const otherIds = uniqueIds.filter((id) => id !== userId.toString());
      for (const otherId of otherIds) {
        const allowed = await canMessageUser(userId, otherId);
        if (!allowed) {
          return next(errorHandler(403, 'You can only add users you follow or who follow you'));
        }
      }
    }

    const conversation = await Conversation.create({
      participants: uniqueIds,
      isGroup: true,
      name: cleanedName,
      createdBy: userId,
      admins: [userId],
      unreadCount: {},
    });

    const populatedConversation = await Conversation.findById(conversation._id)
      .populate({
        path: 'participants',
        select: 'username profilePicture fullName',
      })
      .lean();

    // Notify all invited participants
    uniqueIds
      .filter((id) => id !== userId.toString())
      .forEach((id) => {
        emitToUser(id, 'conversationUpdated', populatedConversation);
      });

    res.status(201).json({
      success: true,
      conversation: populatedConversation,
    });
  } catch (error) {
    console.error('Error in createGroupConversation:', error);
    next(error);
  }
};

// Get messages for a conversation (supports group chats)
export const getConversationMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId).lean();
    if (!conversation) return next(errorHandler(404, 'Conversation not found'));

    const isParticipant = Array.isArray(conversation.participants) && conversation.participants.some((p) => p.toString() === userId.toString());
    if (!isParticipant) return next(errorHandler(403, 'Cannot access these messages'));

    const messages = await Message.find({ conversationId })
      .populate('sender', 'username profilePicture fullName')
      .populate('receiver', 'username profilePicture fullName')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username profilePicture'
        }
      })
      .sort({ createdAt: 1 });

    // Reset unread count for current user
    await Conversation.findByIdAndUpdate(conversationId, {
      $set: {
        [`unreadCount.${userId.toString()}`]: 0,
      },
    });

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getConversationMessages:', error);
    next(error);
  }
};

// Mark a conversation as read (group or 1:1)
export const markConversationRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return next(errorHandler(404, 'Conversation not found'));

    const isParticipant = Array.isArray(conversation.participants) && conversation.participants.some((p) => p.toString() === userId.toString());
    if (!isParticipant) return next(errorHandler(403, 'Cannot modify this conversation'));

    conversation.unreadCount[userId.toString()] = 0;
    await conversation.save();

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in markConversationRead:', error);
    next(error);
  }
};

// Add reaction to message
export const addReaction = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.id;

    if (!emoji) {
      return next(errorHandler(400, 'Emoji is required'));
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return next(errorHandler(404, 'Message not found'));
    }

    // Check if user already reacted with this emoji
    const existingReactionIndex = message.reactions.findIndex(
      reaction => reaction.userId.toString() === userId && reaction.emoji === emoji
    );

    let updatedReactions;
    if (existingReactionIndex !== -1) {
      // Remove reaction if already exists
      message.reactions.splice(existingReactionIndex, 1);
    } else {
      // Add new reaction
      message.reactions.push({ emoji, userId });
    }

    await message.save();

    // Find conversation for socket emission
    const conversation = await Conversation.findOne({
      participants: { $all: [message.sender, message.receiver] }
    });

    if (conversation) {
      emitToConversation(conversation._id, 'messageReaction', {
        messageId: message._id,
        reactions: message.reactions,
        userId: userId,
        emoji: emoji,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Error in addReaction:', error);
    next(error);
  }
};

// Edit message
export const editMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim() === '') {
      return next(errorHandler(400, 'Message content is required'));
    }

    const message = await Message.findById(messageId);
    
    if (!message) {
      return next(errorHandler(404, 'Message not found'));
    }

    // Only sender can edit their message
    if (message.sender.toString() !== userId) {
      return next(errorHandler(403, 'You can only edit your own messages'));
    }

    // Update message
    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = Date.now();

    await message.save();

    // Find conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [message.sender, message.receiver] }
    });

    if (conversation) {
      // Update conversation last message if this is the last message
      if (conversation.lastMessage.toString() === messageId) {
        conversation.lastMessage = message._id;
        await conversation.save();
      }

      // Emit update event
      emitToConversation(conversation._id, 'messageUpdated', {
        messageId: message._id,
        content: message.content,
        isEdited: true,
        editedAt: message.editedAt,
        timestamp: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: {
        _id: message._id,
        content: message.content,
        isEdited: message.isEdited,
        editedAt: message.editedAt
      }
    });
  } catch (error) {
    console.error('Error in editMessage:', error);
    next(error);
  }
};

// Get message reactions
export const getMessageReactions = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId)
      .populate({
        path: 'reactions.userId',
        select: 'username profilePicture'
      });

    if (!message) {
      return next(errorHandler(404, 'Message not found'));
    }

    res.status(200).json({
      success: true,
      reactions: message.reactions
    });
  } catch (error) {
    console.error('Error in getMessageReactions:', error);
    next(error);
  }
};

// The rest of your existing functions remain the same...
// (getConversations, getMessages, markAsRead, deleteMessage, getUnreadCount, getOnlineStatus, getFollowingForMessaging)

// Get conversations for a user
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    })
    .populate({
      path: 'participants',
      match: { _id: { $ne: userId } },
      select: 'username profilePicture fullName'
    })
    .populate({
      path: 'lastMessage',
      select: 'content sender createdAt isRead readAt image messageType',
      populate: {
        path: 'sender',
        select: 'username profilePicture'
      }
    })
    .sort({ lastMessageAt: -1 })
    .lean();

    // Convert unreadCount Map to object if needed
    const formattedConversations = conversations.map(conv => {
      let unreadCount = conv.unreadCount || {};
      
      // If it's a Map, convert to object
      if (unreadCount instanceof Map) {
        unreadCount = Object.fromEntries(unreadCount);
      }
      
      // Ensure it's an object
      if (typeof unreadCount !== 'object') {
        unreadCount = {};
      }
      
      return {
        ...conv,
        unreadCount
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.error('Error in getConversations:', error);
    next(error);
  }
};

// Get messages between two users
export const getMessages = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (!userId) {
      return next(errorHandler(400, 'User ID is required'));
    }

    // Verify users can message each other
    const canMessage = await canMessageUser(currentUserId, userId);
    if (!canMessage) {
      return next(errorHandler(403, 'Cannot access these messages'));
    }

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .populate('sender', 'username profilePicture fullName')
    .populate('receiver', 'username profilePicture fullName')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'username profilePicture'
      }
    })
    .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      {
        sender: userId,
        receiver: currentUserId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: Date.now() }
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, userId] }
    });

    if (conversation) {
      // Reset unread count for current user
      conversation.unreadCount[currentUserId] = 0;
      await conversation.save();

      // Notify sender that messages were read
      emitToUser(userId, 'messagesRead', {
        readerId: currentUserId,
        conversationId: conversation._id,
        readAt: new Date()
      });

      // Emit conversation update
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate({
          path: 'participants',
          match: { _id: { $ne: currentUserId } },
          select: 'username profilePicture fullName'
        })
        .populate({
          path: 'lastMessage',
          select: 'content sender createdAt isRead image messageType',
          populate: {
            path: 'sender',
            select: 'username profilePicture'
          }
        })
        .lean();

      emitToUser(userId, 'conversationUpdated', populatedConversation);
      emitToUser(currentUserId, 'conversationUpdated', populatedConversation);
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error);
    next(error);
  }
};

// Mark messages as read
export const markAsRead = async (req, res, next) => {
  try {
    const { senderId, conversationId } = req.body;
    const receiverId = req.user.id;

    if (!senderId || !conversationId) {
      return next(errorHandler(400, 'Sender ID and conversation ID are required'));
    }

    // Update messages as read
    const result = await Message.updateMany(
      {
        sender: senderId,
        receiver: receiverId,
        isRead: false
      },
      {
        $set: { isRead: true, readAt: Date.now() }
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      conversation.unreadCount[receiverId] = 0;
      await conversation.save();

      // Notify sender that messages were read
      emitToUser(senderId, 'messagesRead', {
        readerId: receiverId,
        conversationId: conversation._id,
        readAt: new Date()
      });

      // Emit conversation update
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate({
          path: 'participants',
          select: 'username profilePicture fullName'
        })
        .populate({
          path: 'lastMessage',
          select: 'content sender createdAt isRead image messageType',
          populate: {
            path: 'sender',
            select: 'username profilePicture'
          }
        })
        .lean();

      emitToUser(senderId, 'conversationUpdated', populatedConversation);
      emitToUser(receiverId, 'conversationUpdated', populatedConversation);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Messages marked as read',
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    next(error);
  }
};

// Delete a message
export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;

    const message = await Message.findById(messageId);
    
    if (!message) {
      return next(errorHandler(404, 'Message not found'));
    }

    // Only sender can delete their message
    if (message.sender.toString() !== userId) {
      return next(errorHandler(403, 'You can only delete your own messages'));
    }

    // Find the conversation
    const conversation = await Conversation.findOne({
      participants: { $all: [message.sender, message.receiver] }
    });

    // Store message data before deletion for socket emission
    const messageData = {
      _id: message._id,
      conversationId: conversation?._id,
      sender: message.sender,
      receiver: message.receiver
    };

    await Message.findByIdAndDelete(messageId);

    // Update conversation last message if needed
    if (conversation && conversation.lastMessage && conversation.lastMessage.toString() === messageId) {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: message.sender, receiver: message.receiver },
          { sender: message.receiver, receiver: message.sender }
        ]
      })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture fullName')
      .populate('receiver', 'username profilePicture fullName')
      .populate({
        path: 'replyTo',
        populate: {
          path: 'sender',
          select: 'username profilePicture'
        }
      });

      conversation.lastMessage = lastMessage?._id || null;
      conversation.lastMessageAt = lastMessage ? lastMessage.createdAt : conversation.createdAt;
      await conversation.save();

      // Emit conversation update
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate({
          path: 'participants',
          select: 'username profilePicture fullName'
        })
        .populate({
          path: 'lastMessage',
          select: 'content sender createdAt isRead image messageType',
          populate: {
            path: 'sender',
            select: 'username profilePicture'
          }
        })
        .lean();

      emitToUser(message.sender.toString(), 'conversationUpdated', populatedConversation);
      emitToUser(message.receiver.toString(), 'conversationUpdated', populatedConversation);
    }

    // Emit message deleted event
    if (conversation) {
      emitToConversation(conversation._id, 'messageDeleted', {
        messageId: messageData._id,
        conversationId: conversation._id,
        timestamp: new Date()
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Error in deleteMessage:', error);
    next(error);
  }
};

// Get unread message count
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      participants: userId
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
      if (conv.unreadCount) {
        // Handle both Map and object formats
        if (conv.unreadCount instanceof Map) {
          totalUnread += conv.unreadCount.get(userId.toString()) || 0;
        } else if (typeof conv.unreadCount === 'object') {
          totalUnread += conv.unreadCount[userId.toString()] || 0;
        }
      }
    });

    res.status(200).json({ unreadCount: totalUnread });
  } catch (error) {
    console.error('Error in getUnreadCount:', error);
    next(error);
  }
};

// Get online status of users
export const getOnlineStatus = async (req, res, next) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return next(errorHandler(400, 'userIds array is required'));
    }

    const onlineStatus = {};
    
    if (global.io) {
      const adapter = global.io.of('/').adapter;
      userIds.forEach(userId => {
        const userRoom = `user_${userId}`;
        const room = adapter.rooms.get(userRoom);
        onlineStatus[userId] = room && room.size > 0;
      });
    } else {
      // If socket.io is not initialized, return all false
      userIds.forEach(userId => {
        onlineStatus[userId] = false;
      });
    }

    res.status(200).json({ onlineStatus });
  } catch (error) {
    console.error('Error in getOnlineStatus:', error);
    next(error);
  }
};

// Get following users for messaging
export const getFollowingForMessaging = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate({
        path: 'following',
        select: 'username profilePicture fullName',
        match: { 
          _id: { $ne: userId } // Exclude self
        }
      });

    if (!user) {
      return next(errorHandler(404, 'User not found'));
    }

    // Also include users who follow you (mutual following)
    const followers = await User.find({
      _id: { $ne: userId },
      following: userId
    }).select('username profilePicture fullName');

    // Combine and remove duplicates
    const allUsers = [...user.following, ...followers];
    const uniqueUsersMap = new Map();
    
    allUsers.forEach(user => {
      if (user && user._id) {
        uniqueUsersMap.set(user._id.toString(), user);
      }
    });
    
    const uniqueUsers = Array.from(uniqueUsersMap.values());

    // Sort alphabetically by username
    uniqueUsers.sort((a, b) => a.username.localeCompare(b.username));

    res.status(200).json(uniqueUsers);
  } catch (error) {
    console.error('Error in getFollowingForMessaging:', error);
    next(error);
  }
};