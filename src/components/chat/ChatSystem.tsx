import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Paperclip, 
  Smile, 
  Users, 
  Settings,
  X,
  Plus,
  Hash,
  Lock,
  Globe,
  Crown,
  Shield,
  User,
  Circle,
  CheckCircle2,
  Image,
  File,
  Download,
  UserPlus,
  MessageCircle
} from 'lucide-react';
import { useUserStore } from '../../store/userStore';
import { useChatStore } from '../../store/chatStore';
import EmojiPicker from './EmojiPicker';
import FileUpload from './FileUpload';

const ChatSystem: React.FC = () => {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [newChatName, setNewChatName] = useState('');
  const [newChatType, setNewChatType] = useState<'direct' | 'group'>('direct');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useUserStore();
  const { 
    chats, 
    messages, 
    onlineUsers, 
    availableUsers,
    loading,
    fetchChats, 
    fetchMessages, 
    sendMessage, 
    createChat,
    markAsRead,
    startRealTimeUpdates,
    stopRealTimeUpdates
  } = useChatStore();

  useEffect(() => {
    fetchChats();
    startRealTimeUpdates();
    
    return () => {
      stopRealTimeUpdates();
    };
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
      markAsRead(selectedChat);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedChat) return;
    
    await sendMessage(selectedChat, message.trim());
    setMessage('');
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (file: File) => {
    if (!selectedChat) return;
    
    // In a real implementation, you would upload the file and get a URL
    const fileMessage = `📎 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    await sendMessage(selectedChat, fileMessage, 'file');
    setShowFileUpload(false);
  };

  const handleCreateNewChat = async () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user');
      return;
    }

    try {
      const chatId = await createChat(
        selectedUsers, 
        newChatType === 'group' ? newChatName || 'New Group' : undefined,
        newChatType
      );
      
      setShowNewChatModal(false);
      setSelectedUsers([]);
      setNewChatName('');
      setSelectedChat(chatId);
    } catch (error) {
      console.error('Error creating chat:', error);
      alert('Failed to create chat. Please try again.');
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    chat.participants.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const availableUsersForChat = availableUsers.filter(user => 
    user.id !== currentUser?.id && user.status === 'active'
  );

  const selectedChatData = chats.find(chat => chat.id === selectedChat);
  const chatMessages = messages[selectedChat || ''] || [];

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  const getChatIcon = (chat: any) => {
    if (chat.type === 'channel') return Hash;
    if (chat.type === 'group') return Users;
    return User;
  };

  const getChatStatusColor = (chat: any) => {
    if (chat.type === 'direct') {
      const otherUser = chat.participants.find((p: any) => p.id !== currentUser?.id);
      const isOnline = onlineUsers.includes(otherUser?.id || '');
      return isOnline ? 'bg-green-400' : 'bg-slate-400';
    }
    return 'bg-blue-400';
  };

  const getMessageStatusIcon = (msg: any) => {
    if (msg.senderId !== currentUser?.id) return null;
    
    if (msg.readBy && msg.readBy.length > 1) {
      return <CheckCircle2 className="w-3 h-3 text-blue-400" />;
    }
    return <Circle className="w-3 h-3 text-slate-400" />;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Super Admin': return Crown;
      case 'Admin': return Shield;
      default: return User;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return 'text-yellow-400';
      case 'Admin': return 'text-blue-400';
      case 'Editor': return 'text-purple-400';
      case 'Author': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  // Show welcome message if user doesn't have chat access
  if (!currentUser) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 dark:bg-slate-900 light:bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-slate-400 dark:text-slate-400 light:text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 mb-2">
            Chat System
          </h3>
          <p className="text-slate-400 dark:text-slate-400 light:text-gray-500">
            Please log in to access the chat system
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-slate-900 dark:bg-slate-900 light:bg-gray-50">
      {/* Chat List Sidebar */}
      <div className="w-80 bg-slate-800 dark:bg-slate-800 light:bg-white border-r border-slate-700 dark:border-slate-700 light:border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 dark:border-slate-700 light:border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white dark:text-white light:text-gray-900">Messages</h2>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
              title="Start new chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-100 border border-slate-600 dark:border-slate-600 light:border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm text-white dark:text-white light:text-gray-900 placeholder-slate-400 dark:placeholder-slate-400 light:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
            />
          </div>
        </div>

        {/* Online Users Count */}
        <div className="px-4 py-2 border-b border-slate-700 dark:border-slate-700 light:border-gray-200">
          <div className="flex items-center gap-2 text-sm text-slate-400 dark:text-slate-400 light:text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>{onlineUsers.length} users online</span>
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto hide-scrollbar">
          {loading ? (
            <div className="p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 mb-2 animate-pulse">
                  <div className="w-10 h-10 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-slate-400 dark:text-slate-400 light:text-gray-400 mx-auto mb-3" />
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 mb-4">No conversations found</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start Chat
              </button>
            </div>
          ) : (
            <div className="p-2">
              {filteredChats.map((chat) => {
                const ChatIcon = getChatIcon(chat);
                const isSelected = selectedChat === chat.id;
                const hasUnread = chat.unreadCount > 0;
                const otherUser = chat.type === 'direct' 
                  ? chat.participants.find(p => p.id !== currentUser?.id)
                  : null;
                
                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                      isSelected 
                        ? 'bg-red-500 text-white' 
                        : 'hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-gray-100 text-white dark:text-white light:text-gray-900'
                    }`}
                  >
                    <div className="relative">
                      {chat.type === 'direct' && otherUser ? (
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {otherUser.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-slate-600 dark:bg-slate-600 light:bg-gray-300 rounded-lg flex items-center justify-center">
                          <ChatIcon className="w-5 h-5 text-slate-300 dark:text-slate-300 light:text-gray-600" />
                        </div>
                      )}
                      
                      {/* Online status */}
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getChatStatusColor(chat)} rounded-full border-2 border-slate-800 dark:border-slate-800 light:border-white`}></div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className={`font-medium truncate ${isSelected ? 'text-white' : 'text-white dark:text-white light:text-gray-900'}`}>
                            {chat.name}
                          </h3>
                          {otherUser && (
                            <div className={`${getRoleColor(otherUser.role)}`}>
                              {React.createElement(getRoleIcon(otherUser.role), { className: "w-3 h-3" })}
                            </div>
                          )}
                        </div>
                        <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-400 light:text-gray-500'}`}>
                          {chat.lastMessage ? formatTime(chat.lastMessage.timestamp) : formatTime(chat.updatedAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${isSelected ? 'text-white/70' : 'text-slate-400 dark:text-slate-400 light:text-gray-500'}`}>
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChatData ? (
          <>
            {/* Chat Header */}
            <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border-b border-slate-700 dark:border-slate-700 light:border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {selectedChatData.type === 'direct' ? (
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-medium">
                          {selectedChatData.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <div className="w-10 h-10 bg-slate-600 dark:bg-slate-600 light:bg-gray-300 rounded-lg flex items-center justify-center">
                        {React.createElement(getChatIcon(selectedChatData), { 
                          className: "w-5 h-5 text-slate-300 dark:text-slate-300 light:text-gray-600" 
                        })}
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 ${getChatStatusColor(selectedChatData)} rounded-full border-2 border-slate-800 dark:border-slate-800 light:border-white`}></div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-white dark:text-white light:text-gray-900">
                      {selectedChatData.name}
                    </h3>
                    <p className="text-sm text-slate-400 dark:text-slate-400 light:text-gray-500">
                      {selectedChatData.type === 'direct' 
                        ? (() => {
                            const otherUser = selectedChatData.participants.find(p => p.id !== currentUser?.id);
                            const isOnline = otherUser && onlineUsers.includes(otherUser.id);
                            return `${otherUser?.role} • ${isOnline ? 'Online' : 'Offline'}`;
                          })()
                        : `${selectedChatData.participants.length} members • ${onlineUsers.filter(id => selectedChatData.participants.some(p => p.id === id)).length} online`
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-slate-300 dark:text-slate-300 light:text-gray-600 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors">
                    <Phone className="w-4 h-4" />
                  </button>
                  <button className="p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-slate-300 dark:text-slate-300 light:text-gray-600 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors">
                    <Video className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setShowChatInfo(!showChatInfo)}
                    className="p-2 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-slate-300 dark:text-slate-300 light:text-gray-600 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    {React.createElement(getChatIcon(selectedChatData), { 
                      className: "w-8 h-8 text-slate-400 dark:text-slate-400 light:text-gray-500" 
                    })}
                  </div>
                  <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900 mb-2">
                    Start the conversation
                  </h3>
                  <p className="text-slate-400 dark:text-slate-400 light:text-gray-500">
                    Send a message to begin chatting with {selectedChatData.name}
                  </p>
                </div>
              ) : (
                <>
                  {chatMessages.map((msg, index) => {
                    const isOwn = msg.senderId === currentUser?.id || msg.senderId === 'current-user';
                    const showDate = index === 0 || 
                      formatDate(msg.timestamp) !== formatDate(chatMessages[index - 1].timestamp);
                    const showAvatar = !isOwn && (
                      index === chatMessages.length - 1 || 
                      chatMessages[index + 1].senderId !== msg.senderId
                    );
                    
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="text-center my-4">
                            <span className="bg-slate-700 dark:bg-slate-700 light:bg-gray-200 text-slate-300 dark:text-slate-300 light:text-gray-600 px-3 py-1 rounded-full text-xs">
                              {formatDate(msg.timestamp)}
                            </span>
                          </div>
                        )}
                        
                        <div className={`flex gap-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          {!isOwn && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              {showAvatar ? (
                                <span className="text-white font-medium text-xs">
                                  {msg.senderName.charAt(0).toUpperCase()}
                                </span>
                              ) : (
                                <div className="w-8 h-8"></div>
                              )}
                            </div>
                          )}
                          
                          <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-1' : ''}`}>
                            {!isOwn && showAvatar && (
                              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500 mb-1 ml-1">
                                {msg.senderName}
                              </p>
                            )}
                            
                            <div className={`rounded-2xl px-4 py-2 ${
                              isOwn 
                                ? 'bg-red-500 text-white' 
                                : 'bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900'
                            }`}>
                              {msg.type === 'file' ? (
                                <div className="flex items-center gap-2">
                                  <File className="w-4 h-4" />
                                  <span className="text-sm">{msg.content}</span>
                                  <button className="p-1 hover:bg-black/10 rounded">
                                    <Download className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : msg.type === 'image' ? (
                                <div>
                                  <img 
                                    src={msg.content} 
                                    alt="Shared image" 
                                    className="rounded-lg max-w-full h-auto mb-2"
                                  />
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              )}
                            </div>
                            
                            <div className={`flex items-center gap-1 mt-1 text-xs text-slate-400 dark:text-slate-400 light:text-gray-500 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <span>{formatTime(msg.timestamp)}</span>
                              {getMessageStatusIcon(msg)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Message Input */}
            <div className="bg-slate-800 dark:bg-slate-800 light:bg-white border-t border-slate-700 dark:border-slate-700 light:border-gray-200 p-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-100 border border-slate-600 dark:border-slate-600 light:border-gray-200 rounded-lg px-4 py-3 pr-20 text-white dark:text-white light:text-gray-900 placeholder-slate-400 dark:placeholder-slate-400 light:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 resize-none"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      onClick={() => setShowFileUpload(true)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1.5 rounded-lg text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
                    >
                      <Smile className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim()}
                  className="p-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute bottom-20 right-4 z-50">
                  <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
                </div>
              )}
              
              {/* File Upload */}
              {showFileUpload && (
                <div className="absolute bottom-20 right-4 z-50">
                  <FileUpload onFileSelect={handleFileUpload} onClose={() => setShowFileUpload(false)} />
                </div>
              )}
            </div>
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center bg-slate-900 dark:bg-slate-900 light:bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-700 dark:bg-slate-700 light:bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-slate-400 dark:text-slate-400 light:text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white dark:text-white light:text-gray-900 mb-2">
                Welcome to Chat!
              </h3>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 mb-6">
                Select a conversation to start chatting or create a new one
              </p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Info Sidebar */}
      {showChatInfo && selectedChatData && (
        <div className="w-80 bg-slate-800 dark:bg-slate-800 light:bg-white border-l border-slate-700 dark:border-slate-700 light:border-gray-200 p-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">Chat Info</h3>
            <button
              onClick={() => setShowChatInfo(false)}
              className="p-1 rounded text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-6">
            {/* Chat Details */}
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold text-xl">
                  {selectedChatData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h4 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">
                {selectedChatData.name}
              </h4>
              <p className="text-slate-400 dark:text-slate-400 light:text-gray-500 text-sm">
                {selectedChatData.type === 'direct' ? 'Direct Message' : `${selectedChatData.participants.length} members`}
              </p>
            </div>
            
            {/* Participants */}
            <div>
              <h5 className="text-sm font-medium text-white dark:text-white light:text-gray-900 mb-3">
                Participants ({selectedChatData.participants.length})
              </h5>
              <div className="space-y-2">
                {selectedChatData.participants.map((participant) => {
                  const RoleIcon = getRoleIcon(participant.role);
                  const isOnline = onlineUsers.includes(participant.id);
                  
                  return (
                    <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-gray-100">
                      <div className="relative">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-xs">
                            {participant.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 dark:border-slate-800 light:border-white"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
                          {participant.name}
                          {participant.id === currentUser?.id && ' (You)'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">
                          {participant.role} • {isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                      <div className={getRoleColor(participant.role)}>
                        <RoleIcon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900 hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors">
                <Settings className="w-4 h-4" />
                Chat Settings
              </button>
              {selectedChatData.type !== 'direct' && (
                <button className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
                  <X className="w-4 h-4" />
                  Leave Chat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 dark:bg-slate-800 light:bg-white rounded-xl border border-slate-700 dark:border-slate-700 light:border-gray-200 w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white dark:text-white light:text-gray-900">Start New Chat</h3>
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="p-1 rounded text-slate-400 dark:text-slate-400 light:text-gray-500 hover:text-white dark:hover:text-white light:hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-white dark:text-white light:text-gray-900 mb-2">
                  Chat Type
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewChatType('direct')}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      newChatType === 'direct'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-slate-700 dark:bg-slate-700 light:bg-gray-100 border-slate-600 dark:border-slate-600 light:border-gray-200 text-white dark:text-white light:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-sm">Direct</span>
                  </button>
                  <button
                    onClick={() => setNewChatType('group')}
                    className={`flex-1 p-3 rounded-lg border transition-colors ${
                      newChatType === 'group'
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-slate-700 dark:bg-slate-700 light:bg-gray-100 border-slate-600 dark:border-slate-600 light:border-gray-200 text-white dark:text-white light:text-gray-900'
                    }`}
                  >
                    <Users className="w-4 h-4 mx-auto mb-1" />
                    <span className="text-sm">Group</span>
                  </button>
                </div>
              </div>

              {/* Group Name (only for group chats) */}
              {newChatType === 'group' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-white dark:text-white light:text-gray-900 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="Enter group name"
                    className="w-full bg-slate-700 dark:bg-slate-700 light:bg-gray-100 border border-slate-600 dark:border-slate-600 light:border-gray-200 rounded-lg px-4 py-3 text-white dark:text-white light:text-gray-900 placeholder-slate-400 dark:placeholder-slate-400 light:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                  />
                </div>
              )}

              {/* User Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-white dark:text-white light:text-gray-900 mb-2">
                  Select Users ({selectedUsers.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border border-slate-600 dark:border-slate-600 light:border-gray-200 rounded-lg">
                  {availableUsersForChat.map((user) => {
                    const isSelected = selectedUsers.includes(user.id);
                    const RoleIcon = getRoleIcon(user.role);
                    const isOnline = onlineUsers.includes(user.id);
                    
                    return (
                      <label
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-slate-700 dark:hover:bg-slate-700 light:hover:bg-gray-100 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              if (newChatType === 'direct' && selectedUsers.length === 0) {
                                setSelectedUsers([user.id]);
                              } else if (newChatType === 'group') {
                                setSelectedUsers([...selectedUsers, user.id]);
                              }
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                            }
                          }}
                          disabled={newChatType === 'direct' && selectedUsers.length > 0 && !isSelected}
                          className="w-4 h-4 text-red-500 bg-slate-600 border-slate-500 rounded focus:ring-red-500 focus:ring-2"
                        />
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          {isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-800 dark:border-slate-800 light:border-white"></div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white dark:text-white light:text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-gray-500">
                            {user.role} • {isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                        <div className={getRoleColor(user.role)}>
                          <RoleIcon className="w-4 h-4" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowNewChatModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 dark:bg-slate-700 light:bg-gray-100 text-white dark:text-white light:text-gray-900 rounded-lg hover:bg-slate-600 dark:hover:bg-slate-600 light:hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewChat}
                  disabled={selectedUsers.length === 0}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  Create Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatSystem;