import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Store online users and their socket connections
const userSockets = new Map(); // userId -> socketId[]
const socketUsers = new Map(); // socketId -> userId

const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://epicshot.onrender.com'
      ],
      credentials: true
    },
    transports: ['websocket'], // IMPORTANT
    pingTimeout: 30000,
    pingInterval: 10000
  });
  

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      socket.profilePicture = user.profilePicture;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username} (${socket.userId}) - Socket: ${socket.id}`);

    // Store socket connection
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);
    socketUsers.set(socket.id, socket.userId);

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Notify others about user's online status
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      username: socket.username,
      profilePicture: socket.profilePicture,
      timestamp: new Date()
    });

    // Send current user their socket id
    socket.emit('socketConnected', {
      socketId: socket.id,
      userId: socket.userId
    });

    // Handle join conversation
    socket.on('joinConversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`${socket.username} joined conversation: ${conversationId}`);
    });

    // Handle leave conversation
    socket.on('leaveConversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`${socket.username} left conversation: ${conversationId}`);
    });

    // Handle typing indicator
    socket.on('typing', ({ conversationId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('typing', {
        conversationId,
        senderId: socket.userId,
        senderName: socket.username,
        timestamp: new Date()
      });
    });

    // Handle stop typing
    socket.on('stopTyping', ({ conversationId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('stopTyping', {
        conversationId,
        senderId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle message delivery confirmation
    socket.on('messageDelivered', ({ messageId, conversationId, receiverId }) => {
      socket.to(`user_${receiverId}`).emit('messageDelivered', {
        messageId,
        conversationId,
        senderId: socket.userId,
        timestamp: new Date()
      });
    });

    // Handle typing in group (if needed)
    socket.on('typingInConversation', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('userTyping', {
        conversationId,
        userId: socket.userId,
        username: socket.username
      });
    });

    // Handle stop typing in group
    socket.on('stopTypingInConversation', ({ conversationId }) => {
      socket.to(`conversation_${conversationId}`).emit('userStoppedTyping', {
        conversationId,
        userId: socket.userId
      });
    });

    // Handle presence update (away/active)
    socket.on('presenceUpdate', ({ status, lastActive }) => {
      socket.broadcast.emit('userPresenceUpdate', {
        userId: socket.userId,
        username: socket.username,
        status: status || 'active',
        lastActive: lastActive || new Date(),
        timestamp: new Date()
      });
    });

    // Handle custom events
    socket.on('customEvent', (data) => {
      console.log('Custom event received:', data);
      // Handle custom events as needed
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`User disconnected: ${socket.username} - Reason: ${reason}`);
      
      // Remove socket from user's connections
      const userSocketSet = userSockets.get(socket.userId);
      if (userSocketSet) {
        userSocketSet.delete(socket.id);
        if (userSocketSet.size === 0) {
          userSockets.delete(socket.userId);
          
          // Notify others that user went offline
          socket.broadcast.emit('userOffline', {
            userId: socket.userId,
            username: socket.username,
            timestamp: new Date()
          });
        }
      }
      
      // Remove socket from socketUsers map
      socketUsers.delete(socket.id);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Heartbeat/ping
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: new Date() });
    });
  });

  // Make io instance available globally
  global.io = io;

  return io;
};

// Utility functions
export const getUserSocketIds = (userId) => {
  const socketSet = userSockets.get(userId);
  return socketSet ? Array.from(socketSet) : [];
};

export const isUserOnline = (userId) => {
  return userSockets.has(userId) && userSockets.get(userId).size > 0;
};

export const getOnlineUsers = () => {
  const onlineUsers = [];
  userSockets.forEach((socketSet, userId) => {
    if (socketSet.size > 0) {
      onlineUsers.push({
        userId,
        socketCount: socketSet.size,
        socketIds: Array.from(socketSet)
      });
    }
  });
  return onlineUsers;
};

export const emitToUser = (userId, event, data) => {
  const io = global.io;
  if (io && userId) {
    io.to(`user_${userId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  const io = global.io;
  if (io && conversationId) {
    io.to(`conversation_${conversationId}`).emit(event, data);
  }
};

export default setupSocketIO;