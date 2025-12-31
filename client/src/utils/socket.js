import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.connectionCallbacks = [];
    this.connectionTimeout = null;
    this.token = null;
    this.isConnecting = false;
    this.reconnectionTimer = null;
  }

  connect(token) {
    console.log('SocketService: Attempting to connect with token:', token ? 'Token exists' : 'No token');
    
    if (!token) {
      console.error('SocketService: No token provided');
      return;
    }
    
    this.token = token;
    
    // If already connecting or connected, don't create new connection
    if (this.isConnecting || (this.socket?.connected && this.isConnected)) {
      console.log('SocketService: Already connecting or connected, skipping...');
      return;
    }
    
    // If socket exists but disconnected, clean up first
    if (this.socket) {
      this.disconnect();
    }
    
    this.isConnecting = true;
    
    // Clear any existing timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    console.log('SocketService: Creating new connection...');
    const SOCKET_URL = import.meta.env.PROD
  ? 'https://epicshot.onrender.com'
  : 'http://localhost:3000';

  this.socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  });
  

    this.setupEventListeners();
    
    // Set connection timeout
    this.connectionTimeout = setTimeout(() => {
      if (!this.isConnected) {
        console.error('SocketService: Connection timeout after 30 seconds');
        this.isConnecting = false;
        this.handleConnectionError();
      }
    }, 30000);
  }

  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ SocketService: Connected successfully, socket ID:', this.socket.id);
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      // Re-register all listeners
      this.reconnectAllListeners();
      
      // Notify connection callbacks
      this.connectionCallbacks.forEach(callback => callback(true));
      
      // Send initial ping
      setTimeout(() => {
        if (this.isConnected) {
          this.socket.emit('ping', { timestamp: Date.now() });
        }
      }, 1000);
    });

    this.socket.on('connect_error', (error) => {
      console.error('SocketService: Connection error:', error.message);
      this.isConnecting = false;
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('SocketService: Max reconnection attempts reached');
        this.isConnected = false;
        this.connectionCallbacks.forEach(callback => callback(false));
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('SocketService: Disconnected, reason:', reason);
      this.isConnected = false;
      this.isConnecting = false;
      
      // Clear all timeouts
      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout);
        this.connectionTimeout = null;
      }
      
      if (this.reconnectionTimer) {
        clearTimeout(this.reconnectionTimer);
        this.reconnectionTimer = null;
      }
      
      // Notify connection callbacks
      this.connectionCallbacks.forEach(callback => callback(false));
      
      // Handle different disconnect reasons
      if (reason === 'io server disconnect' || reason === 'transport close') {
        // Server initiated disconnect, try to reconnect after delay
        console.log('SocketService: Attempting to reconnect in 2 seconds...');
        this.reconnectionTimer = setTimeout(() => {
          if (this.token && !this.isConnecting) {
            this.connect(this.token);
          }
        }, 2000);
      } else if (reason === 'io client disconnect') {
        // Client initiated disconnect, don't reconnect
        console.log('SocketService: Client initiated disconnect, not reconnecting');
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`SocketService: Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`✅ SocketService: Reconnected after ${attemptNumber} attempts`);
      this.isConnected = true;
      this.connectionCallbacks.forEach(callback => callback(true));
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('SocketService: Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('SocketService: Reconnection failed');
      this.isConnected = false;
      this.connectionCallbacks.forEach(callback => callback(false));
    });

    this.socket.on('socketConnected', (data) => {
      console.log('SocketService: Socket connected confirmation:', data);
    });

    this.socket.on('authentication_response', (data) => {
      console.log('SocketService: Authentication response:', data);
    });

    this.socket.on('ping', () => {
      if (this.isConnected) {
        this.socket.emit('pong', { timestamp: Date.now() });
      }
    });

    this.socket.on('pong', (data) => {
      console.log('SocketService: Received pong', data);
    });
  }

  reconnectAllListeners() {
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.on(event, callback);
      });
    });
  }

  handleConnectionError() {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionCallbacks.forEach(callback => callback(false));
  }

  on(event, callback) {
    console.log(`SocketService: Adding listener for ${event}`);
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    if (this.socket && this.isConnected) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
    
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    console.log(`SocketService: Emitting ${event}`, data);
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`SocketService: Cannot emit ${event}, socket not connected`);
      // Queue the message for when connection is restored
      if (event === 'typing' || event === 'stopTyping' || event === 'messageDelivered') {
        console.log(`SocketService: Queuing ${event} for later`);
      }
    }
  }

  // Convenience methods with connection checks
  joinConversation(conversationId) {
    if (this.isConnected && conversationId) {
      console.log(`SocketService: Joining conversation ${conversationId}`);
      this.emit('joinConversation', conversationId);
    }
  }

  leaveConversation(conversationId) {
    if (this.isConnected && conversationId) {
      this.emit('leaveConversation', conversationId);
    }
  }

  startTyping(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.emit('typing', { conversationId, receiverId });
    }
  }

  stopTyping(conversationId, receiverId) {
    if (this.isConnected && conversationId && receiverId) {
      this.emit('stopTyping', { conversationId, receiverId });
    }
  }

  messageDelivered(messageId, conversationId, receiverId) {
    if (this.isConnected && messageId && conversationId && receiverId) {
      this.emit('messageDelivered', { messageId, conversationId, receiverId });
    }
  }

  // Add callback for connection status changes
  onConnectionChange(callback) {
    if (!this.connectionCallbacks.includes(callback)) {
      this.connectionCallbacks.push(callback);
    }
  }

  // Remove connection callback
  offConnectionChange(callback) {
    const index = this.connectionCallbacks.indexOf(callback);
    if (index > -1) {
      this.connectionCallbacks.splice(index, 1);
    }
  }

  disconnect() {
    console.log('SocketService: Disconnecting...');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.isConnecting = false;
    this.listeners.clear();
    this.connectionCallbacks = [];
    
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    
    if (this.reconnectionTimer) {
      clearTimeout(this.reconnectionTimer);
      this.reconnectionTimer = null;
    }
  }

  get connected() {
    return this.isConnected && this.socket?.connected;
  }

  get id() {
    return this.socket?.id;
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;