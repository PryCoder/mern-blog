import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  InputAdornment,
  Button,
  Drawer,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Snackbar,
  Alert,
  Fade,
  Zoom,
  Slide,
  Grow,
  Tooltip,
  LinearProgress,
  styled,
  keyframes,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
  Circle as CircleIcon,
  Videocam as VideocamIcon,
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  Report as ReportIcon,
  Edit as EditIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Image as ImageIcon,
  EmojiEmotions as EmojiIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  BookmarkBorder as BookmarkIcon,
  Share as ShareIcon,
  Close as CloseIcon,
  PersonAdd as PersonAddIcon,
  Block as BlockIcon,
  Reply as ReplyIcon,
  Download as DownloadIcon,
  AttachFile as AttachFileIcon,
  VideoFile as VideoFileIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import socketService from '../utils/socket';
import EmojiPicker from 'emoji-picker-react';

// Firebase imports
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { CircularProgressbar } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import {app} from '../firebase'

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase

const storage = getStorage(app);

// Animation keyframes
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const typingAnimation = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const slideInFromLeft = keyframes`
  from { transform: translateX(-20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const slideInFromRight = keyframes`
  from { transform: translateX(20px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

// Styled components
const AnimatedContainer = styled(Box)(({ theme }) => ({
  animation: `${fadeIn} 0.5s ease-in`,
}));

const MessageBubble = styled(Box)(({ theme, isCurrentUser }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1.5),
  borderRadius: '18px',
  backgroundColor: isCurrentUser ? 
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 
    theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f2f5',
  color: isCurrentUser ? 'white' : 'inherit',
  position: 'relative',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: isCurrentUser ? 
    `${slideInFromRight} 0.3s ease-out` : 
    `${slideInFromLeft} 0.3s ease-out`,
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    transform: 'translateY(-2px)',
  },
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  padding: theme.spacing(1, 1.5),
  borderRadius: '18px',
  backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f0f2f5',
  maxWidth: '70%',
  animation: `${fadeIn} 0.3s ease-in`,
}));

const Dot = styled(Box)(({ theme, delay }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.text.secondary,
  animation: `${typingAnimation} 1.4s infinite`,
  animationDelay: delay,
}));

// Font families
const FONT_FAMILIES = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  secondary: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

const MessagesPage = () => {
  const { currentUser } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [showNewMessageDrawer, setShowNewMessageDrawer] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCount, setUnreadCount] = useState(0);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [messageReactions, setMessageReactions] = useState({});
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [quickEmojiPicker, setQuickEmojiPicker] = useState(null);
  const [replyTo, setReplyTo] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});
  const [messageEdit, setMessageEdit] = useState({ id: null, content: '' });
  const [activeFile, setActiveFile] = useState(null);
  const [showFileSelector, setShowFileSelector] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState([]);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketInitialized = useRef(false);
  const mountedRef = useRef(true);
  const messagesContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

  // Get current user data safely
  const getCurrentUser = () => {
    try {
      const userFromStorage = JSON.parse(localStorage.getItem('user') || 'null');
      return userFromStorage || currentUser;
    } catch (error) {
      console.error('Error getting user data:', error);
      return currentUser;
    }
  };

  // Get current user ID safely
  const getCurrentUserId = () => {
    const user = getCurrentUser();
    return user?._id || user?.id;
  };

  // Get token safely
  const getToken = () => {
    const user = getCurrentUser();
    return user?.token || localStorage.getItem('token');
  };

  // Helper: Show snackbar
  const showSnackbar = useCallback((message, severity = 'info') => {
    if (mountedRef.current) {
      setSnackbar({ open: true, message, severity });
    }
  }, []);

  // Helper: Format date
  const formatMessageTime = (date) => {
    if (!date) return '';
    try {
      const messageDate = new Date(date);
      if (isToday(messageDate)) {
        return format(messageDate, 'h:mm a');
      } else if (isYesterday(messageDate)) {
        return 'Yesterday ' + format(messageDate, 'h:mm a');
      } else {
        return format(messageDate, 'MMM d, h:mm a');
      }
    } catch (error) {
      return '';
    }
  };

  const formatConversationTime = (date) => {
    if (!date) return '';
    try {
      const convDate = new Date(date);
      if (isToday(convDate)) {
        return format(convDate, 'h:mm a');
      }
      return format(convDate, 'MMM d');
    } catch (error) {
      return '';
    }
  };

  const formatLastSeen = (date) => {
    if (!date) return 'Recently active';
    try {
      const lastSeenDate = new Date(date);
      return `Active ${formatDistanceToNow(lastSeenDate, { addSuffix: true })}`;
    } catch (error) {
      return 'Recently active';
    }
  };

  // Helper: Get other user in conversation
  const getOtherUser = (conversation) => {
    if (!conversation || !conversation.participants || !Array.isArray(conversation.participants)) return null;
    const userId = getCurrentUserId();
    if (!userId) return null;
    return conversation.participants.find(p => p._id !== userId);
  };

  // Helper: Get unread count
  const getUnreadCountForConversation = (conversation) => {
    if (!conversation || !conversation.unreadCount) return 0;
    const userId = getCurrentUserId();
    if (!userId) return 0;
    
    const userIdStr = userId.toString();
    
    if (typeof conversation.unreadCount === 'object') {
      return conversation.unreadCount[userIdStr] || 0;
    }
    return 0;
  };

  // Socket event handlers
  const handleSocketConnected = useCallback(() => {
    console.log('✅ Socket connected!');
    if (mountedRef.current) {
      setSocketConnected(true);
      setConnectionAttempts(0);
      showSnackbar('Connected to chat', 'success');
    }
    
    if (selectedConversation && socketService.connected) {
      socketService.joinConversation(selectedConversation._id);
    }
  }, [selectedConversation, showSnackbar]);

  const handleSocketDisconnected = useCallback(() => {
    console.log('⚠️ Socket disconnected');
    if (mountedRef.current) {
      setSocketConnected(false);
      showSnackbar('Disconnected from chat', 'warning');
    }
  }, [showSnackbar]);

  const handleSocketError = useCallback((error) => {
    console.error('Socket error:', error);
    if (mountedRef.current) {
      showSnackbar('Socket connection error', 'error');
    }
  }, [showSnackbar]);

  const handleNewMessage = useCallback((data) => {
    console.log('📩 New message received:', data);
    const currentUserId = getCurrentUserId();
    
    const isCurrentConversation = selectedConversation?._id === data.conversationId;
    const isMessageFromMe = data.message?.sender?._id === currentUserId;
    
    if (isCurrentConversation && mountedRef.current) {
      setMessages(prev => {
        const exists = prev.some(msg => msg._id === data.message._id);
        if (!exists) {
          return [...prev, data.message];
        }
        return prev;
      });
      
      scrollToBottom();
      
      if (!isMessageFromMe && socketService.connected) {
        socketService.messageDelivered(
          data.message._id,
          data.conversationId,
          data.message.sender._id
        );
      }
    }
    
    if (mountedRef.current) {
      setConversations(prev => {
        let updated = [...prev];
        const index = updated.findIndex(c => c._id === data.conversationId);
        
        if (index !== -1) {
          updated[index] = {
            ...updated[index],
            lastMessage: data.message,
            lastMessageAt: new Date(),
            unreadCount: data.unreadCount || {}
          };
          const [moved] = updated.splice(index, 1);
          updated.unshift(moved);
        } else if (!isMessageFromMe) {
          const user = getCurrentUser();
          updated.unshift({
            _id: data.conversationId,
            participants: [user, data.message.sender],
            lastMessage: data.message,
            lastMessageAt: new Date(),
            unreadCount: data.unreadCount || {}
          });
        }
        
        return updated;
      });
      
      if (!isCurrentConversation && !isMessageFromMe) {
        fetchUnreadCount();
      }
    }
  }, [selectedConversation]);

  const handleTyping = useCallback((data) => {
    if (selectedConversation?._id === data.conversationId && mountedRef.current) {
      setTypingUsers(prev => ({
        ...prev,
        [data.senderId]: {
          username: data.senderName,
          timestamp: data.timestamp || new Date()
        }
      }));
      
      setTimeout(() => {
        setTypingUsers(prev => {
          const updated = { ...prev };
          delete updated[data.senderId];
          return updated;
        });
      }, 3000);
    }
  }, [selectedConversation]);

  const handleStopTyping = useCallback((data) => {
    if (selectedConversation?._id === data.conversationId && mountedRef.current) {
      setTypingUsers(prev => {
        const updated = { ...prev };
        delete updated[data.senderId];
        return updated;
      });
    }
  }, [selectedConversation]);

  const handleMessagesRead = useCallback((data) => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) return;
    
    if (selectedConversation?._id === data.conversationId && mountedRef.current) {
      setMessages(prev => prev.map(msg => 
        msg.sender._id === currentUserId 
          ? { ...msg, isRead: true, readAt: data.readAt || new Date() }
          : msg
      ));
    }
  }, [selectedConversation]);

  const handleMessageDeleted = useCallback((data) => {
    if (selectedConversation?._id === data.conversationId && mountedRef.current) {
      setMessages(prev => prev.filter(msg => msg._id !== data.messageId));
    }
  }, [selectedConversation]);

  const handleUserOnline = useCallback((data) => {
    if (mountedRef.current) {
      setOnlineStatus(prev => ({
        ...prev,
        [data.userId]: { status: 'online', lastSeen: new Date() }
      }));
    }
  }, []);

  const handleUserOffline = useCallback((data) => {
    if (mountedRef.current) {
      setOnlineStatus(prev => ({
        ...prev,
        [data.userId]: { status: 'offline', lastSeen: new Date(data.timestamp) }
      }));
    }
  }, []);

  const handleMessageReaction = useCallback((data) => {
    if (mountedRef.current) {
      setMessageReactions(prev => ({
        ...prev,
        [data.messageId]: data.reactions
      }));
    }
  }, []);

  // API Calls
  const fetchConversations = useCallback(async () => {
    const userId = getCurrentUserId();
    const token = getToken();
    
    if (!userId || !token) return;
    
    try {
      if (mountedRef.current) setLoading(true);
      const response = await axios.get(`/api/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      if (mountedRef.current) {
        setConversations(response.data || []);
      }
      
      const allUserIds = [];
      response.data?.forEach(conv => {
        const otherUser = getOtherUser(conv);
        if (otherUser?._id) {
          allUserIds.push(otherUser._id);
        }
      });
      
      if (allUserIds.length > 0) {
        fetchOnlineStatus(allUserIds);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (mountedRef.current) {
        showSnackbar('Failed to load conversations', 'error');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [showSnackbar]);

  const fetchMessages = useCallback(async (userId) => {
    const currentUserId = getCurrentUserId();
    const token = getToken();
    
    if (!currentUserId || !token || !userId) return;
    
    try {
      if (mountedRef.current) setMessageLoading(true);
      const response = await axios.get(`/api/messages/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      if (mountedRef.current) {
        setMessages(response.data || []);
        setTimeout(() => scrollToBottom(), 300);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (mountedRef.current) {
        showSnackbar('Failed to load messages', 'error');
      }
    } finally {
      if (mountedRef.current) setMessageLoading(false);
    }
  }, [showSnackbar]);

  const fetchFollowingUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await axios.get(`/api/messages/following/messaging`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      if (mountedRef.current) {
        setFollowingUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    
    try {
      const response = await axios.get(`/api/messages/unread/count`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      
      if (mountedRef.current) {
        setUnreadCount(response.data?.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  const fetchOnlineStatus = useCallback(async (userIds) => {
    const token = getToken();
    if (!token || !userIds || userIds.length === 0) return;
    
    try {
      const response = await axios.post(`/api/messages/online-status`, 
        { userIds },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      if (mountedRef.current) {
        const statusUpdates = {};
        userIds.forEach(userId => {
          statusUpdates[userId] = {
            status: response.data?.onlineStatus?.[userId] ? 'online' : 'offline',
            lastSeen: new Date()
          };
        });
        setOnlineStatus(prev => ({ ...prev, ...statusUpdates }));
      }
    } catch (error) {
      console.error('Error fetching online status:', error);
    }
  }, []);

  // Firebase Upload Function (like DashProfile)
  const uploadToFirebase = async (file) => {
    const token = getToken();
    if (!token || !file) return null;

    try {
      const storageRef = ref(storage, `messages/${Date.now()}_${file.name.replace(/\s+/g, '_')}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(prev => ({
              ...prev,
              [file.name]: progress
            }));
          },
          (error) => {
            console.error('Upload error:', error);
            reject(error);
          },
          async () => {
            try {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(downloadURL);
            } catch (error) {
              reject(error);
            }
          }
        );
      });
    } catch (error) {
      console.error('Error uploading to Firebase:', error);
      throw error;
    }
  };

  // Handle file selection
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        showSnackbar(`${file.name} exceeds 10MB limit`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
    // Create previews for images
    validFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setMediaPreview(prev => ({
            ...prev,
            [file.name]: reader.result
          }));
        };
        reader.readAsDataURL(file);
      }
    });

    // Upload files immediately
    await handleUploadFiles(validFiles);
  };

  // Handle multiple file uploads
  const handleUploadFiles = async (files) => {
    const token = getToken();
    if (!token || !selectedUser || files.length === 0) return;

    setIsSending(true);
    setUploadingFiles(files.map(f => f.name));

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          // Upload to Firebase
          const downloadURL = await uploadToFirebase(file);
          
          // Determine message type
          let messageType = 'file';
          if (file.type.startsWith('image/')) messageType = 'image';
          if (file.type.startsWith('video/')) messageType = 'video';
          if (file.type === 'application/pdf') messageType = 'pdf';
          
          // Send to backend
          const response = await axios.post(`/api/messages/send`, 
            {
              receiverId: selectedUser._id,
              content: newMessage.trim() || '',
              imageUrl: downloadURL,
              messageType: messageType,
              fileName: file.name,
              fileSize: file.size,
              replyTo: replyTo?._id
            },
            {
              headers: { Authorization: `Bearer ${token}` },
              withCredentials: true,
            }
          );

          return response.data.message;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const uploadedMessages = await Promise.all(uploadPromises);
      
      // Add messages to state
      uploadedMessages.forEach(message => {
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      });

      // Update conversations
      if (uploadedMessages.length > 0) {
        setConversations(prev => {
          let updated = [...prev];
          const lastMessage = uploadedMessages[uploadedMessages.length - 1];
          const index = updated.findIndex(c => c._id === lastMessage.conversationId);
          
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              lastMessage: lastMessage,
              lastMessageAt: new Date(),
            };
            const [moved] = updated.splice(index, 1);
            updated.unshift(moved);
          }
          
          return updated;
        });
      }

      scrollToBottom();
      setNewMessage('');
      setSelectedFiles([]);
      setMediaPreview({});
      setReplyTo(null);
      showSnackbar(`${files.length} file(s) sent successfully`, 'success');
      
    } catch (error) {
      console.error('Error sending files:', error);
      showSnackbar('Failed to send files', 'error');
    } finally {
      setIsSending(false);
      setUploadingFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle text message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = getToken();
    
    if ((!newMessage.trim() && selectedFiles.length === 0) || !selectedUser || !token || isSending) {
      if (!newMessage.trim() && selectedFiles.length === 0) {
        showSnackbar('Cannot send empty message', 'warning');
      }
      return;
    }

    setIsSending(true);

    try {
      let response;
      
      if (selectedFiles.length > 0) {
        // Handle file uploads
        await handleUploadFiles(selectedFiles);
      } else {
        // Handle text message
        response = await axios.post(`/api/messages/send`, 
          {
            receiverId: selectedUser._id,
            content: newMessage.trim(),
            replyTo: replyTo?._id
          },
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );

        const sentMessage = response.data.message;
        
        if (sentMessage && mountedRef.current) {
          setMessages(prev => [...prev, sentMessage]);
          
          setConversations(prev => {
            let updated = [...prev];
            const index = updated.findIndex(c => c._id === response.data.conversationId);
            
            if (index !== -1) {
              updated[index] = {
                ...updated[index],
                lastMessage: sentMessage,
                lastMessageAt: new Date(),
              };
              const [moved] = updated.splice(index, 1);
              updated.unshift(moved);
            }
            
            return updated;
          });
          
          scrollToBottom();
        }

        setNewMessage('');
        setReplyTo(null);
      }

      if (inputRef.current) inputRef.current.focus();
      
      if (selectedConversation && socketService.connected) {
        socketService.stopTyping(selectedConversation._id, selectedUser._id);
      }
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      if (!selectedFiles.length) {
        showSnackbar('Message sent', 'success');
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 403) {
        showSnackbar('You can only message users you follow or who follow you', 'error');
      } else {
        showSnackbar('Failed to send message', 'error');
      }
    } finally {
      setIsSending(false);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (selectedConversation && selectedUser && socketConnected && socketService.connected) {
      socketService.startTyping(selectedConversation._id, selectedUser._id);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        if (socketService.connected) {
          socketService.stopTyping(selectedConversation._id, selectedUser._id);
        }
      }, 3000);
    }
  };

  // Remove selected file
  const handleRemoveFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setMediaPreview(prev => {
      const newPreview = { ...prev };
      delete newPreview[fileName];
      return newPreview;
    });
  };

  // Download attachment
  const handleDownloadAttachment = (fileUrl, fileName) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;                 // Firebase public download URL
      link.download = fileName || '';      // let browser decide if empty
      link.target = '_blank';              // optional but safer
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      showSnackbar('File downloaded', 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showSnackbar('Failed to download file', 'error');
    }
  };
  
  // Quick reactions
  const quickReactions = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

  // Get file icon based on type
  const getFileIcon = (fileType, fileName) => {
    if (fileType?.startsWith('image/')) return <ImageIcon />;
    if (fileType?.startsWith('video/')) return <VideoFileIcon />;
    if (fileType === 'application/pdf') return <PdfIcon />;
    return <FileIcon />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Select conversation
  const handleSelectConversation = (conversation) => {
    const otherUser = getOtherUser(conversation);
    if (!otherUser) return;
    
    setSelectedConversation(conversation);
    setSelectedUser(otherUser);
    setMessages([]);
    setTypingUsers({});
    setShowEmojiPicker(false);
    setReplyTo(null);
    setQuickEmojiPicker(null);
    setSelectedFiles([]);
    setMediaPreview({});
    
    navigate(`/direct/t/${conversation._id}`, { replace: true });
    
    fetchMessages(otherUser._id);
    
    if (socketConnected && socketService.connected) {
      socketService.joinConversation(conversation._id);
    }
    
    if (getUnreadCountForConversation(conversation) > 0) {
      markAsRead(otherUser._id, conversation._id);
    }
  };

  // Mark as read
  const markAsRead = async (senderId, conversationId) => {
    const token = getToken();
    if (!token) return;

    try {
      await axios.put(`${API_BASE_URL}/messages/mark-read`,
        { senderId, conversationId },
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Emoji picker handler
  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Socket setup
  useEffect(() => {
    mountedRef.current = true;
    
    const token = getToken();
    if (!token) {
      console.log('No user token available');
      return;
    }
    
    console.log('Setting up socket connection for user:', getCurrentUserId());
    
    if (socketInitialized.current) {
      console.log('Socket already initialized');
      return;
    }
    
    socketInitialized.current = true;
    
    const handleConnectionChange = (connected) => {
      if (mountedRef.current) {
        setSocketConnected(connected);
        if (connected) {
          showSnackbar('Connected to chat', 'success');
        }
      }
    };
    
    socketService.onConnectionChange(handleConnectionChange);
    
    const socketListeners = [
      { event: 'connect', handler: handleSocketConnected },
      { event: 'disconnect', handler: handleSocketDisconnected },
      { event: 'connect_error', handler: handleSocketError },
      { event: 'newMessage', handler: handleNewMessage },
      { event: 'typing', handler: handleTyping },
      { event: 'stopTyping', handler: handleStopTyping },
      { event: 'messagesRead', handler: handleMessagesRead },
      { event: 'messageDeleted', handler: handleMessageDeleted },
      { event: 'userOnline', handler: handleUserOnline },
      { event: 'userOffline', handler: handleUserOffline },
      { event: 'messageReaction', handler: handleMessageReaction },
    ];
    
    socketListeners.forEach(({ event, handler }) => {
      socketService.on(event, handler);
    });
    
    console.log('Initiating socket connection...');
    socketService.connect(token);
    
    return () => {
      console.log('Cleaning up socket listeners');
      mountedRef.current = false;
      
      socketService.offConnectionChange(handleConnectionChange);
      
      socketListeners.forEach(({ event, handler }) => {
        socketService.off(event, handler);
      });
      
      socketInitialized.current = false;
    };
  }, [handleSocketConnected, handleSocketDisconnected, handleSocketError, handleNewMessage, handleTyping, handleStopTyping, handleMessagesRead, handleMessageDeleted, handleUserOnline, handleUserOffline, handleMessageReaction, showSnackbar]);

  // Initial data loading
  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchConversations();
      fetchFollowingUsers();
      fetchUnreadCount();
    }
  }, [fetchConversations, fetchFollowingUsers, fetchUnreadCount]);

  // Handle URL conversation parameter
  useEffect(() => {
    if (urlConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === urlConversationId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [urlConversationId, conversations]);

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Filter conversations and users
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherUser = getOtherUser(conv);
    return otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           otherUser?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFollowingUsers = followingUsers.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.fullName && user.fullName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Loading state
  const user = getCurrentUser();
  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const currentUserId = getCurrentUserId();

  return (
    <AnimatedContainer className="messages-container" sx={{ 
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: 'background.default',
      fontFamily: FONT_FAMILIES.primary,
    }}>
      {/* Connection Status */}
      <Slide direction="down" in={!socketConnected} mountOnEnter unmountOnExit>
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999
        }}>
          <Alert 
            severity="warning" 
            sx={{ 
              borderRadius: 0,
              animation: `${pulseAnimation} 2s infinite`,
              fontFamily: FONT_FAMILIES.secondary,
            }}
          >
            <CircularProgress size={16} sx={{ mr: 1 }} />
            Connecting to chat service... {connectionAttempts > 0 && `(Attempt ${connectionAttempts})`}
          </Alert>
        </Box>
      </Slide>

      {/* Sidebar for large screens, drawer for small */}
      <Box sx={{
        display: { xs: selectedUser ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        width: { xs: '100%', md: 380 },
        borderRight: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}>
        {/* Sidebar Header */}
        <Box sx={{ 
          p: 2, 
          borderBottom: 1, 
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: 'background.default',
        }}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar 
              src={user.profilePicture}
              sx={{ width: 40, height: 40 }}
            >
              {user.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="h6" 
              sx={{ 
                fontFamily: FONT_FAMILIES.secondary,
                fontWeight: 600,
                color: 'text.primary'
              }}
            >
              Messages
            </Typography>
            {unreadCount > 0 && (
              <Chip 
                label={unreadCount} 
                size="small" 
                color="primary"
                sx={{ 
                  ml: 1,
                  animation: `${pulseAnimation} 2s infinite`,
                  fontFamily: FONT_FAMILIES.mono,
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>
          <IconButton 
            onClick={() => setShowNewMessageDrawer(true)}
            sx={{ 
              color: 'primary.main',
              animation: `${floatAnimation} 3s ease-in-out infinite`,
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 3,
                fontFamily: FONT_FAMILIES.primary,
              }
            }}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Conversations List */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Box sx={{ mb: 2, opacity: 0.5, animation: `${floatAnimation} 3s ease-in-out infinite` }}>
                <EditIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontFamily: FONT_FAMILIES.secondary }}
              >
                No messages yet
              </Typography>
              <Button 
                variant="text" 
                onClick={() => setShowNewMessageDrawer(true)}
                sx={{ mt: 1, textTransform: 'none' }}
              >
                Start a conversation
              </Button>
            </Box>
          ) : (
            <List>
              {filteredConversations.map((conversation, index) => {
                const otherUser = getOtherUser(conversation);
                const unreadCount = getUnreadCountForConversation(conversation);
                const isOnline = onlineStatus[otherUser?._id]?.status === 'online';
                const isSelected = selectedConversation?._id === conversation._id;

                return (
                  <Grow in={true} timeout={index * 100} key={conversation._id}>
                    <ListItem
                      button
                      selected={isSelected}
                      onClick={() => handleSelectConversation(conversation)}
                      sx={{
                        borderLeft: isSelected ? '4px solid' : 'none',
                        borderColor: 'primary.main',
                        py: 1.5,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'action.hover',
                          transform: 'translateX(2px)'
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          color="success"
                          invisible={!isOnline}
                        >
                          <Avatar
                            src={otherUser?.profilePicture}
                            alt={otherUser?.username}
                            sx={{
                              width: 48,
                              height: 48,
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            {otherUser?.username?.charAt(0).toUpperCase()}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography 
                              variant="subtitle2" 
                              noWrap 
                              sx={{ 
                                fontWeight: unreadCount > 0 ? 600 : 400,
                                fontFamily: FONT_FAMILIES.secondary,
                              }}
                            >
                              {otherUser?.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {conversation.lastMessageAt && formatConversationTime(conversation.lastMessageAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                              sx={{
                                fontWeight: unreadCount > 0 ? 500 : 400,
                                fontSize: '0.8125rem'
                              }}
                            >
                              {conversation.lastMessage?.image ? '📷 Image' : 
                               conversation.lastMessage?.fileName ? `📎 ${conversation.lastMessage.fileName}` : 
                               conversation.lastMessage?.content?.substring(0, 30) || 'Start conversation'}
                            </Typography>
                            {unreadCount > 0 && (
                              <Chip
                                label={unreadCount}
                                size="small"
                                color="primary"
                                sx={{ 
                                  minWidth: 20, 
                                  height: 20,
                                  '& .MuiChip-label': { 
                                    px: 0.5, 
                                    fontSize: '0.7rem',
                                    fontFamily: FONT_FAMILIES.mono,
                                  }
                                }}
                              />
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                  </Grow>
                );
              })}
            </List>
          )}
        </Box>
      </Box>

      {/* Main Chat Area */}
      <Box sx={{
        display: { xs: selectedUser ? 'flex' : 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <Box sx={{ 
              p: 2, 
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }}>
              <Box display="flex" alignItems="center" gap={2}>
                <IconButton 
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedConversation(null);
                    navigate('/direct/inbox');
                  }} 
                  sx={{ display: { md: 'none' } }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  color="success"
                  invisible={!onlineStatus[selectedUser._id]?.status === 'online'}
                >
                  <Avatar
                    src={selectedUser.profilePicture}
                    alt={selectedUser.username}
                    sx={{ 
                      width: 44, 
                      height: 44,
                      cursor: 'pointer',
                    }}
                    onClick={() => navigate(`/profile/${selectedUser.username}`)}
                  >
                    {selectedUser.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: FONT_FAMILIES.secondary,
                      fontWeight: 600,
                      cursor: 'pointer',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => navigate(`/profile/${selectedUser.username}`)}
                  >
                    {selectedUser.username}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {onlineStatus[selectedUser._id]?.status === 'online' ? (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CircleIcon sx={{ fontSize: 8, color: 'success.main' }} />
                        <Typography variant="caption" color="success.main">
                          Active now
                        </Typography>
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <CircleIcon sx={{ fontSize: 8, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled">
                          {formatLastSeen(onlineStatus[selectedUser._id]?.lastSeen)}
                        </Typography>
                      </Box>
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={1}>
                <IconButton>
                  <PhoneIcon />
                </IconButton>
                <IconButton>
                  <VideocamIcon />
                </IconButton>
                <IconButton onClick={() => setShowUserMenu(true)}>
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Reply Preview */}
            {replyTo && (
              <Box sx={{ 
                p: 1.5, 
                bgcolor: 'primary.50',
                borderBottom: 1,
                borderColor: 'divider',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" color="primary" fontWeight="bold" sx={{ mb: 0.5 }}>
                    Replying to {replyTo.sender._id === currentUserId ? 'yourself' : replyTo.sender.username}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {replyTo.content || (replyTo.image ? '📷 Image' : replyTo.fileName || 'Media')}
                  </Typography>
                </Box>
                <IconButton size="small" onClick={() => setReplyTo(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            )}

            {/* File Upload Preview */}
            {selectedFiles.length > 0 && (
              <Box sx={{ 
                p: 2, 
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Sending {selectedFiles.length} file(s)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedFiles.map((file, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        maxWidth: 200,
                        position: 'relative',
                      }}
                    >
                      <IconButton size="small" disabled>
                        {getFileIcon(file.type, file.name)}
                      </IconButton>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" noWrap sx={{ display: 'block', fontFamily: FONT_FAMILIES.mono }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {formatFileSize(file.size)}
                        </Typography>
                        {uploadProgress[file.name] !== undefined && (
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress[file.name]} 
                            sx={{ mt: 0.5 }}
                          />
                        )}
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={uploadingFiles.includes(file.name)}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}

            {/* Messages Container */}
            <Box 
              ref={messagesContainerRef}
              sx={{ 
                flex: 1,
                overflow: 'auto',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
              }}
            >
              {messageLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <CircularProgress />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, textAlign: 'center' }}>
                  <Box>
                    <Box sx={{ mb: 2, opacity: 0.5, animation: `${floatAnimation} 3s ease-in-out infinite` }}>
                      <SendIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
                    </Box>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      No messages yet
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Send a message to start the conversation!
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <>
                  {messages.map((message, index) => {
                    const isCurrentUser = message.sender._id === currentUserId;
                    const showTimestamp = index === 0 || 
                      new Date(message.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 5 * 60 * 1000;

                    return (
                      <React.Fragment key={message._id}>
                        {showTimestamp && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1 }}>
                            <Chip
                              label={formatMessageTime(message.createdAt)}
                              size="small"
                              sx={{ 
                                bgcolor: 'action.selected',
                                fontFamily: FONT_FAMILIES.mono,
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        )}
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            mb: 1,
                            alignItems: 'flex-end',
                            gap: 1,
                          }}
                        >
                          <MessageBubble isCurrentUser={isCurrentUser}>
                            {message.replyTo && (
                              <Box sx={{ 
                                p: 1, 
                                mb: 1, 
                                bgcolor: isCurrentUser ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
                                borderRadius: 1,
                                borderLeft: `3px solid ${isCurrentUser ? '#ffffff' : 'primary.main'}`
                              }}>
                                <Typography variant="caption" sx={{ display: 'block', fontWeight: 'bold', opacity: 0.8 }}>
                                  Replying to {message.replyTo.sender._id === currentUserId ? 'yourself' : message.replyTo.sender.username}
                                </Typography>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem', opacity: 0.9 }}>
                                  {message.replyTo.content || (message.replyTo.image ? '📷 Image' : message.replyTo.fileName || 'Media')}
                                </Typography>
                              </Box>
                            )}
                            
                            {!isCurrentUser && (
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  display: 'block', 
                                  fontWeight: 'bold', 
                                  mb: 0.5, 
                                  opacity: 0.8,
                                  cursor: 'pointer',
                                  '&:hover': { textDecoration: 'underline' }
                                }}
                                onClick={() => navigate(`/profile/${message.sender.username}`)}
                              >
                                {message.sender.username}
                              </Typography>
                            )}
                            
                            {message.image && (
                              <Box 
                                sx={{ 
                                  mb: 1, 
                                  borderRadius: 1,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  position: 'relative',
                                }}
                                onClick={() => setSelectedMedia(message.image)}
                              >
                                <img 
                                  src={message.image} 
                                  alt="Attachment" 
                                  style={{ 
                                    width: '100%', 
                                    maxWidth: 300,
                                    height: 'auto',
                                    display: 'block'
                                  }} 
                                />
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadAttachment(message.image, message.fileName || `file-${message._id}`);
                                  }}
                                  sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 8,
                                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                                    color: 'white',
                                    '&:hover': {
                                      bgcolor: 'rgba(0, 0, 0, 0.7)'
                                    }
                                  }}
                                >
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            )}
                            
                            {message.content && (
                              <Typography sx={{ 
                                wordBreak: 'break-word',
                                lineHeight: 1.4,
                                fontFamily: FONT_FAMILIES.primary,
                              }}>
                                {message.content}
                                {message.isEdited && (
                                  <Typography component="span" variant="caption" sx={{ 
                                    ml: 1, 
                                    opacity: 0.7,
                                    fontStyle: 'italic'
                                  }}>
                                    (edited)
                                  </Typography>
                                )}
                              </Typography>
                            )}
                            
                            {message.fileName && !message.image && (
                              <Paper
                                sx={{
                                  p: 1.5,
                                  mt: 1,
                                  bgcolor: isCurrentUser ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                  cursor: 'pointer',
                                  '&:hover': {
                                    bgcolor: isCurrentUser ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                                  }
                                }}
                                onClick={() => handleDownloadAttachment(message.image, message.fileName)}
                              >
                                <IconButton size="small" disabled>
                                  {getFileIcon(message.messageType, message.fileName)}
                                </IconButton>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap sx={{ fontFamily: FONT_FAMILIES.mono }}>
                                    {message.fileName}
                                  </Typography>
                                  {message.fileSize && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                      {formatFileSize(message.fileSize)}
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton size="small">
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            )}
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mt: 0.5
                            }}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem',
                                opacity: 0.7,
                                fontFamily: FONT_FAMILIES.mono,
                              }}>
                                {formatMessageTime(message.createdAt)}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {isCurrentUser && (
                                  <>
                                    {message.isRead ? (
                                      <CheckCircleIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                    ) : (
                                      <CheckIcon sx={{ fontSize: 14, opacity: 0.7 }} />
                                    )}
                                  </>
                                )}
                              </Box>
                            </Box>
                          </MessageBubble>
                        </Box>
                      </React.Fragment>
                    );
                  })}
                  
                  {/* Typing Indicator */}
                  {Object.keys(typingUsers).length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1 }}>
                      <TypingIndicator>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Dot delay="0s" />
                          <Dot delay="0.2s" />
                          <Dot delay="0.4s" />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {Object.values(typingUsers)[0]?.username || 'Someone'} is typing...
                        </Typography>
                      </TypingIndicator>
                    </Box>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </Box>

            {/* Message Input */}
            <Box component="form" onSubmit={handleSendMessage} sx={{ 
              p: 2, 
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}>
              {showEmojiPicker && (
                <Box 
                  ref={emojiPickerRef}
                  sx={{ 
                    position: 'absolute', 
                    bottom: '100%', 
                    right: 0, 
                    mb: 1,
                    zIndex: 20
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    width={300}
                    height={400}
                  />
                </Box>
              )}
              
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                <IconButton
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <EmojiIcon />
                </IconButton>
                
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf,.doc,.docx,.txt"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  sx={{ 
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' }
                  }}
                >
                  <AttachFileIcon />
                </IconButton>
                
                <TextField
                  fullWidth
                  placeholder="Message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  multiline
                  maxRows={4}
                  inputRef={inputRef}
                  InputProps={{
                    sx: { 
                      borderRadius: 24,
                      bgcolor: 'action.hover',
                      fontFamily: FONT_FAMILIES.primary,
                    },
                  }}
                  variant="outlined"
                  disabled={!socketConnected || isSending}
                />
                
                <IconButton
                  type="submit"
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending}
                  sx={{ 
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': { bgcolor: 'primary.dark' },
                    '&.Mui-disabled': { bgcolor: 'action.disabled' },
                    width: 40,
                    height: 40
                  }}
                >
                  {isSending ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%', 
            p: 3,
            textAlign: 'center'
          }}>
            <Box sx={{ 
              mb: 3,
              animation: `${floatAnimation} 3s ease-in-out infinite`
            }}>
              <SendIcon sx={{ 
                fontSize: 96, 
                color: 'primary.main',
                opacity: 0.8
              }} />
            </Box>
            <Typography 
              variant="h4" 
              color="textSecondary" 
              gutterBottom
              sx={{ fontFamily: FONT_FAMILIES.secondary, fontWeight: 600 }}
            >
              Your Messages
            </Typography>
            <Typography 
              variant="body1" 
              color="textSecondary" 
              paragraph
              sx={{ mb: 3, maxWidth: 400 }}
            >
              Send private messages to friends or groups.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setShowNewMessageDrawer(true)}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                '&:hover': { 
                  bgcolor: 'primary.dark',
                  transform: 'translateY(-2px)',
                  boxShadow: 3
                },
                textTransform: 'none',
                borderRadius: 2,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                transition: 'all 0.3s ease',
                fontFamily: FONT_FAMILIES.secondary,
              }}
            >
              Send Message
            </Button>
          </Box>
        )}
      </Box>

      {/* Media View Dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          <img 
            src={selectedMedia} 
            alt="Full size" 
            style={{ 
              width: '100%', 
              height: 'auto',
              display: 'block'
            }} 
          />
        </DialogContent>
        <DialogActions sx={{ p: 1 }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              handleDownloadAttachment(selectedMedia, 'chat-media.jpg');
              setSelectedMedia(null);
            }}
          >
            Download
          </Button>
          <IconButton onClick={() => setSelectedMedia(null)}>
            <CloseIcon />
          </IconButton>
        </DialogActions>
      </Dialog>

      {/* New Message Drawer */}
      <Drawer
        anchor="right"
        open={showNewMessageDrawer}
        onClose={() => setShowNewMessageDrawer(false)}
        PaperProps={{
          sx: { 
            width: { xs: '100%', sm: 400 },
            bgcolor: 'background.paper',
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 2, 
            borderBottom: 1, 
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <IconButton 
              onClick={() => setShowNewMessageDrawer(false)} 
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flex: 1, fontWeight: 'bold', fontFamily: FONT_FAMILIES.secondary }}>
              New Message
            </Typography>
          </Box>

          <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
            <TextField
              fullWidth
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                sx: { borderRadius: 3, fontFamily: FONT_FAMILIES.primary }
              }}
              size="small"
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {filteredFollowingUsers.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary" align="center">
                  {searchQuery ? 'No users found' : 'No users available'}
                </Typography>
              </Box>
            ) : (
              <List>
                {filteredFollowingUsers.map((user, index) => (
                  <ListItem
                    button
                    key={user._id}
                    onClick={() => {
                      setSelectedUser(user);
                      setSelectedConversation(null);
                      setMessages([]);
                      setShowNewMessageDrawer(false);
                      setTypingUsers({});
                      
                      const existingConv = conversations.find(conv => {
                        const otherUser = getOtherUser(conv);
                        return otherUser?._id === user._id;
                      });
                      
                      if (existingConv) {
                        handleSelectConversation(existingConv);
                      } else {
                        navigate('/direct/inbox');
                        showSnackbar(`Start chatting with ${user.username}`, 'info');
                      }
                    }}
                    sx={{ 
                      py: 1.5,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        transform: 'translateX(2px)'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar 
                        src={user.profilePicture} 
                        alt={user.username} 
                        sx={{
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        {user.username?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', fontFamily: FONT_FAMILIES.secondary }}>
                          {user.username}
                        </Typography>
                      }
                      secondary={
                        user.fullName && (
                          <Typography variant="caption" color="textSecondary" className="user-fullname">
                            {user.fullName}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        TransitionComponent={Slide}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AnimatedContainer>
  );
};

export default MessagesPage;