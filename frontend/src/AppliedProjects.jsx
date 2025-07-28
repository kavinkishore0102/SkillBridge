import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, dashboardAPI, projectAPI } from './utils/api';

function AppliedProjects() {
  const [appliedProjects, setAppliedProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  // Debug theme colors
  console.log('Theme colors:', theme.colors);
  console.log('Blue color:', theme.colors.blue);

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'student') {
      navigate('/dashboard');
      return;
    }

    fetchAppliedProjects();

    // Listen for application updates from other components
    const handleApplicationsUpdate = () => {
      console.log('Applications updated, refreshing applied projects...');
      fetchAppliedProjects();
    };

    window.addEventListener('applicationsUpdated', handleApplicationsUpdate);
    
    return () => {
      window.removeEventListener('applicationsUpdated', handleApplicationsUpdate);
    };
  }, [navigate]);

  const fetchAppliedProjects = async () => {
    try {
      const token = utils.getToken();
      const response = await dashboardAPI.getMyApplications(token);
      console.log('Applied Projects - API response:', response);
      console.log('Applied Projects - Applications array:', response.applications);
      console.log('Applied Projects - Applications count:', response.applications?.length);
      setAppliedProjects(response.applications || []);
    } catch (error) {
      console.error('Error fetching applied projects:', error);
      setError('Failed to load applied projects');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (projectId, projectTitle) => {
    if (!confirm(`Are you sure you want to withdraw from "${projectTitle}"?`)) {
      return;
    }

    try {
      const token = utils.getToken();
      await projectAPI.withdrawApplication(projectId, token);
      
      // Remove from local state
      setAppliedProjects(prev => prev.filter(app => app.project_id !== projectId));
      
      addNotification(`Withdrawn from "${projectTitle}"`, 'Just now');
      
      // Trigger a storage event to notify other components about the change
      window.dispatchEvent(new CustomEvent('applicationsUpdated'));
      
    } catch (error) {
      console.error('Error withdrawing application:', error);
      alert('Failed to withdraw application. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return theme.colors.success;
      case 'rejected': return theme.colors.danger;
      case 'pending': return theme.colors.warning;
      default: return theme.colors.textSecondary;
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'accepted': return '✅';
      case 'rejected': return '❌';
      case 'pending': return '⏳';
      default: return '📋';
    }
  };

  const handleViewDetails = (application) => {
    // Navigate to the project details page
    console.log('=== VIEW DETAILS CLICKED ===');
    console.log('Application object:', application);
    console.log('Project ID:', application.project_id);
    console.log('Navigating to:', `/projects/${application.project_id}`);
    
    try {
      navigate(`/projects/${application.project_id}`);
      console.log('Navigation successful');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          animation: 'fadeIn 0.8s ease-out'
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
          <p style={{ 
            color: theme.colors.text, 
            fontSize: '18px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>Loading your applications...</p>
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
          marginBottom: '30px',
          animation: 'fadeInDown 0.6s ease-out'
        }}>
          <h1 style={{
            color: theme.colors.text,
            fontSize: '28px',
            fontWeight: '600',
            margin: 0,
            letterSpacing: '-0.025em',
            background: `linear-gradient(135deg, ${theme.colors.text} 0%, ${theme.colors.primary} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            My Applications
          </h1>
          <button
            onClick={() => navigate('/projects')}
            style={{
              background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.secondary} 100%)`,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: `0 4px 15px ${theme.colors.primary}30`,
              transform: 'translateY(0)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `0 8px 25px ${theme.colors.primary}40`;
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = `0 4px 15px ${theme.colors.primary}30`;
            }}
          >
            Browse Projects
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

        {appliedProjects.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: theme.colors.surface,
            borderRadius: '8px',
            border: `1px solid ${theme.colors.border}`
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px',
              color: theme.colors.textSecondary
            }}>�</div>
            <h3 style={{ 
              color: theme.colors.text, 
              marginBottom: '8px',
              fontSize: '18px',
              fontWeight: '600'
            }}>
              No Applications Yet
            </h3>
            <p style={{ 
              color: theme.colors.textSecondary, 
              marginBottom: '24px',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              You haven't applied to any projects yet. Start exploring and apply to projects that match your skills.
            </p>
            <button
              onClick={() => navigate('/projects')}
              style={{
                background: theme.colors.primary,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.9'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              Explore Projects
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {appliedProjects.map((application, index) => (
              <div
                key={application.id}
                style={{
                  backgroundColor: theme.colors.surface,
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid ${theme.colors.border}`,
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                  transform: 'translateY(0)',
                  animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.borderColor = theme.colors.primary;
                  e.currentTarget.style.boxShadow = `0 12px 28px ${theme.colors.primary}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = theme.colors.border;
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                }}
                onClick={() => navigate(`/projects/${application.project_id}`)}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '12px'
                }}>
                  <h3 style={{
                    color: theme.colors.text,
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: 0,
                    flex: 1
                  }}>
                    {application.project_title || application.project?.title || 'Project Title'}
                  </h3>
                  <span style={{
                    backgroundColor: getStatusColor(application.status) + '20',
                    color: getStatusColor(application.status),
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    textTransform: 'capitalize',
                    marginLeft: '12px',
                    transition: 'all 0.3s ease',
                    border: `1px solid ${getStatusColor(application.status)}40`,
                    animation: 'pulse 2s infinite'
                  }}>
                    {application.status || 'Pending'}
                  </span>
                </div>

                <p style={{
                  color: theme.colors.textSecondary,
                  fontSize: '13px',
                  lineHeight: '1.5',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {application.project?.description || 'No description available'}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '12px'
                }}>
                  {application.project?.skills?.split(',').slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: theme.colors.border,
                        color: theme.colors.textSecondary,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                  {application.project?.skills?.split(',').length > 3 && (
                    <span style={{
                      color: theme.colors.textSecondary,
                      fontSize: '11px',
                      padding: '2px 4px'
                    }}>
                      +{application.project.skills.split(',').length - 3} more
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '12px',
                  color: theme.colors.textSecondary,
                  marginBottom: '16px'
                }}>
                  <span>Applied: {new Date(application.created_at || application.CreatedAt).toLocaleDateString()}</span>
                  <span>{application.project?.budget || 'Budget TBD'}</span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewDetails(application);
                    }}
                    style={{
                      background: 'transparent',
                      color: theme.colors.blue,
                      border: `2px solid ${theme.colors.blue}`,
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      transform: 'translateY(0)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = theme.colors.blue;
                      e.target.style.color = 'white';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = `0 6px 20px ${theme.colors.blue}30`;
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.color = theme.colors.blue;
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    View Details
                  </button>
                  
                  {(application.status === 'pending' || !application.status) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWithdraw(application.project_id, application.project_title || application.project?.title || 'Project');
                      }}
                      style={{
                        background: 'transparent',
                        color: theme.colors.danger,
                        border: `2px solid ${theme.colors.danger}`,
                        padding: '8px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        transform: 'translateY(0)'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.danger;
                        e.target.style.color = 'white';
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = `0 6px 20px ${theme.colors.danger}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = theme.colors.danger;
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      Withdraw
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AppliedProjects;
