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

  if (loading) {
    return (
      <div style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          paddingTop: '50px'
        }}>
          <p style={{ color: theme.colors.text, fontSize: '18px' }}>Loading your applications...</p>
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
            📋 My Applications
          </h1>
          <button
            onClick={() => navigate('/projects')}
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
            🚀 Browse More Projects
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
            borderRadius: '12px',
            boxShadow: theme.shadows.card
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>📭</div>
            <h3 style={{ color: theme.colors.text, marginBottom: '15px' }}>
              No Applications Yet
            </h3>
            <p style={{ color: theme.colors.textSecondary, marginBottom: '30px' }}>
              You haven't applied to any projects yet. Start exploring and apply to projects that match your interests!
            </p>
            <button
              onClick={() => navigate('/projects')}
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
              🚀 Explore Projects
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '25px'
          }}>
            {appliedProjects.map((application) => (
              <div
                key={application.id}
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
                onClick={() => navigate(`/projects/${application.project_id}`)}
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
                    {application.project_title || application.project?.title || 'Project Title'}
                  </h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: getStatusColor(application.status) + '20',
                    color: getStatusColor(application.status),
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: `1px solid ${getStatusColor(application.status)}40`
                  }}>
                    <span>{getStatusIcon(application.status)}</span>
                    <span style={{ textTransform: 'capitalize' }}>
                      {application.status || 'Pending'}
                    </span>
                  </div>
                </div>

                <p style={{
                  color: theme.colors.textSecondary,
                  fontSize: '14px',
                  lineHeight: '1.6',
                  marginBottom: '15px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {application.project?.description || 'No description available'}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '15px'
                }}>
                  {application.project?.skills?.split(',').slice(0, 3).map((skill, index) => (
                    <span
                      key={index}
                      style={{
                        backgroundColor: theme.colors.primary + '20',
                        color: theme.colors.primary,
                        padding: '4px 12px',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                  {application.project?.skills?.split(',').length > 3 && (
                    <span style={{
                      color: theme.colors.textSecondary,
                      fontSize: '12px',
                      padding: '4px 8px'
                    }}>
                      +{application.project.skills.split(',').length - 3} more
                    </span>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                  marginBottom: '20px'
                }}>
                  <span>💰 {application.project?.budget || 'Budget not specified'}</span>
                  <span>📅 Applied: {new Date(application.created_at || application.CreatedAt).toLocaleDateString()}</span>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/projects/${application.project_id}`);
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
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = theme.colors.danger;
                        e.target.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                        e.target.style.color = theme.colors.danger;
                      }}
                    >
                      🚫 Withdraw
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
