import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, guidesAPI, chatAPI } from './utils/api';

function Guides() {
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectedGuideIds, setConnectedGuideIds] = useState([]);
  const [connecting, setConnecting] = useState(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    // Allow only students to access this page
    if (user.role !== 'student') {
      navigate('/dashboard');
      return;
    }

    fetchGuides();
  }, [navigate]);

  const fetchGuides = async () => {
    try {
      // Always fetch guides (public endpoint)
      const guidesResponse = await guidesAPI.getAllGuides();
      console.log('Guides response:', guidesResponse);
      setGuides(guidesResponse.guides || []);
      
      // Try to fetch connected guides (requires auth)
      try {
        const connectedResponse = await chatAPI.getConnectedGuides();
        console.log('Connected guides response:', connectedResponse);
        setConnectedGuideIds(connectedResponse.connected_guide_ids || []);
      } catch (connectedError) {
        console.warn('Could not fetch connected guides (user might not be logged in):', connectedError);
        // If user is not authenticated, just show all guides
        setConnectedGuideIds([]);
      }
    } catch (error) {
      console.error('Error fetching guides:', error);
      setError('Failed to load guides');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGuide = async (guide) => {
    setConnecting(guide.id);
    
    try {
      console.log('=== CONNECT GUIDE DEBUG ===');
      console.log('Connecting to guide:', guide);
      
      const user = utils.getUser();
      const token = utils.getToken();
      console.log('Current user:', user);
      console.log('Token exists:', token ? 'Yes' : 'No');
      console.log('User role:', user?.role);
      
      if (!user) {
        throw new Error('User not logged in');
      }
      
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      console.log('Calling startConversation with guide ID:', guide.id);
      const response = await chatAPI.startConversation(guide.id);
      console.log('StartConversation response:', response);
      
      if (response.message === "Conversation already exists") {
        addNotification(
          `✅ You're already connected with ${guide.name}! Opening chat...`,
          "Just now"
        );
      } else {
        addNotification(
          `🎉 Successfully connected with ${guide.name}! Opening chat...`,
          "Just now"
        );
        // Update connected guides list
        setConnectedGuideIds(prev => [...prev, guide.id]);
      }
      
      // Navigate to chat
      const currentUser = utils.getUser();
      console.log('Current user:', currentUser);
      navigate(`/chat/${currentUser.id}/${guide.id}`);
    } catch (error) {
      console.error('Error starting conversation:', error);
      
      let errorMessage = `❌ Failed to connect with ${guide.name}.`;
      if (error.message) {
        errorMessage += ` ${error.message}`;
      }
      if (error.response && error.response.status === 401) {
        errorMessage += ' Please try logging in again.';
      }
      
      addNotification(errorMessage, "Just now");
    } finally {
      setConnecting(null);
    }
  };

  const handleViewProfile = (guide) => {
    // Navigate to guide profile or show more details
    console.log('View profile for guide:', guide);
    // For now, just show an alert with guide info
    alert(`Guide Profile:\n\nName: ${guide.name}\nBio: ${guide.bio}\nUniversity: ${guide.university || 'N/A'}\nMajor: ${guide.major || 'N/A'}`);
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          color: theme.colors.text
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `4px solid ${theme.colors.border}`,
            borderTop: `4px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '18px', margin: 0 }}>Loading guides...</p>
        </div>
      </div>
    );
  }

  const availableGuides = guides.filter(guide => !connectedGuideIds.includes(guide.id));
  const connectedCount = guides.length - availableGuides.length;

  return (
    <div style={{
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '30px',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{
              color: theme.colors.text,
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              🎓 Connect with Guides
            </h1>
            <p style={{
              color: theme.colors.textSecondary,
              fontSize: '16px',
              margin: 0
            }}>
              Get guidance and mentorship from experienced professionals
            </p>
          </div>
          
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: theme.colors.surface,
              color: theme.colors.text,
              border: `1px solid ${theme.colors.border}`,
              padding: '12px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            📊 Back to Dashboard
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: theme.colors.danger + '20',
            color: theme.colors.danger,
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '20px',
            border: `1px solid ${theme.colors.danger}40`
          }}>
            {error}
          </div>
        )}

        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '15px',
          padding: '30px',
          boxShadow: theme.shadows.card,
          marginBottom: '20px'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '30px'
          }}>
            <h2 style={{
              color: theme.colors.text,
              fontSize: '24px',
              fontWeight: '600',
              marginBottom: '10px'
            }}>
              Available Guides
            </h2>
            <p style={{
              color: theme.colors.textSecondary,
              fontSize: '16px',
              marginBottom: '30px',
              textAlign: 'center'
            }}>
              Connect with experienced guides who can help you with your projects and career development. 
              <br />
              <strong>{availableGuides.length}</strong> guide{availableGuides.length !== 1 ? 's' : ''} available to connect
              {connectedCount > 0 && (
                <span style={{ color: theme.colors.success }}>
                  {' '}• Already connected with <strong>{connectedCount}</strong> guide{connectedCount !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>

          {availableGuides.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px 20px',
              backgroundColor: theme.colors.background,
              borderRadius: '15px',
              border: `1px solid ${theme.colors.border}`
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>🎉</div>
              <h3 style={{
                color: theme.colors.text,
                marginBottom: '10px'
              }}>
                You're Connected with All Guides!
              </h3>
              <p style={{
                color: theme.colors.textSecondary,
                marginBottom: '20px'
              }}>
                Great job! You've connected with all available guides. 
                Check your conversations to start chatting with them.
              </p>
              <button
                onClick={() => navigate('/conversations')}
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
                💬 View My Conversations
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {availableGuides.map((guide) => (
                <div
                  key={guide.id}
                  style={{
                    backgroundColor: theme.colors.background,
                    borderRadius: '12px',
                    padding: '24px',
                    border: `1px solid ${theme.colors.border}`,
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = theme.shadows.hover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '15px'
                  }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: theme.colors.primary + '20',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      fontSize: '20px'
                    }}>
                      {guide.picture ? (
                        <img 
                          src={guide.picture} 
                          alt={guide.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        '👨‍🏫'
                      )}
                    </div>
                    <div>
                      <h3 style={{
                        color: theme.colors.text,
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: '0 0 4px 0'
                      }}>
                        {guide.name}
                      </h3>
                      <p style={{
                        color: theme.colors.textSecondary,
                        fontSize: '14px',
                        margin: 0
                      }}>
                        🎓 Guide
                      </p>
                    </div>
                  </div>

                  <div style={{
                    marginBottom: '15px'
                  }}>
                    <p style={{
                      color: theme.colors.textSecondary,
                      fontSize: '14px',
                      lineHeight: '1.5',
                      margin: 0
                    }}>
                      {guide.bio || 'Experienced guide ready to help you with your projects and career development.'}
                    </p>
                  </div>

                  {(guide.university || guide.major || guide.position) && (
                    <div style={{
                      marginBottom: '15px',
                      padding: '12px',
                      backgroundColor: theme.colors.surface,
                      borderRadius: '8px',
                      border: `1px solid ${theme.colors.border}`
                    }}>
                      {guide.university && (
                        <p style={{
                          color: theme.colors.textSecondary,
                          fontSize: '12px',
                          margin: '0 0 4px 0'
                        }}>
                          🏫 {guide.university}
                        </p>
                      )}
                      {guide.major && (
                        <p style={{
                          color: theme.colors.textSecondary,
                          fontSize: '12px',
                          margin: '0 0 4px 0'
                        }}>
                          📚 {guide.major}
                        </p>
                      )}
                      {guide.position && (
                        <p style={{
                          color: theme.colors.textSecondary,
                          fontSize: '12px',
                          margin: 0
                        }}>
                          💼 {guide.position}
                        </p>
                      )}
                    </div>
                  )}

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: '15px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewProfile(guide);
                      }}
                      style={{
                        background: 'transparent',
                        color: theme.colors.primary,
                        border: `1px solid ${theme.colors.primary}`,
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        flex: 1
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.primary;
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = theme.colors.primary;
                      }}
                    >
                      👤 View Profile
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConnectGuide(guide);
                      }}
                      disabled={connecting === guide.id}
                      style={{
                        background: connecting === guide.id ? theme.colors.textSecondary : theme.colors.success,
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: connecting === guide.id ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        flex: 1,
                        opacity: connecting === guide.id ? 0.7 : 1
                      }}
                      onMouseEnter={(e) => {
                        if (connecting === guide.id) return;
                        e.target.style.backgroundColor = theme.colors.success + 'dd';
                        e.target.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        if (connecting === guide.id) return;
                        e.target.style.backgroundColor = theme.colors.success;
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      {connecting === guide.id ? '⏳ Connecting...' : '💬 Connect'}
                    </button>
                  </div>

                  {(guide.github_url || guide.linkedin) && (
                    <div style={{
                      display: 'flex',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '12px',
                      borderTop: `1px solid ${theme.colors.border}`
                    }}>
                      {guide.github_url && (
                        <a
                          href={guide.github_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme.colors.textSecondary,
                            textDecoration: 'none',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.target.style.color = theme.colors.text}
                          onMouseLeave={(e) => e.target.style.color = theme.colors.textSecondary}
                        >
                          🐙 GitHub
                        </a>
                      )}
                      {guide.linkedin && (
                        <a
                          href={guide.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme.colors.textSecondary,
                            textDecoration: 'none',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => e.target.style.color = theme.colors.text}
                          onMouseLeave={(e) => e.target.style.color = theme.colors.textSecondary}
                        >
                          💼 LinkedIn
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Guides;