import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatAPI, utils } from './utils/api.js';
import { useTheme } from './contexts/ThemeContext';

const Conversations = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => utils.getUser());

  useEffect(() => {
    // Check if user is logged in
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }
    setCurrentUser(user);
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const fetchConversations = async () => {
    try {
      setError(null);
      const token = utils.getToken();
      console.log('Token retrieved:', token ? 'Token exists' : 'No token');
      console.log('Token value:', token ? `${token.substring(0, 20)}...` : 'null');
      
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      console.log('Calling chatAPI.getConversations()...');
      const response = await chatAPI.getConversations();
      console.log('Response received:', response);
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load conversations';
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Session expired. Please login again.';
      } else if (error.message.includes('No authentication token')) {
        errorMessage = 'No authentication token found. Please login again.';
      } else {
        errorMessage = error.message || 'Failed to load conversations';
      }
      
      setError(errorMessage);
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

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: theme.fonts?.primary || 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          backgroundColor: theme.colors.surface,
          borderRadius: '15px',
          boxShadow: theme.shadows.card
        }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{
            color: theme.colors.error,
            marginBottom: '10px'
          }}>
            Error Loading Conversations
          </h3>
          <p style={{
            color: theme.colors.textSecondary,
            marginBottom: '20px'
          }}>
            {error}
          </p>
          <button
            onClick={fetchConversations}
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

  // Check if user exists
  if (!currentUser) {
    return null; // Will redirect in useEffect
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: theme.fonts?.primary || 'system-ui, -apple-system, sans-serif'
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
          {currentUser?.role === 'guide' 
            ? '👨‍🎓 Students Who Requested Conversations' 
            : '💬 Your Conversations'
          }
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
            {currentUser?.role === 'student' 
              ? 'Start a conversation with a guide from the guides page!'
              : 'No students have requested conversations yet. Students will appear here when they reach out to you for guidance.'
            }
          </p>
          {currentUser?.role === 'student' && (
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
            const partnerName = currentUser?.role === 'student' 
              ? conversation.guide_name 
              : conversation.student_name;
            const partnerRole = currentUser?.role === 'student' ? 'guide' : 'student';
            const isGuide = currentUser?.role === 'guide';
            
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
                      marginBottom: isGuide ? '12px' : '8px',
                      gap: '10px'
                    }}>
                      {isGuide && (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          backgroundColor: theme.colors.primary,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          fontWeight: '600',
                          color: 'white',
                          flexShrink: 0
                        }}>
                          {conversation.student_name ? conversation.student_name.charAt(0).toUpperCase() : 'S'}
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: isGuide ? '4px' : '0'
                        }}>
                          <h3 style={{
                            margin: 0,
                            color: theme.colors.text,
                            fontSize: isGuide ? '18px' : '16px',
                            fontWeight: '600'
                          }}>
                            {partnerName}
                          </h3>
                          <span style={{
                            fontSize: '12px',
                            padding: '2px 8px',
                            backgroundColor: partnerRole === 'guide' ? theme.colors.success : theme.colors.info,
                            color: 'white',
                            borderRadius: '10px'
                          }}>
                            {partnerRole === 'guide' ? '🎓 Guide' : '👨‍🎓 Student'}
                          </span>
                        </div>
                        {isGuide && (
                          <p style={{
                            margin: 0,
                            color: theme.colors.textSecondary,
                            fontSize: '13px',
                            fontStyle: 'italic'
                          }}>
                            Student ID: {conversation.student_id}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div style={{
                      marginTop: isGuide ? '12px' : '0',
                      padding: isGuide ? '12px' : '0',
                      paddingLeft: isGuide ? '58px' : '0',
                      backgroundColor: isGuide ? theme.colors.background : 'transparent',
                      borderRadius: isGuide ? '8px' : '0'
                    }}>
                      <p style={{
                        margin: 0,
                        color: theme.colors.textSecondary,
                        fontSize: '14px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        <strong style={{ color: theme.colors.text }}>
                          {conversation.last_sender === currentUser?.role ? 'You' : (isGuide ? conversation.student_name : partnerName)}:
                        </strong>{' '}
                        {conversation.last_message}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    marginLeft: '15px',
                    gap: '8px'
                  }}>
                    <span style={{
                      color: theme.colors.textSecondary,
                      fontSize: '12px',
                      whiteSpace: 'nowrap'
                    }}>
                      {formatTime(conversation.last_sent_at)}
                    </span>
                    
                    {conversation.unread_count > 0 && (
                      <span style={{
                        backgroundColor: theme.colors.error,
                        color: 'white',
                        borderRadius: '10px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        minWidth: '20px',
                        textAlign: 'center'
                      }}>
                        {conversation.unread_count} {conversation.unread_count === 1 ? 'new' : 'new'}
                      </span>
                    )}
                    
                    {isGuide && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConversationClick(conversation);
                        }}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: theme.colors.primary,
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Open Chat
                      </button>
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