import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { chatAPI, utils } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext';

const Chat = () => {
  const { studentId, guideId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(() => utils.getUser());

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    fetchChatHistory();
    
    // Set up polling to fetch new messages every 3 seconds
    const interval = setInterval(() => {
      fetchChatHistory(false); // Don't show loading on refresh
    }, 3000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, guideId]);

  const fetchChatHistory = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      const response = await chatAPI.getChatHistory(studentId, guideId);
      setMessages(response.chats || []);
      
      // Set chat partner info from the first message or from the response
      if (response.chats && response.chats.length > 0) {
        const firstMessage = response.chats[0];
        if (currentUser?.role === 'student') {
          setChatPartner({
            name: firstMessage.guide?.name || response.guide_name || 'Guide',
            role: 'guide'
          });
        } else {
          setChatPartner({
            name: firstMessage.student?.name || response.student_name || 'Student',
            role: 'student'
          });
        }
      } else {
        // If no messages, try to get partner info from conversations API
        try {
          const conversations = await chatAPI.getConversations();
          const conversation = conversations.conversations?.find(
            conv => conv.student_id === parseInt(studentId) && conv.guide_id === parseInt(guideId)
          );
          if (conversation) {
            if (currentUser?.role === 'student') {
              setChatPartner({
                name: conversation.guide_name || 'Guide',
                role: 'guide'
              });
            } else {
              setChatPartner({
                name: conversation.student_name || 'Student',
                role: 'student'
              });
            }
          }
        } catch (err) {
          console.warn('Could not fetch partner info:', err);
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setError(error.message || 'Failed to load chat history');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await chatAPI.sendMessage(
        parseInt(studentId), 
        parseInt(guideId), 
        newMessage.trim()
      );
      
      // Add the new message to the chat
      if (response.chat) {
        setMessages(prev => [...prev, response.chat]);
      } else {
        // If response doesn't have chat, refresh the history
        await fetchChatHistory(false);
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Safety check for theme
  if (!theme || !theme.colors) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: '#0F172A'
      }}>
        Loading...
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: theme.colors.text
      }}>
        Loading chat...
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          padding: '40px',
          backgroundColor: theme.colors.surface,
          borderRadius: '15px',
          boxShadow: theme.shadows.card
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ color: theme.colors.error, marginBottom: '10px' }}>
            Error Loading Chat
          </h3>
          <p style={{ color: theme.colors.textSecondary, marginBottom: '20px' }}>
            {error}
          </p>
          <button
            onClick={() => fetchChatHistory()}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              marginRight: '10px'
            }}
          >
            Retry
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.textSecondary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: theme.fonts?.primary || 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: theme.colors.surface,
        borderRadius: '10px',
        boxShadow: theme.shadows.card
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer',
            marginRight: '15px',
            color: theme.colors.text
          }}
        >
          ←
        </button>
        <div>
          <h2 style={{
            margin: 0,
            color: theme.colors.text,
            fontSize: '18px'
          }}>
            {chatPartner ? `Chat with ${chatPartner.name}` : 'Chat'}
          </h2>
          <p style={{
            margin: 0,
            color: theme.colors.textSecondary,
            fontSize: '14px'
          }}>
            {chatPartner?.role === 'guide' ? '🎓 Guide' : '👨‍🎓 Student'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        height: '500px',
        overflowY: 'auto',
        padding: '20px',
        backgroundColor: theme.colors.surface,
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: theme.shadows.card
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: theme.colors.textSecondary,
            marginTop: '50px'
          }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          <>
            {messages.map((message, index) => {
              const isCurrentUser = message.sender_id === currentUser?.id;
              const showDate = index === 0 || 
                formatDate(messages[index - 1].created_at) !== formatDate(message.created_at);

              return (
                <div key={message.id}>
                  {showDate && (
                    <div style={{
                      textAlign: 'center',
                      margin: '20px 0',
                      color: theme.colors.textSecondary,
                      fontSize: '12px'
                    }}>
                      {formatDate(message.created_at)}
                    </div>
                  )}
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '18px',
                      backgroundColor: isCurrentUser 
                        ? theme.colors.primary 
                        : theme.colors.background,
                      color: isCurrentUser ? 'white' : theme.colors.text,
                      boxShadow: theme.shadows?.card || '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ marginBottom: '4px' }}>
                        {message.message}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.7,
                        textAlign: 'right'
                      }}>
                        {formatTime(message.created_at)}
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
      <form onSubmit={handleSendMessage} style={{
        display: 'flex',
        gap: '10px'
      }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: '25px',
            fontSize: '14px',
            backgroundColor: theme.colors.surface,
            color: theme.colors.text,
            outline: 'none'
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            padding: '12px 24px',
            backgroundColor: theme.colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: sending ? 'not-allowed' : 'pointer',
            opacity: (!newMessage.trim() || sending) ? 0.6 : 1,
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default Chat;