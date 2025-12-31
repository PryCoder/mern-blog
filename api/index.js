import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/user.model.js';
import userRoutes from './routes/user.route.js';
import authRoutes from './routes/auth.route.js';
import postRoutes from './routes/post.route.js';
import storiesRoutes from './routes/stories.route.js';
import commentRoutes from './routes/comment.route.js';
import messageRoutes from './routes/message.route.js';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

dotenv.config();

mongoose.connect(process.env.MONGO)
.then(() => { 
  console.log('MongoDB is connected');
}).catch((err) => {
  console.log('MongoDB connection error:', err);
});

const __dirname = path.resolve();

const app = express();

// Create HTTP server
const server = http.createServer(app);

// Socket.IO Setup
// Store online users
const onlineUsers = new Map(); // userId -> {socketId, username, connectedAt}

// Initialize Socket.IO with proper CORS configuration
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173','https://epicshot.onrender.com'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 30000,
  pingInterval: 10000,
  connectTimeout: 20000,
  allowEIO3: true,
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  try {
    console.log('Socket middleware: Checking authentication');
    
    // Get token from auth or query params
    const token = socket.handshake.auth.token || 
                  socket.handshake.query.token || 
                  socket.handshake.headers.authorization?.replace('Bearer ', '');
    
    console.log('Socket middleware: Token received:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('Socket authentication failed: No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Socket middleware: Decoded token:', decoded);
    
    // Find user
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      console.log('Socket authentication failed: User not found');
      return next(new Error('Authentication error: User not found'));
    }

    console.log('Socket middleware: User found:', user.username);
    
    // Attach user info to socket
    socket.userId = user._id.toString();
    socket.username = user.username;
    socket.profilePicture = user.profilePicture;
    
    console.log(`Socket authenticated: ${socket.username} (${socket.userId})`);
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT Error:', error.message);
      return next(new Error('Authentication error: Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      console.error('Token expired');
      return next(new Error('Authentication error: Token expired'));
    }
    console.error('Other authentication error:', error);
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.username} (${socket.userId}) - Socket: ${socket.id}`);
  
  // Add user to online users
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    username: socket.username,
    profilePicture: socket.profilePicture,
    connectedAt: new Date()
  });

  // Join user to their personal room
  socket.join(`user_${socket.userId}`);

  // Send connection confirmation to the user
  socket.emit('socketConnected', {
    socketId: socket.id,
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date()
  });

  // Send authentication response
  socket.emit('authentication_response', {
    authenticated: true,
    userId: socket.userId,
    username: socket.username,
    timestamp: new Date()
  });

  // Notify other users about this user coming online
  socket.broadcast.emit('userOnline', {
    userId: socket.userId,
    username: socket.username,
    profilePicture: socket.profilePicture,
    timestamp: new Date()
  });

  // Send list of online users to the connected user
  const onlineUsersList = Array.from(onlineUsers.values()).map(user => ({
    userId: user.userId,
    username: user.username,
    profilePicture: user.profilePicture,
    connectedAt: user.connectedAt
  }));
  
  socket.emit('onlineUsers', onlineUsersList);

  // Handle authentication check
  socket.on('authentication_check', (data) => {
    console.log('Authentication check from user:', socket.username, data);
    socket.emit('authentication_response', {
      authenticated: true,
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });
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
    console.log(`${socket.username} is typing in conversation ${conversationId}`);
    socket.to(`user_${receiverId}`).emit('typing', {
      conversationId,
      senderId: socket.userId,
      senderName: socket.username,
      timestamp: new Date()
    });
  });

  // Handle stop typing
  socket.on('stopTyping', ({ conversationId, receiverId }) => {
    console.log(`${socket.username} stopped typing in conversation ${conversationId}`);
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

  // Handle new message
  socket.on('newMessage', (data) => {
    console.log('New message from user:', socket.username, data);
    // Broadcast to conversation
    socket.to(`conversation_${data.conversationId}`).emit('newMessage', {
      ...data,
      sender: {
        id: socket.userId,
        username: socket.username,
        profilePicture: socket.profilePicture
      },
      timestamp: new Date()
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`❌ User disconnected: ${socket.username} - Reason: ${reason} - Socket: ${socket.id}`);
    
    // Remove user from online users
    onlineUsers.delete(socket.userId);
    
    // Notify other users
    socket.broadcast.emit('userOffline', {
      userId: socket.userId,
      username: socket.username,
      timestamp: new Date()
    });
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error for user', socket.username, ':', error);
  });

  // Heartbeat/ping
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date() });
  });

  // Handle manual ping
  socket.on('pong', () => {
    // Client responded to ping
  });
});

// Make io available globally
app.set('io', io);
global.io = io;

// Utility functions for controllers
export const emitToUser = (userId, event, data) => {
  if (global.io && userId) {
    console.log(`Emitting ${event} to user ${userId}:`, data);
    global.io.to(`user_${userId}`).emit(event, data);
  } else {
    console.warn(`Cannot emit ${event} - io: ${global.io ? 'available' : 'not available'}, userId: ${userId}`);
  }
};

export const emitToConversation = (conversationId, event, data) => {
  if (global.io && conversationId) {
    console.log(`Emitting ${event} to conversation ${conversationId}:`, data);
    global.io.to(`conversation_${conversationId}`).emit(event, data);
  }
};

export const isUserOnline = (userId) => {
  // Check if user has any socket connections
  if (!global.io) return false;
  
  const adapter = global.io.of('/').adapter;
  const userRoom = `user_${userId}`;
  const room = adapter.rooms.get(userRoom);
  return room && room.size > 0;
};

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.values());
};

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// CORS pre-flight
app.options('*', cors());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});

// Routes
app.use('/api/user', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/post', postRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/stories', storiesRoutes);
app.use('/api/messages', messageRoutes);

// Online status endpoint
app.post('/api/online-status', (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds array is required' });
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
    console.error('Error in online-status endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Socket test endpoint
app.get('/api/socket-test', (req, res) => {
  res.status(200).json({
    connected: global.io ? true : false,
    onlineUsers: onlineUsers.size,
    serverTime: new Date(),
    environment: process.env.NODE_ENV
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    socketConnected: global.io ? true : false,
    onlineUsers: onlineUsers.size,
    uptime: process.uptime()
  });
});

// Static files for production
app.use(express.static(path.join(__dirname, '/client/dist')));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`✅ Socket.IO is ready`);
  console.log(`✅ CORS enabled for: http://localhost:5173`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(`${signal} signal received: closing HTTP server`);
  
  // Close all socket connections
  if (global.io) {
    global.io.close();
    console.log('Socket.IO server closed');
  }
  
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
  
  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'production') {
    console.log('Continuing in production despite uncaught exception');
  } else {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production
  if (process.env.NODE_ENV === 'production') {
    console.log('Continuing in production despite unhandled rejection');
  }
});

export { io };