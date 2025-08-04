import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils } from './utils/api';

const CompanyApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchCompanyApplications();
  }, []);

  const fetchCompanyApplications = async () => {
    try {
      const token = utils.getToken();
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:8080/api/company/applications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setApplications(data.applications || []);
      } else {
        setError(data.error || 'Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching company applications:', error);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#00b966';
      case 'rejected':
        return '#ff4757';
      case 'pending':
        return '#ffa502';
      default:
        return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '✅';
      case 'rejected':
        return '❌';
      case 'pending':
        return '⏳';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: theme.colors.background,
        padding: '20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          fontSize: '18px',
          color: theme.colors.text
        }}>
          Loading applications...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: theme.colors.background,
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              color: theme.colors.text,
              margin: '0 0 8px 0'
            }}>
              Project Applications
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              View and manage applications for your posted projects
            </p>
          </div>
          <button
            onClick={() => navigate('/company/projects')}
            style={{
              padding: '12px 24px',
              backgroundColor: theme.colors.primary,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 185, 102, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            View My Projects
          </button>
        </div>

        {error && (
          <div style={{
            background: theme.colors.danger + '20',
            border: `1px solid ${theme.colors.danger}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            color: theme.colors.danger
          }}>
            {error}
          </div>
        )}

        {applications.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: theme.colors.surface,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              📋
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: '8px'
            }}>
              No Applications Yet
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.textSecondary,
              marginBottom: '24px'
            }}>
              Applications for your posted projects will appear here.
            </p>
            <button
              onClick={() => navigate('/post-project')}
              style={{
                padding: '12px 24px',
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              Post a Project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '24px'
          }}>
            {applications.map((application, index) => (
              <div
                key={application.id}
                style={{
                  background: theme.colors.surface,
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid ${theme.colors.border}`,
                  transition: 'all 0.3s ease',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.borderColor = theme.colors.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = theme.colors.border;
                }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: getStatusColor(application.status) + '20',
                    color: getStatusColor(application.status),
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
                    <span>{getStatusIcon(application.status)}</span>
                    {application.status}
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${application.project_id}`)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: theme.colors.primary,
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    View Project
                  </button>
                </div>

                {/* Project Info */}
                <div style={{ marginBottom: '16px' }}>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    color: theme.colors.text,
                    margin: '0 0 8px 0'
                  }}>
                    {application.Project?.title || application.project_title}
                  </h3>
                  {application.Project?.description && (
                    <p style={{
                      fontSize: '14px',
                      color: theme.colors.textSecondary,
                      lineHeight: '1.5',
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {application.Project.description}
                    </p>
                  )}
                </div>

                {/* Student Info */}
                <div style={{
                  padding: '16px',
                  backgroundColor: theme.colors.background,
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: theme.colors.text,
                    margin: '0 0 8px 0'
                  }}>
                    Applicant Details
                  </h4>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '8px'
                  }}>
                    {application.Student?.picture && (
                      <img 
                        src={application.Student.picture} 
                        alt={application.Student.name}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: `2px solid ${theme.colors.border}`
                        }}
                      />
                    )}
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: theme.colors.text
                      }}>
                        {application.Student?.name || 'Unknown Student'}
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: theme.colors.textSecondary
                      }}>
                        {application.Student?.email}
                      </div>
                    </div>
                  </div>
                  {application.Student?.university && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.textSecondary
                    }}>
                      📚 {application.Student.university}
                    </div>
                  )}
                  {application.Student?.major && (
                    <div style={{
                      fontSize: '12px',
                      color: theme.colors.textSecondary
                    }}>
                      🎓 {application.Student.major}
                    </div>
                  )}
                </div>

                {/* GitHub Repository */}
                {application.github_repo_url && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: theme.colors.primary + '10',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: theme.colors.primary,
                      marginBottom: '4px'
                    }}>
                      📁 GitHub Repository
                    </div>
                    <a 
                      href={application.github_repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: '14px',
                        color: theme.colors.primary,
                        textDecoration: 'none',
                        wordBreak: 'break-all'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.textDecoration = 'none';
                      }}
                    >
                      {application.github_repo_url}
                    </a>
                  </div>
                )}

                {/* Application Date */}
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: '16px',
                  paddingTop: '16px',
                  borderTop: `1px solid ${theme.colors.border}`
                }}>
                  Applied: {new Date(application.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default CompanyApplications;
