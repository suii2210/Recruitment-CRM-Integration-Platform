import { create } from 'zustand';
import { API_ENDPOINTS, apiRequest } from '../config/api';

interface ChatParticipant {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'suspended';
}

interface Chat {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: ChatParticipant[];
  lastMessage?: {
    id: string;
    content: string;
    timestamp: string;
    senderId: string;
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  timestamp: string;
  readBy: string[];
  editedAt?: string;
}

interface ChatStore {
  chats: Chat[];
  messages: { [chatId: string]: Message[] };
  onlineUsers: string[];
  availableUsers: ChatParticipant[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchChats: () => Promise<void>;
  fetchAvailableUsers: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: string) => Promise<void>;
  createChat: (participants: string[], name?: string, type?: string) => Promise<void>;
  markAsRead: (chatId: string) => Promise<void>;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
}

// Generate mock chats based on real users
const generateChatsFromUsers = (users: ChatParticipant[], currentUserId: string): Chat[] => {
  const chats: Chat[] = [];
  
  // Create admin support chat (always available)
  const adminUsers = users.filter(user => user.role === 'Super Admin' || user.role === 'Admin');
  if (adminUsers.length > 0) {
    const adminUser = adminUsers[0];
    chats.push({
      id: `chat-admin-${adminUser.id}`,
      name: `${adminUser.name} (Support)`,
      type: 'direct',
      participants: [
        adminUser,
        users.find(u => u.id === currentUserId) || {
          id: currentUserId,
          name: 'You',
          email: 'you@example.com',
          role: 'User',
          status: 'active'
        }
      ],
      lastMessage: {
        id: 'welcome-msg',
        content: 'Welcome! How can I help you today?',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        senderId: adminUser.id
      },
      unreadCount: 1,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
    });
  }

  // Create group chat for all active users
  const activeUsers = users.filter(user => user.status === 'active');
  if (activeUsers.length > 2) {
    chats.push({
      id: 'chat-general',
      name: 'General Discussion',
      type: 'group',
      participants: activeUsers,
      lastMessage: {
        id: 'general-msg',
        content: 'Welcome to the general discussion!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        senderId: adminUsers[0]?.id || activeUsers[0].id
      },
      unreadCount: 0,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    });
  }

  // Create direct chats with other users (excluding current user)
  const otherUsers = users.filter(user => 
    user.id !== currentUserId && 
    user.status === 'active' && 
    (user.role === 'Admin' || user.role === 'Editor' || user.role === 'Author')
  );

  otherUsers.slice(0, 3).forEach((user, index) => {
    chats.push({
      id: `chat-direct-${user.id}`,
      name: user.name,
      type: 'direct',
      participants: [
        user,
        users.find(u => u.id === currentUserId) || {
          id: currentUserId,
          name: 'You',
          email: 'you@example.com',
          role: 'User',
          status: 'active'
        }
      ],
      lastMessage: index === 0 ? {
        id: `direct-msg-${user.id}`,
        content: 'Hi there! 👋',
        timestamp: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString(),
        senderId: user.id
      } : undefined,
      unreadCount: index === 0 ? 1 : 0,
      createdAt: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - (index + 1) * 60 * 60 * 1000).toISOString()
    });
  });

  return chats;
};

const generateMessagesForChat = (chat: Chat, currentUserId: string): Message[] => {
  const messages: Message[] = [];
  
  if (chat.id.includes('admin')) {
    // Admin support messages
    messages.push(
      {
        id: 'admin-msg-1',
        chatId: chat.id,
        senderId: currentUserId,
        senderName: 'You',
        content: 'Hi, I need some help with the dashboard',
        type: 'text',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        readBy: [currentUserId, chat.participants[0].id]
      },
      {
        id: 'admin-msg-2',
        chatId: chat.id,
        senderId: chat.participants[0].id,
        senderName: chat.participants[0].name,
        content: 'Hello! I\'d be happy to help you. What specific issue are you experiencing?',
        type: 'text',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        readBy: [chat.participants[0].id]
      },
      {
        id: 'admin-msg-3',
        chatId: chat.id,
        senderId: currentUserId,
        senderName: 'You',
        content: 'I\'m trying to understand how to manage user permissions',
        type: 'text',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        readBy: [currentUserId, chat.participants[0].id]
      },
      {
        id: 'admin-msg-4',
        chatId: chat.id,
        senderId: chat.participants[0].id,
        senderName: chat.participants[0].name,
        content: 'Great question! You can manage user permissions through the Roles & Permissions section. Each role has specific permissions that determine what users can access. Would you like me to walk you through it?',
        type: 'text',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        readBy: [chat.participants[0].id]
      }
    );
  } else if (chat.type === 'group') {
    // Group chat messages
    messages.push(
      {
        id: 'group-msg-1',
        chatId: chat.id,
        senderId: chat.participants[0].id,
        senderName: chat.participants[0].name,
        content: 'Welcome everyone to our team discussion! 🎉',
        type: 'text',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        readBy: chat.participants.map(p => p.id)
      },
      {
        id: 'group-msg-2',
        chatId: chat.id,
        senderId: chat.participants[1]?.id || currentUserId,
        senderName: chat.participants[1]?.name || 'You',
        content: 'Thanks for setting this up! Looking forward to collaborating.',
        type: 'text',
        timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
        readBy: [chat.participants[1]?.id || currentUserId, chat.participants[0].id]
      },
      {
        id: 'group-msg-3',
        chatId: chat.id,
        senderId: chat.participants[2]?.id || chat.participants[0].id,
        senderName: chat.participants[2]?.name || chat.participants[0].name,
        content: 'Great to have everyone here! Let\'s make some amazing content together.',
        type: 'text',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        readBy: [chat.participants[2]?.id || chat.participants[0].id]
      }
    );
  } else if (chat.type === 'direct' && !chat.id.includes('admin')) {
    // Direct chat messages
    const otherUser = chat.participants.find(p => p.id !== currentUserId);
    if (otherUser) {
      messages.push(
        {
          id: `direct-msg-1-${otherUser.id}`,
          chatId: chat.id,
          senderId: otherUser.id,
          senderName: otherUser.name,
          content: 'Hi there! 👋 How are you doing?',
          type: 'text',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          readBy: [otherUser.id]
        },
        {
          id: `direct-msg-2-${otherUser.id}`,
          chatId: chat.id,
          senderId: currentUserId,
          senderName: 'You',
          content: 'Hey! I\'m doing well, thanks for asking. How about you?',
          type: 'text',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          readBy: [currentUserId, otherUser.id]
        },
        {
          id: `direct-msg-3-${otherUser.id}`,
          chatId: chat.id,
          senderId: otherUser.id,
          senderName: otherUser.name,
          content: 'I\'m great! Working on some exciting new features. Would love to get your thoughts on them sometime.',
          type: 'text',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          readBy: [otherUser.id]
        }
      );
    }
  }

  return messages;
};

let updateInterval: NodeJS.Timeout | null = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  chats: [],
  messages: {},
  onlineUsers: [],
  availableUsers: [],
  loading: false,
  error: null,

  fetchAvailableUsers: async () => {
    try {
      const response = await apiRequest(API_ENDPOINTS.USERS.BASE);
      const users = (response.users || response).map((user: any) => ({
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        status: user.status
      }));
      
      set({ availableUsers: users });
      
      // Simulate some users being online
      const onlineUserIds = users
        .filter((user: any) => user.status === 'active')
        .slice(0, Math.ceil(users.length * 0.6))
        .map((user: any) => user.id);
      
      set({ onlineUsers: onlineUserIds });
      
      return users;
    } catch (error: any) {
      console.error('Error fetching users:', error);
      set({ error: error.message });
      return [];
    }
  },

  fetchChats: async () => {
    set({ loading: true, error: null });
    try {
      // First fetch available users
      const users = await get().fetchAvailableUsers();
      
      // Get current user ID (you might need to get this from user store)
      const currentUserId = 'current-user'; // This should be the actual current user ID
      
      // Generate chats based on real users
      const chats = generateChatsFromUsers(users, currentUserId);
      
      set({ chats, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMessages: async (chatId: string) => {
    try {
      const { chats, availableUsers } = get();
      const chat = chats.find(c => c.id === chatId);
      
      if (chat) {
        const currentUserId = 'current-user'; // This should be the actual current user ID
        const messages = generateMessagesForChat(chat, currentUserId);
        
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: messages
          }
        }));
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  sendMessage: async (chatId: string, content: string, type = 'text') => {
    try {
      const currentUserId = 'current-user'; // This should be the actual current user ID
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        chatId,
        senderId: currentUserId,
        senderName: 'You',
        content,
        type: type as any,
        timestamp: new Date().toISOString(),
        readBy: [currentUserId]
      };

      // Add message to store
      set(state => ({
        messages: {
          ...state.messages,
          [chatId]: [...(state.messages[chatId] || []), newMessage]
        },
        chats: state.chats.map(chat => 
          chat.id === chatId 
            ? {
                ...chat,
                lastMessage: {
                  id: newMessage.id,
                  content: newMessage.content,
                  timestamp: newMessage.timestamp,
                  senderId: newMessage.senderId
                },
                updatedAt: newMessage.timestamp
              }
            : chat
        )
      }));

      // Simulate auto-reply from admin or other users after 2-5 seconds
      const chat = get().chats.find(c => c.id === chatId);
      if (chat) {
        const otherParticipants = chat.participants.filter(p => p.id !== currentUserId);
        if (otherParticipants.length > 0) {
          const replyDelay = Math.random() * 3000 + 2000; // 2-5 seconds
          
          setTimeout(() => {
            const replier = otherParticipants[Math.floor(Math.random() * otherParticipants.length)];
            
            // Generate contextual auto-replies
            const autoReplies = [
              'Thanks for your message! 👍',
              'Got it, I\'ll look into that.',
              'That sounds great!',
              'I agree with your point.',
              'Let me get back to you on this.',
              'Interesting perspective!',
              'Thanks for sharing that.',
              'I\'ll help you with that.',
              'Good question! Let me think about it.',
              'That makes sense.'
            ];
            
            // Admin-specific replies
            const adminReplies = [
              'I\'m here to help! What do you need assistance with?',
              'Thanks for reaching out. I\'ll assist you right away.',
              'Let me help you resolve this issue.',
              'I\'ll guide you through the process.',
              'That\'s a great question! Here\'s what you need to know...',
              'I can definitely help you with that.',
              'Let me check that for you.',
              'I\'ll make sure this gets resolved quickly.'
            ];
            
            const isAdmin = replier.role === 'Super Admin' || replier.role === 'Admin';
            const replies = isAdmin ? adminReplies : autoReplies;
            const replyContent = replies[Math.floor(Math.random() * replies.length)];

            const autoReply: Message = {
              id: `msg-auto-${Date.now()}`,
              chatId,
              senderId: replier.id,
              senderName: replier.name,
              content: replyContent,
              type: 'text',
              timestamp: new Date().toISOString(),
              readBy: [replier.id]
            };

            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: [...(state.messages[chatId] || []), autoReply]
              },
              chats: state.chats.map(chat => 
                chat.id === chatId 
                  ? {
                      ...chat,
                      lastMessage: {
                        id: autoReply.id,
                        content: autoReply.content,
                        timestamp: autoReply.timestamp,
                        senderId: autoReply.senderId
                      },
                      updatedAt: autoReply.timestamp,
                      unreadCount: chat.unreadCount + 1
                    }
                  : chat
              )
            }));
          }, replyDelay);
        }
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  createChat: async (participantIds: string[], name?: string, type = 'group') => {
    try {
      const { availableUsers } = get();
      const participants = availableUsers.filter(user => participantIds.includes(user.id));
      
      const newChat: Chat = {
        id: `chat-${Date.now()}`,
        name: name || (type === 'direct' ? participants[0]?.name : 'New Chat'),
        type: type as any,
        participants,
        unreadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      set(state => ({
        chats: [newChat, ...state.chats]
      }));
      
      return newChat.id;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },

  markAsRead: async (chatId: string) => {
    try {
      set(state => ({
        chats: state.chats.map(chat => 
          chat.id === chatId 
            ? { ...chat, unreadCount: 0 }
            : chat
        )
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  startRealTimeUpdates: () => {
    // Simulate real-time updates
    if (updateInterval) {
      clearInterval(updateInterval);
    }

    updateInterval = setInterval(() => {
      const { availableUsers } = get();
      
      // Simulate random online status changes
      const activeUsers = availableUsers.filter(user => user.status === 'active');
      const randomOnlineUsers = activeUsers
        .filter(() => Math.random() > 0.4) // 60% chance to be online
        .map(user => user.id);
      
      set({ onlineUsers: randomOnlineUsers });
    }, 30000); // Update every 30 seconds
  },

  stopRealTimeUpdates: () => {
    if (updateInterval) {
      clearInterval(updateInterval);
      updateInterval = null;
    }
  }
}));