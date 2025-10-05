import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, submissionAPI } from './utils/api';

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const theme = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const token = utils.getToken();
    if (!token) {
      navigate('/');
      return;
    }



    fetchSubmissions();
  }, [navigate, location.state]);

  const fetchSubmissions = async () => {
    try {
      const token = utils.getToken();
      const response = await submissionAPI.getMySubmissions(token);
      setSubmissions(response.submissions || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.danger;
      case 'pending':
      case 'submitted':
        return theme.colors.warning;
      case 'reviewed':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'accepted':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
      case 'submitted':
        return '⏳';
      case 'reviewed':
        return '👁️';
      default:
        return '📄';
    }
  };

  const handleViewSubmission = (submissionId) => {
    // Navigate to submission details page
    navigate(`/submissions/${submissionId}`);
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
            border: `3px solid ${theme.colors.primary}20`,
            borderTop: `3px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ fontSize: '18px' }}>Loading submissions...</p>
        </div>
      </div>
    );
  }

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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <h1 style={{
            color: theme.colors.text,
            fontSize: '32px',
            fontWeight: 'bold',
            margin: 0
          }}>
            📝 My Submissions
          </h1>
          <button
            onClick={() => navigate('/applied-projects')}
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            📋 View Applications
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

        {submissions.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`
          }}>
            <div style={{
              fontSize: '64px',
              marginBottom: '20px'
            }}>
              📋
            </div>
            <h3 style={{
              color: theme.colors.text,
              fontSize: '24px',
              marginBottom: '10px'
            }}>
              No Submissions Yet
            </h3>
            <p style={{
              color: theme.colors.textSecondary,
              fontSize: '16px',
              marginBottom: '30px',
              lineHeight: '1.5'
            }}>
              You haven't submitted any projects yet. Once you're accepted for a project and submit your work, it will appear here.
            </p>
            <button
              onClick={() => navigate('/applied-projects')}
              style={{
                background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              📋 View My Applications
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '25px'
          }}>
            {submissions.map((submission) => (
              <div
                key={submission.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: '12px',
                  padding: '25px',
                  boxShadow: theme.shadows.card,
                  border: `1px solid ${theme.colors.border}`,
                  transition: 'transform 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                onClick={() => handleViewSubmission(submission.id)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    color: theme.colors.text,
                    fontSize: '20px',
                    fontWeight: 'bold',
                    margin: 0,
                    flex: 1
                  }}>
                    {submission.project?.title || 'Project Submission'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: getStatusColor(submission.status) + '20',
                    color: getStatusColor(submission.status),
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: `1px solid ${getStatusColor(submission.status)}40`
                  }}>
                    <span>{getStatusIcon(submission.status)}</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {submission.status || 'Submitted'}
                    </span>
                  </div>
                </div>

                <div style={{
                  backgroundColor: theme.colors.background,
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px',
                  border: `1px solid ${theme.colors.border}`
                }}>
                  <h4 style={{
                    color: theme.colors.text,
                    fontSize: '14px',
                    fontWeight: '600',
                    margin: '0 0 8px 0'
                  }}>
                    Submission Description:
                  </h4>
                  <p style={{
                    color: theme.colors.textSecondary,
                    fontSize: '13px',
                    lineHeight: '1.5',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {submission.description || 'No description provided'}
                  </p>
                </div>

                {submission.github_url && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '15px',
                    padding: '10px',
                    backgroundColor: theme.colors.primary + '10',
                    borderRadius: '6px',
                    border: `1px solid ${theme.colors.primary}30`
                  }}>
                    <span style={{ fontSize: '16px' }}>🔗</span>
                    <span style={{
                      color: theme.colors.primary,
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      GitHub Repository
                    </span>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                  marginBottom: '20px'
                }}>
                  <span>📅 Submitted: {new Date(submission.created_at || submission.CreatedAt).toLocaleDateString()}</span>
                  {submission.grade && (
                    <span style={{
                      backgroundColor: theme.colors.success + '20',
                      color: theme.colors.success,
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontWeight: '600'
                    }}>
                      Grade: {submission.grade}
                    </span>
                  )}
                </div>

                {submission.feedback && (
                  <div style={{
                    backgroundColor: theme.colors.info + '10',
                    border: `1px solid ${theme.colors.info}30`,
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '15px'
                  }}>
                    <h4 style={{
                      color: theme.colors.info,
                      fontSize: '14px',
                      fontWeight: '600',
                      margin: '0 0 6px 0'
                    }}>
                      💬 Feedback:
                    </h4>
                    <p style={{
                      color: theme.colors.text,
                      fontSize: '13px',
                      lineHeight: '1.4',
                      margin: 0
                    }}>
                      {submission.feedback}
                    </p>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewSubmission(submission.id);
                    }}
                    style={{
                      background: 'transparent',
                      color: theme.colors.primary,
                      border: `2px solid ${theme.colors.primary}`,
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
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
                    📄 View Details
                  </button>
                  
                  {submission.github_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(submission.github_url, '_blank');
                      }}
                      style={{
                        background: 'transparent',
                        color: theme.colors.secondary,
                        border: `2px solid ${theme.colors.secondary}`,
                        padding: '8px 16px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.secondary;
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = theme.colors.secondary;
                      }}
                    >
                      🔗 GitHub
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

export default Submissions;
