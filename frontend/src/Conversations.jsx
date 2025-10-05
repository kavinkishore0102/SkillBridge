import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, utils } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext';

const Conversations = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = utils.getUser();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const response = await chatAPI.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationClick = (conversation) => {
    navigate(`/chat/${conversation.student_id}/${conversation.guide_id}`);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes <= 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        color: theme.colors.text
      }}>
        Loading conversations...
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: theme.fonts.primary
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            marginRight: '15px',
            color: theme.colors.text
          }}
        >
          ←
        </button>
        <h1 style={{
          margin: 0,
          color: theme.colors.text,
          fontSize: '28px',
          fontWeight: '600'
        }}>
          💬 Your Conversations
        </h1>
      </div>

      {conversations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: theme.colors.surface,
          borderRadius: '15px',
          boxShadow: theme.shadows.card
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>💬</div>
          <h3 style={{
            color: theme.colors.text,
            marginBottom: '10px'
          }}>
            No Conversations Yet
          </h3>
          <p style={{
            color: theme.colors.textSecondary,
            marginBottom: '20px'
          }}>
            {currentUser.role === 'student' 
              ? 'Start a conversation with a guide from the guides page!'
              : 'Students will reach out to you for guidance.'
            }
          </p>
          {currentUser.role === 'student' && (
            <button
              onClick={() => navigate('/guides')}
              style={{
                padding: '12px 24px',
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Browse Guides
            </button>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '15px',
          boxShadow: theme.shadows.card,
          overflow: 'hidden'
        }}>
          {conversations.map((conversation, index) => {
            const partnerName = currentUser.role === 'student' 
              ? conversation.guide_name 
              : conversation.student_name;
            const partnerRole = currentUser.role === 'student' ? 'guide' : 'student';
            
            return (
              <div
                key={`${conversation.student_id}-${conversation.guide_id}`}
                onClick={() => handleConversationClick(conversation)}
                style={{
                  padding: '20px',
                  borderBottom: index < conversations.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  ':hover': {
                    backgroundColor: theme.colors.background
                  }
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = theme.colors.background}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        margin: 0,
                        color: theme.colors.text,
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {partnerName}
                      </h3>
                      <span style={{
                        marginLeft: '8px',
                        fontSize: '12px',
                        padding: '2px 8px',
                        backgroundColor: partnerRole === 'guide' ? theme.colors.success : theme.colors.info,
                        color: 'white',
                        borderRadius: '10px'
                      }}>
                        {partnerRole === 'guide' ? '🎓 Guide' : '👨‍🎓 Student'}
                      </span>
                    </div>
                    
                    <p style={{
                      margin: 0,
                      color: theme.colors.textSecondary,
                      fontSize: '14px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      <strong>
                        {conversation.last_sender === currentUser.role ? 'You' : partnerName}:
                      </strong>{' '}
                      {conversation.last_message}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginLeft: '15px'
                  }}>
                    <span style={{
                      color: theme.colors.textSecondary,
                      fontSize: '12px',
                      marginBottom: '5px'
                    }}>
                      {formatTime(conversation.last_sent_at)}
                    </span>
                    
                    {conversation.unread_count > 0 && (
                      <span style={{
                        backgroundColor: theme.colors.error,
                        color: 'white',
                        borderRadius: '10px',
                        padding: '2px 6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        minWidth: '18px',
                        textAlign: 'center'
                      }}>
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Conversations;