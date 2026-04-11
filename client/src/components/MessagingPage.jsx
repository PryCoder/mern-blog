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
  alpha,
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
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { uploadToCloudinary } from '../utils/cloudinary';

// Modern Color Scheme (default light mode)
const COLORS = {
  primary: {
    main: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  secondary: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
  },
  background: {
    default: '#ffffff',
    paper: '#f8fafc',
    surface: '#e2e8f0',
  },
  text: {
    primary: '#000000',
    secondary: '#64748b',
    disabled: '#94a3b8',
  },
};

// Animation keyframes
const floatAnimation = keyframes`
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-8px) scale(1.02); }
`;

const pulseGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 20px ${alpha(COLORS.primary.main, 0.3)};
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 40px ${alpha(COLORS.primary.main, 0.6)};
    transform: scale(1.02);
  }
`;

const typingAnimation = keyframes`
  0%, 100% { 
    transform: translateY(0px);
    opacity: 1;
  }
  50% { 
    transform: translateY(-6px);
    opacity: 0.7;
  }
`;

const slideInFromLeft = keyframes`
  from { 
    transform: translateX(-30px) scale(0.95);
    opacity: 0;
  }
  to { 
    transform: translateX(0) scale(1);
    opacity: 1;
  }
`;

const slideInFromRight = keyframes`
  from { 
    transform: translateX(30px) scale(0.95);
    opacity: 0;
  }
  to { 
    transform: translateX(0) scale(1);
    opacity: 1;
  }
`;

const fadeInUp = keyframes`
  from { 
    opacity: 0;
    transform: translateY(20px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const gradientShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Font families definition
const FONT_FAMILIES = {
  primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  secondary: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
  elegant: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  display: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
};

// Styled components
const GlassContainer = styled(Box)(({ theme }) => ({
  background: 'rgba(30, 41, 59, 0.7)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
}));

const AnimatedContainer = styled(Box)(({ theme }) => ({
  animation: `${fadeInUp} 0.6s cubic-bezier(0.4, 0, 0.2, 1)`,
  fontFamily: FONT_FAMILIES.primary,
}));

const MessageBubble = styled(Box)(({ theme, isCurrentUser }) => ({
  maxWidth: '75%',
  padding: theme.spacing(1.75, 2),
  borderRadius: '22px',
  background: isCurrentUser 
    ? COLORS.primary.gradient
    : `linear-gradient(135deg, ${COLORS.background.surface} 0%, ${alpha(COLORS.background.surface, 0.9)} 100%)`,
  color: isCurrentUser ? '#ffffff' : COLORS.text.primary,
  position: 'relative',
  boxShadow: isCurrentUser 
    ? '0 8px 32px rgba(99, 102, 241, 0.2)'
    : '0 4px 16px rgba(0, 0, 0, 0.2)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  animation: isCurrentUser 
    ? `${slideInFromRight} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)` 
    : `${slideInFromLeft} 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)`,
  border: isCurrentUser 
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid rgba(255, 255, 255, 0.05)',
  '&:hover': {
    boxShadow: isCurrentUser 
      ? '0 12px 48px rgba(99, 102, 241, 0.3)'
      : '0 8px 32px rgba(0, 0, 0, 0.3)',
    transform: 'translateY(-3px) scale(1.01)',
  },
  '&::before': isCurrentUser ? {
    content: '""',
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: '22px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    zIndex: -1,
    animation: `${gradientShift} 3s ease infinite`,
    backgroundSize: '200% 200%',
  } : {},
}));

const TypingIndicator = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1.5),
  padding: theme.spacing(1.5, 2),
  borderRadius: '22px',
  background: `linear-gradient(135deg, ${COLORS.background.surface} 0%, ${alpha(COLORS.background.surface, 0.9)} 100%)`,
  maxWidth: '75%',
  animation: `${fadeInUp} 0.3s ease-in`,
  border: '1px solid rgba(255, 255, 255, 0.05)',
  backdropFilter: 'blur(10px)',
}));

const Dot = styled(Box)(({ theme, delay }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  background: COLORS.primary.light,
  animation: `${typingAnimation} 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
  animationDelay: delay,
  boxShadow: `0 0 12px ${alpha(COLORS.primary.light, 0.5)}`,
}));

const ShimmerButton = styled(Button)(({ theme }) => ({
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `linear-gradient(
      90deg,
      transparent 0%,
      ${alpha('#ffffff', 0.1)} 50%,
      transparent 100%
    )`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 2s infinite`,
  },
}));

const MessagesPage = () => {
  const { currentUser } = useSelector((state) => state.user);
  const { theme } = useSelector(state => state.theme);
  const navigate = useNavigate();
  const { conversationId: urlConversationId } = useParams();
  
  // State management (keeping all existing state)
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [followingUsers, setFollowingUsers] = useState([]);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [showNewMessageDrawer, setShowNewMessageDrawer] = useState(false);
  const [newMessageMode, setNewMessageMode] = useState('dm'); // 'dm' | 'group'
  const [groupName, setGroupName] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState([]);
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

  // Refs (keeping all existing refs)
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

  // Get current user data safely (keeping all existing functions)
  const getCurrentUser = () => {
    try {
      const userFromStorage = JSON.parse(localStorage.getItem('user') || 'null');
      return userFromStorage || currentUser;
    } catch (error) {
      console.error('Error getting user data:', error);
      return currentUser;
    }
  };

  const getCurrentUserId = () => {
    const user = getCurrentUser();
    return user?._id || user?.id;
  };

  const getToken = () => {
    const user = getCurrentUser();
    return user?.token || localStorage.getItem('token');
  };

  const showSnackbar = useCallback((message, severity = 'info') => {
    if (mountedRef.current) {
      setSnackbar({ open: true, message, severity });
    }
  }, []);

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

  const getOtherUser = (conversation) => {
    if (!conversation || !conversation.participants || !Array.isArray(conversation.participants)) return null;
    const userId = getCurrentUserId();
    if (!userId) return null;

    const userIdStr = userId.toString();
    return (
      conversation.participants.find((p) => {
        const pid = typeof p === 'string' ? p : p?._id;
        return pid && pid.toString() !== userIdStr;
      }) || null
    );
  };

  const getConversationTitle = (conversation) => {
    if (!conversation) return '';
    if (conversation.isGroup) return conversation.name || 'Group';
    return getOtherUser(conversation)?.username || 'Conversation';
  };

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

  // Socket event handlers (keeping all existing handlers)
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

  // API Calls (keeping all existing API functions)
  const fetchConversations = useCallback(async () => {
    const userId = getCurrentUserId();
    const token = getToken();
    
    if (!userId) return;
    
    try {
      if (mountedRef.current) setLoading(true);
      const response = await axios.get(`/api/messages/conversations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 20000,
      });
      
      if (mountedRef.current) {
        setConversations(response.data || []);
      }
      
      const allUserIds = [];
      response.data?.forEach(conv => {
        if (conv?.isGroup) return;
        const otherUser = getOtherUser(conv);
        if (otherUser?._id) allUserIds.push(otherUser._id);
      });
      
      if (allUserIds.length > 0) {
        fetchOnlineStatus(allUserIds);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      if (mountedRef.current) {
        if (error?.code === 'ECONNABORTED') {
          showSnackbar('Request timed out (server/database not responding)', 'error');
        } else {
          showSnackbar('Failed to load conversations', 'error');
        }
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [showSnackbar]);

  const fetchMessages = useCallback(async (userId) => {
    const currentUserId = getCurrentUserId();
    const token = getToken();
    
    if (!currentUserId || !userId) return;
    
    try {
      if (mountedRef.current) setMessageLoading(true);
      // 1:1 legacy endpoint (user-to-user)
      const response = await axios.get(`/api/messages/user/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 20000,
      });
      
      if (mountedRef.current) {
        setMessages(response.data || []);
        setTimeout(() => scrollToBottom(), 300);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      if (mountedRef.current) {
        if (error?.code === 'ECONNABORTED') {
          showSnackbar('Request timed out (server/database not responding)', 'error');
        } else {
          showSnackbar('Failed to load messages', 'error');
        }
      }
    } finally {
      if (mountedRef.current) setMessageLoading(false);
    }
  }, [showSnackbar]);

  const fetchConversationMessages = useCallback(async (conversationId) => {
    const token = getToken();
    if (!conversationId) return;

    try {
      if (mountedRef.current) setMessageLoading(true);
      const response = await axios.get(`/api/messages/conversations/${conversationId}/messages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 20000,
      });

      if (mountedRef.current) {
        setMessages(response.data || []);
        setTimeout(() => scrollToBottom(), 300);
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      if (mountedRef.current) {
        if (error?.code === 'ECONNABORTED') {
          showSnackbar('Request timed out (server/database not responding)', 'error');
        } else {
          showSnackbar('Failed to load messages', 'error');
        }
      }
    } finally {
      if (mountedRef.current) setMessageLoading(false);
    }
  }, [showSnackbar]);

  const createGroupConversation = useCallback(async () => {
    const token = getToken();

    const name = groupName.trim();
    if (!name) {
      showSnackbar('Group name is required', 'warning');
      return;
    }
    if (groupMemberIds.length < 2) {
      showSnackbar('Select at least 2 members', 'warning');
      return;
    }

    try {
      const response = await axios.post(
        `/api/messages/conversations/group`,
        { name, participantIds: groupMemberIds },
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true, timeout: 20000 }
      );

      const created = response.data?.conversation;
      if (!created?._id) {
        showSnackbar('Failed to create group', 'error');
        return;
      }

      if (mountedRef.current) {
        setConversations((prev) => [created, ...(prev || [])]);
        setShowNewMessageDrawer(false);
        setSearchQuery('');
        setNewMessageMode('dm');
        setGroupName('');
        setGroupMemberIds([]);
      }

      handleSelectConversation(created);
      showSnackbar('Group created', 'success');
    } catch (error) {
      console.error('Error creating group conversation:', error);
      const msg = error.response?.data?.message || 'Failed to create group';
      showSnackbar(msg, 'error');
    }
  }, [groupName, groupMemberIds, showSnackbar]);

  const fetchFollowingUsers = useCallback(async () => {
    const token = getToken();
    
    try {
      const response = await axios.get(`/api/messages/following/messaging`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 20000,
      });
      
      if (mountedRef.current) {
        setFollowingUsers(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching following users:', error);
    }
  }, []);

  const searchAllUsers = useCallback(async (query) => {
    const token = getToken();
    const q = (query || '').trim();
    if (!q) {
      if (mountedRef.current) setSearchedUsers([]);
      return;
    }

    try {
      if (mountedRef.current) setUserSearchLoading(true);
      const response = await axios.get(`/api/user/search?query=${encodeURIComponent(q)}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
          timeout: 20000,
        }
      );

      const list = response.data?.users || response.data?.users?.users || response.data?.users || [];
      const myId = getCurrentUserId();
      const myIdStr = myId ? myId.toString() : null;

      const normalized = Array.isArray(list) ? list : [];
      const filtered = myIdStr ? normalized.filter((u) => u?._id?.toString() !== myIdStr) : normalized;

      if (mountedRef.current) setSearchedUsers(filtered);
    } catch (error) {
      console.error('Error searching users:', error);
      if (mountedRef.current) setSearchedUsers([]);
    } finally {
      if (mountedRef.current) setUserSearchLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showNewMessageDrawer) return;
    const q = (searchQuery || '').trim();
    if (!q) {
      setSearchedUsers([]);
      return;
    }

    const t = setTimeout(() => {
      searchAllUsers(q);
    }, 350);

    return () => clearTimeout(t);
  }, [searchQuery, showNewMessageDrawer, searchAllUsers]);

  const fetchUnreadCount = useCallback(async () => {
    const token = getToken();
    
    try {
      const response = await axios.get(`/api/messages/unread/count`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
        timeout: 20000,
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
    if (!userIds || userIds.length === 0) return;
    
    try {
      const response = await axios.post(`/api/messages/online-status`, 
        { userIds },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
          timeout: 20000,
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

  // Cloudinary Upload Function
  const uploadFileToCloudinary = async (file) => {
    if (!file) return null;

    try {
      const downloadURL = await uploadToCloudinary(file, (progress) => {
        setUploadProgress(prev => ({
          ...prev,
          [file.name]: progress
        }));
      });
      return downloadURL;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Handle file selection (keeping existing)
  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        showSnackbar(`${file.name} exceeds 10MB limit`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setSelectedFiles(prev => [...prev, ...validFiles]);
    
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

    await handleUploadFiles(validFiles);
  };

  const handleUploadFiles = async (files) => {
    const token = getToken();
    if (!selectedConversation || files.length === 0) return;

    // If we're not sending to a group conversation, we must have a selected user (DM).
    if (!selectedConversation?.isGroup && !selectedUser?._id) {
      showSnackbar('Select a user to message', 'warning');
      return;
    }

    setIsSending(true);
    setUploadingFiles(files.map(f => f.name));

    try {
      const uploadPromises = files.map(async (file) => {
        try {
          const downloadURL = await uploadFileToCloudinary(file);
          
          let messageType = 'file';
          if (file.type.startsWith('image/')) messageType = 'image';
          if (file.type.startsWith('video/')) messageType = 'video';
          if (file.type === 'application/pdf') messageType = 'pdf';
          
          const payload = selectedConversation?.isGroup
            ? {
                conversationId: selectedConversation._id,
                content: newMessage.trim() || '',
                imageUrl: downloadURL,
                messageType,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                replyTo: replyTo?._id,
              }
            : {
                receiverId: selectedUser?._id,
                content: newMessage.trim() || '',
                imageUrl: downloadURL,
                messageType,
                fileName: file.name,
                fileSize: file.size,
                fileType: file.type,
                replyTo: replyTo?._id,
              };

          const response = await axios.post(`/api/messages/send`, payload,
            {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              withCredentials: true,
              timeout: 20000,
            }
          );

          return response.data.message;
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const uploadedMessages = await Promise.all(uploadPromises);
      
      uploadedMessages.forEach(message => {
        if (message) {
          setMessages(prev => [...prev, message]);
        }
      });

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
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        showSnackbar(serverMsg, 'error');
      } else if (error?.code === 'ECONNABORTED') {
        showSnackbar('Send timed out (server/database not responding)', 'error');
      } else if (error?.response?.status === 401) {
        showSnackbar('Unauthorized: please sign in again', 'error');
      } else {
        showSnackbar('Failed to send files', 'error');
      }
    } finally {
      setIsSending(false);
      setUploadingFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle text message send (keeping existing)
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = getToken();
    
    const canSendDM = !!selectedUser?._id;
    const canSendGroup = !!selectedConversation?._id && selectedConversation?.isGroup;

    if ((!newMessage.trim() && selectedFiles.length === 0) || (!canSendDM && !canSendGroup) || isSending) {
      if (!newMessage.trim() && selectedFiles.length === 0) {
        showSnackbar('Cannot send empty message', 'warning');
      }
      return;
    }

    if (!selectedConversation?.isGroup && !selectedUser?._id) {
      showSnackbar('Select a user to message', 'warning');
      return;
    }

   

    try {
      let response;
      
      if (selectedFiles.length > 0) {
        await handleUploadFiles(selectedFiles);
      } else {
        const payload = selectedConversation?.isGroup
          ? {
              conversationId: selectedConversation._id,
              content: newMessage.trim(),
              replyTo: replyTo?._id,
            }
          : {
              receiverId: selectedUser?._id,
              content: newMessage.trim(),
              replyTo: replyTo?._id,
            };

        response = await axios.post(`/api/messages/send`, payload,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
            timeout: 20000,
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

        // If this was a brand-new DM (no conversation selected), load conversations and select the newly created one
        if (!selectedConversation?._id && response.data?.conversationId) {
          try {
            const convoRes = await axios.get(`/api/messages/conversations`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
              withCredentials: true,
              timeout: 20000,
            });
            const list = convoRes.data || [];
            if (mountedRef.current) setConversations(list);
            const created = list.find((c) => c?._id === response.data.conversationId);
            if (created) {
              handleSelectConversation(created);
            }
          } catch (e) {
            console.error('Error reloading conversations after first message:', e);
          }
        }

        setNewMessage('');
        setReplyTo(null);
      }

      if (inputRef.current) inputRef.current.focus();
      
      if (selectedConversation && socketService.connected && !selectedConversation.isGroup && selectedUser?._id) {
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
      const serverMsg = error?.response?.data?.message;
      if (serverMsg) {
        showSnackbar(serverMsg, 'error');
      } else if (error?.code === 'ECONNABORTED') {
        showSnackbar('Send timed out (server/database not responding)', 'error');
      } else if (error.response?.status === 403) {
        showSnackbar('You can only message users you follow or who follow you', 'error');
      } else if (error.response?.status === 401) {
        showSnackbar('Unauthorized: please sign in again', 'error');
      } else {
        showSnackbar('Failed to send message', 'error');
      }
    } 
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);
    
    if (selectedConversation && selectedUser && !selectedConversation.isGroup && socketConnected && socketService.connected) {
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

  const handleRemoveFile = (fileName) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setMediaPreview(prev => {
      const newPreview = { ...prev };
      delete newPreview[fileName];
      return newPreview;
    });
  };

  const handleDownloadAttachment = (fileUrl, fileName) => {
    try {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName || '';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  
      showSnackbar('File downloaded', 'success');
    } catch (error) {
      console.error('Error downloading file:', error);
      showSnackbar('Failed to download file', 'error');
    }
  };
  
  const quickReactions = ['❤️', '😂', '😮', '😢', '👏', '🔥'];

  const getFileIcon = (fileType, fileName) => {
    if (fileType?.startsWith('image/')) return <ImageIcon />;
    if (fileType?.startsWith('video/')) return <VideoFileIcon />;
    if (fileType === 'application/pdf') return <PdfIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectConversation = (conversation) => {
    const otherUser = getOtherUser(conversation);
    // For group chats there is no single "other user"
    if (!conversation?.isGroup && !otherUser) {
      showSnackbar('Unable to open this chat (missing participant info)', 'error');
      return;
    }
    
    setSelectedConversation(conversation);
    setSelectedUser(conversation?.isGroup ? null : otherUser);
    setMessages([]);
    setTypingUsers({});
    setShowEmojiPicker(false);
    setReplyTo(null);
    setQuickEmojiPicker(null);
    setSelectedFiles([]);
    setMediaPreview({});
    
    navigate(`/direct/t/${conversation._id}`, { replace: true });

    fetchConversationMessages(conversation._id);
    
    if (socketConnected && socketService.connected) {
      socketService.joinConversation(conversation._id);
    }
    
    if (getUnreadCountForConversation(conversation) > 0) {
      if (conversation?.isGroup) {
        markConversationAsRead(conversation._id);
      } else {
        markAsRead(otherUser._id, conversation._id);
      }
    }
  };

  const markConversationAsRead = async (conversationId) => {
    const token = getToken();
    if (!conversationId) return;

    try {
      await axios.put(
        `/api/messages/conversations/${conversationId}/mark-read`,
        {},
        { headers: token ? { Authorization: `Bearer ${token}` } : {}, withCredentials: true, timeout: 20000 }
      );
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  };

  const markAsRead = async (senderId, conversationId) => {
    const token = getToken();
    if (!senderId || !conversationId) return;

    try {
      await axios.put(`${API_BASE_URL}/messages/mark-read`,
        { senderId, conversationId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
          timeout: 20000,
        }
      );
      
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleEmojiClick = (emojiObject) => {
    setNewMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    if (inputRef.current) inputRef.current.focus();
  };

  // Socket setup (keeping existing)
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

  useEffect(() => {
    const token = getToken();
    if (token) {
      fetchConversations();
      fetchFollowingUsers();
      fetchUnreadCount();
    }
  }, [fetchConversations, fetchFollowingUsers, fetchUnreadCount]);

  useEffect(() => {
    if (urlConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c._id === urlConversationId);
      if (conversation) {
        handleSelectConversation(conversation);
      }
    }
  }, [urlConversationId, conversations]);

  // Add this useEffect to handle click outside emoji picker
useEffect(() => {
  const handleClickOutside = (event) => {
    if (showEmojiPicker && emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
      // Check if the click was on the emoji button
      const isEmojiButton = event.target.closest('button[aria-label*="emoji"]') || 
                           event.target.closest('.MuiIconButton-root');
      
      if (!isEmojiButton) {
        setShowEmojiPicker(false);
      }
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showEmojiPicker]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

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

  const user = getCurrentUser();
  if (!user) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor={COLORS.background.default}>
        <CircularProgress sx={{ color: COLORS.primary.main }} />
      </Box>
    );
  }

  const currentUserId = getCurrentUserId();

  return (
    <AnimatedContainer sx={{ 
      height: '100vh',
      display: 'flex',
      overflow: 'hidden',
      bgcolor: COLORS.background.default,
      color: COLORS.text.primary,
      fontFamily: FONT_FAMILIES.primary,
    }} className="dark:bg-gray-800 dark:text-white">
      {/* Connection Status */}
      <Slide direction="down" in={!socketConnected} mountOnEnter unmountOnExit>
        <Box sx={{ 
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999
        }} className="dark:bg-yellow-900 dark:border-yellow-700">
          <Alert 
            severity="warning" 
            sx={{ 
              borderRadius: 0,
              animation: `${pulseGlow} 2s infinite`,
              fontFamily: FONT_FAMILIES.secondary,
              bgcolor: alpha('#f59e0b', 0.1),
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}
          >
            <CircularProgress size={16} sx={{ mr: 1, color: '#f59e0b' }} />
            Connecting to chat service... {connectionAttempts > 0 && `(Attempt ${connectionAttempts})`}
          </Alert>
        </Box>
      </Slide>

      {/* Sidebar */}
      <GlassContainer sx={{
        display: { xs: selectedConversation ? 'none' : 'flex', md: 'flex' },
        flexDirection: 'column',
        width: { xs: '100%', md: 380 },
        m: 2,
        mr: { md: 1 },
        overflow: 'hidden',
      }} className="dark:bg-gray-900/70 dark:border-gray-700/10">
        {/* Sidebar Header */}
        <Box sx={{ 
          p: 3, 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }} className="dark:border-gray-700/10">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar 
              src={user.profilePicture}
              sx={{ 
                width: 48, 
                height: 48,
                border: `2px solid ${COLORS.primary.main}`,
                animation: `${pulseGlow} 3s infinite`,
              }}
            >
              {user.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontFamily: FONT_FAMILIES.display,
                  fontWeight: 700,
                  background: COLORS.primary.gradient,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Messages
              </Typography>
              {unreadCount > 0 && (
                <Typography variant="caption" sx={{ 
                  color: COLORS.primary.light,
                  fontFamily: FONT_FAMILIES.mono,
                  fontWeight: 'bold',
                }}>
                  {unreadCount} unread
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton 
            onClick={() => setShowNewMessageDrawer(true)}
            sx={{ 
              color: COLORS.primary.light,
              animation: `${floatAnimation} 3s ease-in-out infinite`,
              bgcolor: alpha(COLORS.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(COLORS.primary.main, 0.2),
              }
            }}
          >
            <EditIcon />
          </IconButton>
        </Box>

        {/* Search */}
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: COLORS.text.secondary }} />
                </InputAdornment>
              ),
              sx: { 
                borderRadius: 3,
                fontFamily: FONT_FAMILIES.primary,
                bgcolor: alpha(COLORS.background.surface, 0.5),
                border: '1px solid rgba(255, 255, 255, 0.05)',
                color: COLORS.text.primary,
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover': {
                  bgcolor: alpha(COLORS.background.surface, 0.7),
                }
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
              <CircularProgress sx={{ color: COLORS.primary.main }} />
            </Box>
          ) : filteredConversations.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Box sx={{ 
                mb: 3, 
                opacity: 0.7, 
                animation: `${floatAnimation} 3s ease-in-out infinite` 
              }}>
                <EditIcon sx={{ 
                  fontSize: 56, 
                  color: COLORS.primary.light,
                  filter: 'drop-shadow(0 0 20px rgba(99, 102, 241, 0.5))'
                }} />
              </Box>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: FONT_FAMILIES.secondary,
                  color: COLORS.text.secondary,
                  mb: 1
                }}
              >
                No conversations yet
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: COLORS.text.disabled,
                  mb: 2,
                  fontFamily: FONT_FAMILIES.primary
                }}
              >
                Start your first conversation
              </Typography>
              <Button 
                variant="contained"
                onClick={() => setShowNewMessageDrawer(true)}
                sx={{ 
                  mt: 1, 
                  textTransform: 'none',
                  fontFamily: FONT_FAMILIES.secondary,
                  fontWeight: 600,
                  background: COLORS.primary.gradient,
                  '&:hover': {
                    background: COLORS.primary.gradient,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 12px 40px ${alpha(COLORS.primary.main, 0.3)}`,
                  }
                }}
              >
                New Message
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 1 }}>
              {filteredConversations.map((conversation, index) => {
                const otherUser = conversation?.isGroup ? null : getOtherUser(conversation);
                const unreadCount = getUnreadCountForConversation(conversation);
                const isOnline = otherUser?._id ? onlineStatus[otherUser._id]?.status === 'online' : false;
                const isSelected = selectedConversation?._id === conversation._id;
                const title = getConversationTitle(conversation);

                return (
                  <Grow in={true} timeout={index * 100} key={conversation._id}>
                    <ListItem
                      button
                      selected={isSelected}
                      onClick={() => handleSelectConversation(conversation)}
                      sx={{
                        borderRadius: 3,
                        mb: 1,
                        mx: 1,
                        py: 1.5,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        bgcolor: isSelected 
                          ? alpha(COLORS.primary.main, 0.15)
                          : 'transparent',
                        border: isSelected 
                          ? `1px solid ${alpha(COLORS.primary.main, 0.3)}`
                          : '1px solid transparent',
                        '&:hover': {
                          bgcolor: alpha(COLORS.primary.main, 0.1),
                          transform: 'translateX(4px)',
                          border: `1px solid ${alpha(COLORS.primary.main, 0.2)}`,
                        },
                        '&.Mui-selected': {
                          bgcolor: alpha(COLORS.primary.main, 0.15),
                          '&:hover': {
                            bgcolor: alpha(COLORS.primary.main, 0.2),
                          }
                        }
                      }}
                    >
                      <ListItemAvatar>
                        {conversation?.isGroup ? (
                          <Avatar
                            sx={{
                              width: 52,
                              height: 52,
                              transition: 'all 0.3s ease',
                              border: `2px solid ${alpha(COLORS.primary.main, 0.3)}`,
                              bgcolor: alpha(COLORS.primary.main, 0.25),
                            }}
                          >
                            {(conversation?.name || 'G').charAt(0).toUpperCase()}
                          </Avatar>
                        ) : (
                          <Badge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            variant="dot"
                            sx={{
                              '& .MuiBadge-dot': {
                                backgroundColor: isOnline ? COLORS.secondary.main : COLORS.text.disabled,
                                boxShadow: `0 0 8px ${isOnline ? COLORS.secondary.main : COLORS.text.disabled}`,
                                width: 12,
                                height: 12,
                                border: `2px solid ${COLORS.background.paper}`,
                              }
                            }}
                          >
                            <Avatar
                              src={otherUser?.profilePicture}
                              alt={otherUser?.username}
                              sx={{
                                width: 52,
                                height: 52,
                                transition: 'all 0.3s ease',
                                border: `2px solid ${alpha(COLORS.primary.main, 0.3)}`,
                                '&:hover': {
                                  transform: 'scale(1.1) rotate(5deg)',
                                }
                              }}
                            >
                              {otherUser?.username?.charAt(0).toUpperCase()}
                            </Avatar>
                          </Badge>
                        )}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" justifyContent="space-between" alignItems="center">
                            <Typography 
                              variant="subtitle1" 
                              noWrap 
                              sx={{ 
                                fontWeight: unreadCount > 0 ? 700 : 600,
                                fontFamily: FONT_FAMILIES.elegant,
                                color: COLORS.text.primary,
                              }}
                            >
                              {title}
                            </Typography>
                            <Typography variant="caption" sx={{ 
                              color: COLORS.text.disabled,
                              fontFamily: FONT_FAMILIES.mono,
                              fontSize: '0.75rem'
                            }}>
                              {conversation.lastMessageAt && formatConversationTime(conversation.lastMessageAt)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.5}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                fontWeight: unreadCount > 0 ? 600 : 400,
                                fontSize: '0.875rem',
                                color: unreadCount > 0 ? COLORS.text.primary : COLORS.text.secondary,
                                fontFamily: FONT_FAMILIES.primary,
                              }}
                            >
                              {conversation.lastMessage?.image ? '📷 Image' : 
                               conversation.lastMessage?.fileName ? `📎 ${conversation.lastMessage.fileName}` : 
                               conversation.lastMessage?.content?.substring(0, 28) || 'Start conversation'}
                            </Typography>
                            {unreadCount > 0 && (
                              <Box sx={{
                                minWidth: 22,
                                height: 22,
                                borderRadius: '50%',
                                bgcolor: COLORS.primary.main,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                animation: `${pulseGlow} 2s infinite`,
                              }}>
                                <Typography variant="caption" sx={{ 
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem',
                                  fontFamily: FONT_FAMILIES.mono,
                                }}>
                                  {unreadCount}
                                </Typography>
                              </Box>
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
      </GlassContainer>

      {/* Main Chat Area */}
      <Box sx={{
        display: { xs: selectedConversation ? 'flex' : 'none', md: 'flex' },
        flex: 1,
        flexDirection: 'column',
        m: 2,
        ml: { md: 1 },
      }}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <GlassContainer sx={{ 
              p: 2.5, 
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
            }} className="dark:bg-gray-900/70 dark:border-gray-700/10">
              <Box display="flex" alignItems="center" gap={2.5}>
                <IconButton 
                  onClick={() => {
                    setSelectedUser(null);
                    setSelectedConversation(null);
                    navigate('/direct/inbox');
                  }} 
                  sx={{ 
                    display: { md: 'none' },
                    color: COLORS.text.secondary,
                    '&:hover': {
                      color: COLORS.primary.light,
                      bgcolor: alpha(COLORS.primary.main, 0.1),
                    }
                  }}
                >
                  <ArrowBackIcon />
                </IconButton>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  variant="dot"
                  sx={{
                    '& .MuiBadge-dot': {
                      backgroundColor: onlineStatus[selectedUser?._id]?.status === 'online' 
                        ? COLORS.secondary.main 
                        : COLORS.text.disabled,
                      boxShadow: `0 0 12px ${onlineStatus[selectedUser?._id]?.status === 'online' 
                        ? COLORS.secondary.main 
                        : COLORS.text.disabled}`,
                      width: 14,
                      height: 14,
                      border: `2px solid ${COLORS.background.paper}`,
                    }
                  }}
                >
                  <Avatar
                    src={selectedConversation?.isGroup ? undefined : selectedUser?.profilePicture}
                    alt={selectedConversation?.isGroup ? (selectedConversation?.name || 'Group') : selectedUser?.username}
                    sx={{ 
                      width: 52, 
                      height: 52,
                      cursor: 'pointer',
                      border: `2px solid ${alpha(COLORS.primary.main, 0.3)}`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.1)',
                        border: `2px solid ${COLORS.primary.main}`,
                      }
                    }}
                    onClick={() => {
                      if (!selectedConversation?.isGroup && selectedUser?._id) {
                        navigate(`/profile/${selectedUser._id}`);
                      }
                    }}
                    
                  >
                    {(selectedConversation?.isGroup
                      ? (selectedConversation?.name || 'G')
                      : (selectedUser?.username || 'U'))
                      .charAt(0)
                      .toUpperCase()}
                  </Avatar>
                </Badge>
                <Box>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: FONT_FAMILIES.display,
                      fontWeight: 700,
                      cursor: 'pointer',
                      color: COLORS.text.primary,
                      '&:hover': { 
                        color: COLORS.primary.light,
                      },
                      transition: 'color 0.2s ease',
                    }}
                    onClick={() => {
                      if (!selectedConversation?.isGroup && selectedUser?._id) {
                        navigate(`/profile/${selectedUser._id}`);
                      }
                    }}
                  >
                    {selectedConversation?.isGroup
                      ? (selectedConversation?.name || 'Group')
                      : (selectedUser?.username || 'Chat')}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    fontFamily: FONT_FAMILIES.primary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: onlineStatus[selectedUser?._id]?.status === 'online' 
                      ? COLORS.secondary.light 
                      : COLORS.text.disabled,
                  }}>
                    <CircleIcon sx={{ 
                      fontSize: 10, 
                      color: onlineStatus[selectedUser?._id]?.status === 'online' 
                        ? COLORS.secondary.main 
                        : 'inherit',
                      animation: onlineStatus[selectedUser?._id]?.status === 'online' 
                        ? `${pulseGlow} 2s infinite`
                        : 'none',
                    }} />
                    {selectedConversation?.isGroup
                      ? 'Group chat'
                      : (onlineStatus[selectedUser?._id]?.status === 'online'
                          ? 'Active now'
                          : formatLastSeen(onlineStatus[selectedUser?._id]?.lastSeen))}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" gap={0.5}>
                <IconButton sx={{
                  color: COLORS.text.secondary,
                  '&:hover': {
                    color: COLORS.primary.light,
                    bgcolor: alpha(COLORS.primary.main, 0.1),
                  }
                }}>
                  <PhoneIcon />
                </IconButton>
                <IconButton sx={{
                  color: COLORS.text.secondary,
                  '&:hover': {
                    color: COLORS.primary.light,
                    bgcolor: alpha(COLORS.primary.main, 0.1),
                  }
                }}>
                  <VideocamIcon />
                </IconButton>
                <IconButton 
                  onClick={() => setShowUserMenu(true)}
                  sx={{
                    color: COLORS.text.secondary,
                    '&:hover': {
                      color: COLORS.primary.light,
                      bgcolor: alpha(COLORS.primary.main, 0.1),
                    }
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Box>
            </GlassContainer>

            {/* Reply Preview */}
            {replyTo && (
              <GlassContainer sx={{ 
                p: 2, 
                mb: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${alpha(COLORS.primary.main, 0.2)}`,
              }} className="dark:bg-gray-900/70 dark:border-indigo-700">
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ 
                    mb: 0.5, 
                    fontWeight: 'bold',
                    color: COLORS.primary.light,
                    fontFamily: FONT_FAMILIES.secondary,
                  }}>
                    Replying to {replyTo.sender._id === currentUserId ? 'yourself' : replyTo.sender.username}
                  </Typography>
                  <Typography variant="body2" noWrap sx={{
                    color: COLORS.text.secondary,
                    fontFamily: FONT_FAMILIES.primary,
                  }}>
                    {replyTo.content || (replyTo.image ? '📷 Image' : replyTo.fileName || 'Media')}
                  </Typography>
                </Box>
                <IconButton 
                  size="small" 
                  onClick={() => setReplyTo(null)}
                  sx={{
                    color: COLORS.text.disabled,
                    '&:hover': {
                      color: COLORS.primary.light,
                    }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </GlassContainer>
            )}

            {/* File Upload Preview */}
            {selectedFiles.length > 0 && (
              <GlassContainer sx={{ 
                p: 2.5, 
                mb: 2,
                border: `1px solid ${alpha(COLORS.primary.main, 0.2)}`,
              }} className="dark:bg-gray-900/70 dark:border-indigo-700">
                <Typography variant="caption" sx={{ 
                  mb: 1.5, 
                  display: 'block',
                  color: COLORS.text.secondary,
                  fontFamily: FONT_FAMILIES.secondary,
                }}>
                  Sending {selectedFiles.length} file(s)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                  {selectedFiles.map((file, index) => (
                    <Paper
                      key={index}
                      sx={{
                        p: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        maxWidth: 220,
                        position: 'relative',
                        bgcolor: alpha(COLORS.background.surface, 0.5),
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: 2,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 8px 32px ${alpha(COLORS.background.default, 0.3)}`,
                        }
                      }}
                    >
                      <IconButton size="small" disabled sx={{
                        bgcolor: alpha(COLORS.primary.main, 0.1),
                        color: COLORS.primary.light,
                      }}>
                        {getFileIcon(file.type, file.name)}
                      </IconButton>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" noWrap sx={{ 
                          display: 'block', 
                          fontFamily: FONT_FAMILIES.mono,
                          color: COLORS.text.primary,
                        }}>
                          {file.name}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          display: 'block',
                          color: COLORS.text.disabled,
                        }}>
                          {formatFileSize(file.size)}
                        </Typography>
                        {uploadProgress[file.name] !== undefined && (
                          <LinearProgress 
                            variant="determinate" 
                            value={uploadProgress[file.name]} 
                            sx={{ 
                              mt: 0.5,
                              height: 3,
                              borderRadius: 1.5,
                              bgcolor: alpha(COLORS.background.surface, 0.3),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: COLORS.primary.gradient,
                              }
                            }}
                          />
                        )}
                      </Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={uploadingFiles.includes(file.name)}
                        sx={{
                          color: COLORS.text.disabled,
                          '&:hover': {
                            color: COLORS.primary.light,
                          }
                        }}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Paper>
                  ))}
                </Box>
              </GlassContainer>
            )}

            {/* Messages Container */}
            <Box 
              ref={messagesContainerRef}
              sx={{ 
                flex: 1,
                overflow: 'auto',
                p: 3,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              {messageLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                  <CircularProgress sx={{ color: COLORS.primary.main }} />
                </Box>
              ) : messages.length === 0 ? (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  flex: 1, 
                  textAlign: 'center' 
                }}>
                  <Box>
                    <Box sx={{ 
                      mb: 3, 
                      opacity: 0.7, 
                      animation: `${floatAnimation} 3s ease-in-out infinite` 
                    }}>
                      <SendIcon sx={{ 
                        fontSize: 72, 
                        color: COLORS.primary.light,
                        filter: 'drop-shadow(0 0 30px rgba(99, 102, 241, 0.5))'
                      }} />
                    </Box>
                    <Typography 
                      variant="h5" 
                      gutterBottom
                      sx={{ 
                        fontFamily: FONT_FAMILIES.display,
                        fontWeight: 700,
                        color: COLORS.text.primary,
                        mb: 1
                      }}
                    >
                      Start the conversation
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: COLORS.text.secondary,
                        mb: 3,
                        maxWidth: 400,
                        mx: 'auto',
                        fontFamily: FONT_FAMILIES.primary,
                      }}
                    >
                      {selectedConversation?.isGroup
                        ? `Send your first message to begin chatting in ${selectedConversation?.name || 'this group'}`
                        : `Send your first message to begin chatting with ${selectedUser?.username || 'this user'}`}
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
                          <Box sx={{ display: 'flex', justifyContent: 'center', my: 1.5 }}>
                            <Chip
                              label={formatMessageTime(message.createdAt)}
                              size="small"
                              sx={{ 
                                bgcolor: alpha(COLORS.background.surface, 0.5),
                                color: COLORS.text.secondary,
                                fontFamily: FONT_FAMILIES.mono,
                                fontSize: '0.75rem',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                              }}
                            />
                          </Box>
                        )}
                        
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                            mb: 2,
                            alignItems: 'flex-end',
                            gap: 1,
                          }}
                        >
                          <MessageBubble isCurrentUser={isCurrentUser}>
                            {message.replyTo && (
                              <Box sx={{ 
                                p: 1.5, 
                                mb: 1.5, 
                                bgcolor: isCurrentUser 
                                  ? 'rgba(255, 255, 255, 0.15)' 
                                  : alpha(COLORS.background.surface, 0.3),
                                borderRadius: 1.5,
                                borderLeft: `3px solid ${isCurrentUser ? 'rgba(255, 255, 255, 0.5)' : COLORS.primary.main}`
                              }}>
                                <Typography variant="caption" sx={{ 
                                  display: 'block', 
                                  fontWeight: 'bold', 
                                  opacity: 0.9,
                                  color: isCurrentUser ? 'rgba(255, 255, 255, 0.9)' : COLORS.text.primary,
                                  fontFamily: FONT_FAMILIES.secondary,
                                }}>
                                  Replying to {message.replyTo.sender._id === currentUserId ? 'yourself' : message.replyTo.sender.username}
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                  fontSize: '0.875rem', 
                                  opacity: 0.8,
                                  color: isCurrentUser ? 'rgba(255, 255, 255, 0.8)' : COLORS.text.secondary,
                                  fontFamily: FONT_FAMILIES.primary,
                                }}>
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
                                  mb: 0.75, 
                                  opacity: 0.9,
                                  cursor: 'pointer',
                                  color: COLORS.primary.light,
                                  fontFamily: FONT_FAMILIES.elegant,
                                  '&:hover': { 
                                    opacity: 1,
                                    textDecoration: 'underline'
                                  }
                                }}
                                onClick={() => navigate(`/profile/${message.sender.username}`)}
                              >
                                {message.sender.username}
                              </Typography>
                            )}
                            
                            {message.image && (
                              <Box 
                                sx={{ 
                                  mb: 1.5, 
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  cursor: 'pointer',
                                  position: 'relative',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'scale(1.02)',
                                    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.3)',
                                  }
                                }}
                                onClick={() => setSelectedMedia(message.image)}
                              >
                                <img 
                                  src={message.image} 
                                  alt="Attachment" 
                                  style={{ 
                                    width: '100%', 
                                    maxWidth: 320,
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
                                    bottom: 12,
                                    right: 12,
                                    bgcolor: alpha(COLORS.background.default, 0.7),
                                    color: COLORS.text.primary,
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    '&:hover': {
                                      bgcolor: alpha(COLORS.background.default, 0.9),
                                      color: COLORS.primary.light,
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
                                lineHeight: 1.5,
                                fontFamily: FONT_FAMILIES.primary,
                                fontSize: '0.9375rem',
                              }}>
                                {message.content}
                                {message.isEdited && (
                                  <Typography component="span" variant="caption" sx={{ 
                                    ml: 1, 
                                    opacity: 0.7,
                                    fontStyle: 'italic',
                                    fontFamily: FONT_FAMILIES.primary,
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
                                  mt: 1.5,
                                  bgcolor: isCurrentUser 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : alpha(COLORS.background.surface, 0.3),
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  cursor: 'pointer',
                                  borderRadius: 2,
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    bgcolor: isCurrentUser 
                                      ? 'rgba(255, 255, 255, 0.15)' 
                                      : alpha(COLORS.background.surface, 0.4),
                                  }
                                }}
                                onClick={() => handleDownloadAttachment(message.image, message.fileName)}
                              >
                                <IconButton size="small" disabled sx={{
                                  bgcolor: alpha(COLORS.primary.main, 0.1),
                                  color: COLORS.primary.light,
                                }}>
                                  {getFileIcon(message.messageType, message.fileName)}
                                </IconButton>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography variant="body2" noWrap sx={{ 
                                    fontFamily: FONT_FAMILIES.mono,
                                    color: COLORS.text.primary,
                                  }}>
                                    {message.fileName}
                                  </Typography>
                                  {message.fileSize && (
                                    <Typography variant="caption" sx={{ 
                                      display: 'block',
                                      color: COLORS.text.disabled,
                                    }}>
                                      {formatFileSize(message.fileSize)}
                                    </Typography>
                                  )}
                                </Box>
                                <IconButton size="small" sx={{
                                  color: COLORS.text.secondary,
                                  '&:hover': {
                                    color: COLORS.primary.light,
                                  }
                                }}>
                                  <DownloadIcon fontSize="small" />
                                </IconButton>
                              </Paper>
                            )}
                            
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              mt: 1
                            }}>
                              <Typography variant="caption" sx={{ 
                                fontSize: '0.7rem',
                                opacity: 0.7,
                                fontFamily: FONT_FAMILIES.mono,
                                color: isCurrentUser ? 'rgba(255, 255, 255, 0.7)' : COLORS.text.secondary,
                              }}>
                                {formatMessageTime(message.createdAt)}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {isCurrentUser && (
                                  <>
                                    {message.isRead ? (
                                      <CheckCircleIcon sx={{ 
                                        fontSize: 14, 
                                        opacity: 0.7,
                                        color: COLORS.secondary.light,
                                      }} />
                                    ) : (
                                      <CheckIcon sx={{ 
                                        fontSize: 14, 
                                        opacity: 0.7,
                                        color: 'rgba(255, 255, 255, 0.7)',
                                      }} />
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
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
                      <TypingIndicator>
                        <Box sx={{ display: 'flex', gap: 0.75 }}>
                          <Dot delay="0s" />
                          <Dot delay="0.2s" />
                          <Dot delay="0.4s" />
                        </Box>
                        <Typography variant="caption" sx={{
                          color: COLORS.text.secondary,
                          fontFamily: FONT_FAMILIES.secondary,
                        }}>
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
            <GlassContainer component="form" onSubmit={handleSendMessage} sx={{ 
              p: 2.5, 
              mt: 2,
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }} className="dark:bg-gray-900/70 dark:border-gray-700/10">
            {showEmojiPicker && (
  <Box 
    ref={emojiPickerRef}
    sx={{ 
      position: 'absolute', 
      bottom: '100%', 
      left: 0,
      mb: 2,
      zIndex: 1300,
    }}
  >
    <Picker
      data={data}
      onEmojiSelect={(emoji) => {
        setNewMessage(prev => prev + emoji.native);
        setShowEmojiPicker(false);
        if (inputRef.current) inputRef.current.focus();
      }}
      theme="light"
      previewPosition="none"
      skinTonePosition="none"
      searchPosition="none"
      maxFrequentRows={0}
    />
  </Box>
)}
              
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
              <IconButton
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEmojiPicker(!showEmojiPicker);
  }}
  sx={{ 
    color: showEmojiPicker ? COLORS.primary.light : COLORS.text.secondary,
    bgcolor: showEmojiPicker 
      ? alpha(COLORS.primary.main, 0.2) 
      : alpha(COLORS.background.surface, 0.3),
    '&:hover': { 
      color: COLORS.primary.light,
      bgcolor: alpha(COLORS.primary.main, 0.1),
    },
    transition: 'all 0.2s ease',
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
                    color: COLORS.text.secondary,
                    bgcolor: alpha(COLORS.background.surface, 0.3),
                    '&:hover': { 
                      color: COLORS.primary.light,
                      bgcolor: alpha(COLORS.primary.main, 0.1),
                    },
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AttachFileIcon />
                </IconButton>
                
                <TextField
                  fullWidth
                  placeholder="Type your message..."
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
                      borderRadius: 3,
                      bgcolor: alpha(COLORS.background.surface, 0.3),
                      fontFamily: FONT_FAMILIES.primary,
                      color: COLORS.text.primary,
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      transition: 'all 0.3s ease',
                      '& .MuiOutlinedInput-notchedOutline': {
                        border: 'none',
                      },
                      '&:hover': {
                        bgcolor: alpha(COLORS.background.surface, 0.4),
                      },
                      '&.Mui-focused': {
                        bgcolor: alpha(COLORS.background.surface, 0.5),
                        border: `1px solid ${alpha(COLORS.primary.main, 0.3)}`,
                      }
                    },
                  }}
                  variant="outlined"
                  disabled={!socketConnected || isSending}
                />
                
                <IconButton
                  type="submit"
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || isSending}
                  sx={{ 
                    width: 44,
                    height: 44,
                    bgcolor: COLORS.primary.gradient,
                    color: 'white',
                    animation: (!newMessage.trim() && selectedFiles.length === 0) ? 'none' : `${pulseGlow} 2s infinite`,
                    '&:hover': { 
                      bgcolor: COLORS.primary.gradient,
                      transform: 'translateY(-2px)',
                      boxShadow: `0 8px 32px ${alpha(COLORS.primary.main, 0.4)}`,
                    },
                    '&.Mui-disabled': { 
                      bgcolor: alpha(COLORS.text.disabled, 0.3),
                      color: alpha(COLORS.text.disabled, 0.5),
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  {isSending ? (
                    <CircularProgress size={20} sx={{ color: 'white' }} />
                  ) : (
                    <SendIcon sx={{ fontSize: 20 }} />
                  )}
                </IconButton>
              </Box>
            </GlassContainer>
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
              mb: 4,
              animation: `${floatAnimation} 3s ease-in-out infinite`
            }}>
              <SendIcon sx={{ 
                fontSize: 120, 
                color: COLORS.primary.main,
                opacity: 0.9,
                filter: 'drop-shadow(0 0 40px rgba(99, 102, 241, 0.5))'
              }} />
            </Box>
            <Typography 
              variant="h3" 
              gutterBottom
              sx={{ 
                fontFamily: FONT_FAMILIES.display,
                fontWeight: 800,
                background: COLORS.primary.gradient,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Your Messages
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: COLORS.text.secondary,
                mb: 3,
                maxWidth: 500,
                fontFamily: FONT_FAMILIES.elegant,
                fontWeight: 400,
              }}
            >
              Connect privately with your friends and colleagues
            </Typography>
            <ShimmerButton
              variant="contained"
              onClick={() => setShowNewMessageDrawer(true)}
              sx={{
                textTransform: 'none',
                borderRadius: 3,
                px: 5,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                background: COLORS.primary.gradient,
                color: 'white',
                '&:hover': {
                  background: COLORS.primary.gradient,
                  transform: 'translateY(-3px)',
                  boxShadow: `0 16px 48px ${alpha(COLORS.primary.main, 0.4)}`,
                },
                fontFamily: FONT_FAMILIES.display,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              Start New Conversation
            </ShimmerButton>
          </Box>
        )}
      </Box>

      {/* Media View Dialog */}
      <Dialog
        open={!!selectedMedia}
        onClose={() => setSelectedMedia(null)}
        maxWidth="lg"
        PaperProps={{
          sx: {
            bgcolor: COLORS.background.paper,
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }
        }}
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
        <DialogActions sx={{ p: 2, bgcolor: alpha(COLORS.background.default, 0.5) }}>
          <Button
            startIcon={<DownloadIcon />}
            onClick={() => {
              handleDownloadAttachment(selectedMedia, 'chat-media.jpg');
              setSelectedMedia(null);
            }}
            sx={{
              textTransform: 'none',
              fontFamily: FONT_FAMILIES.secondary,
              color: COLORS.text.primary,
              '&:hover': {
                color: COLORS.primary.light,
              }
            }}
          >
            Download
          </Button>
          <IconButton 
            onClick={() => setSelectedMedia(null)}
            sx={{
              color: COLORS.text.secondary,
              '&:hover': {
                color: COLORS.primary.light,
              }
            }}
          >
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
            width: { xs: '100%', sm: 420 },
            bgcolor: COLORS.background.paper,
            borderLeft: `1px solid ${alpha(COLORS.primary.main, 0.1)}`,
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ 
            p: 3, 
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <IconButton 
              onClick={() => setShowNewMessageDrawer(false)} 
              sx={{
                color: COLORS.text.secondary,
                '&:hover': {
                  color: COLORS.primary.light,
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" sx={{ 
              flex: 1, 
              fontWeight: 700, 
              fontFamily: FONT_FAMILIES.display,
              color: COLORS.text.primary,
            }}>
              New Message
            </Typography>
          </Box>

          <Box sx={{ p: 2.5, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={newMessageMode === 'dm' ? 'contained' : 'outlined'}
                onClick={() => {
                  setNewMessageMode('dm');
                  setGroupName('');
                  setGroupMemberIds([]);
                }}
                sx={{ textTransform: 'none', borderRadius: 3, flex: 1, fontFamily: FONT_FAMILIES.secondary }}
              >
                Direct
              </Button>
              <Button
                variant={newMessageMode === 'group' ? 'contained' : 'outlined'}
                onClick={() => setNewMessageMode('group')}
                sx={{ textTransform: 'none', borderRadius: 3, flex: 1, fontFamily: FONT_FAMILIES.secondary }}
              >
                Group
              </Button>
            </Box>

            {newMessageMode === 'group' && (
              <TextField
                fullWidth
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                InputProps={{
                  sx: {
                    borderRadius: 3,
                    fontFamily: FONT_FAMILIES.primary,
                    bgcolor: alpha(COLORS.background.surface, 0.3),
                    color: COLORS.text.primary,
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                  },
                }}
                size="small"
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: COLORS.text.secondary }} />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 3, 
                  fontFamily: FONT_FAMILIES.primary,
                  bgcolor: alpha(COLORS.background.surface, 0.3),
                  color: COLORS.text.primary,
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  '& .MuiOutlinedInput-notchedOutline': {
                    border: 'none',
                  },
                  '&:hover': {
                    bgcolor: alpha(COLORS.background.surface, 0.4),
                  }
                }
              }}
              size="small"
            />
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {(() => {
              const hasQuery = !!searchQuery?.trim();
              const usersToShow = hasQuery ? searchedUsers : filteredFollowingUsers;

              if (hasQuery && userSearchLoading) {
                return (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress size={20} sx={{ color: COLORS.primary.main }} />
                  </Box>
                );
              }

              if (!usersToShow || usersToShow.length === 0) {
                return (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="body1" sx={{ 
                      color: COLORS.text.secondary,
                      fontFamily: FONT_FAMILIES.primary,
                    }}>
                      {hasQuery ? 'No users found' : 'Start following users to message them'}
                    </Typography>
                  </Box>
                );
              }

              return (
                <List>
                  {usersToShow.map((user) => (
                    <ListItem
                      button
                      key={user._id}
                      onClick={() => {
                        if (newMessageMode === 'group') {
                          setGroupMemberIds((prev) => {
                            const exists = prev.includes(user._id);
                            return exists ? prev.filter((id) => id !== user._id) : [...prev, user._id];
                          });
                          return;
                        }

                        setSelectedUser(user);
                        setSelectedConversation(null);
                        setMessages([]);
                        setShowNewMessageDrawer(false);
                        setTypingUsers({});
                        
                        const existingConv = conversations.find(conv => {
                          if (conv?.isGroup) return false;
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
                        py: 2,
                        px: 2.5,
                        transition: 'all 0.3s ease',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        '&:hover': {
                          bgcolor: alpha(COLORS.primary.main, 0.1),
                          transform: 'translateX(4px)',
                        },
                        '&:last-child': {
                          borderBottom: 'none',
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar 
                          src={user.profilePicture} 
                          alt={user.username} 
                          sx={{
                            width: 48,
                            height: 48,
                            transition: 'transform 0.3s ease',
                            border: `2px solid ${alpha(COLORS.primary.main, 0.3)}`,
                            '&:hover': {
                              transform: 'scale(1.1) rotate(5deg)',
                            }
                          }}
                        >
                          {user.username?.charAt(0).toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 600, 
                            fontFamily: FONT_FAMILIES.elegant,
                            color: COLORS.text.primary,
                          }}>
                            {user.username}
                          </Typography>
                        }
                        secondary={
                          user.fullName && (
                            <Typography variant="body2" sx={{ 
                              color: COLORS.text.secondary,
                              fontFamily: FONT_FAMILIES.primary,
                            }}>
                              {user.fullName}
                            </Typography>
                          )
                        }
                      />

                      {newMessageMode === 'group' && (
                        <Chip
                          label={groupMemberIds.includes(user._id) ? 'Added' : 'Add'}
                          size="small"
                          color={groupMemberIds.includes(user._id) ? 'primary' : 'default'}
                          sx={{ ml: 1 }}
                        />
                      )}
                    </ListItem>
                  ))}
                </List>
              );
            })()}
          </Box>

          {newMessageMode === 'group' && (
            <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <Button
                fullWidth
                variant="contained"
                onClick={createGroupConversation}
                sx={{
                  textTransform: 'none',
                  borderRadius: 3,
                  py: 1.5,
                  fontFamily: FONT_FAMILIES.display,
                  background: COLORS.primary.gradient,
                  '&:hover': { background: COLORS.primary.gradient },
                }}
              >
                Create Group ({groupMemberIds.length})
              </Button>
            </Box>
          )}
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
          sx={{ 
            width: '100%',
            fontFamily: FONT_FAMILIES.primary,
            bgcolor: COLORS.background.paper,
            color: COLORS.text.primary,
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? COLORS.secondary.light :
                     snackbar.severity === 'error' ? '#f87171' :
                     snackbar.severity === 'warning' ? '#fbbf24' : COLORS.primary.light
            }
          }}
          elevation={0}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AnimatedContainer>
  );
};

export default MessagesPage;