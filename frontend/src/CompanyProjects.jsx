import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils } from './utils/api';

const CompanyProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    fetchCompanyProjects();
  }, []);

  const fetchCompanyProjects = async () => {
    try {
      const token = utils.getToken();
      if (!token) {
        navigate('/');
        return;
      }

      const response = await fetch('http://localhost:8080/api/company/projects', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProjects(data.projects || []);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('Error fetching company projects:', error);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (projectId, projectTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${projectTitle}"?`)) {
      return;
    }

    try {
      const token = utils.getToken();
      const response = await fetch(`http://localhost:8080/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setProjects(projects.filter(project => project.id !== projectId));
        addNotification(`Project "${projectTitle}" deleted successfully!`, "Just now");
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      setError('Failed to delete project');
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
          Loading your projects...
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
              My Projects
            </h1>
            <p style={{
              fontSize: '16px',
              color: theme.colors.textSecondary,
              margin: 0
            }}>
              Manage your posted projects and view applications
            </p>
          </div>
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
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(0, 185, 102, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            + Post New Project
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

        {projects.length === 0 ? (
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
              📝
            </div>
            <h3 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: '8px'
            }}>
              No Projects Yet
            </h3>
            <p style={{
              fontSize: '16px',
              color: theme.colors.textSecondary,
              marginBottom: '24px'
            }}>
              Start by posting your first project to find talented students.
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
              Post Your First Project
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {projects.map((project, index) => (
              <div
                key={project.id}
                style={{
                  background: theme.colors.surface,
                  borderRadius: '12px',
                  padding: '24px',
                  border: `1px solid ${theme.colors.border}`,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: theme.colors.text,
                    margin: 0,
                    flex: 1
                  }}>
                    {project.title}
                  </h3>
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginLeft: '16px'
                  }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${project.id}`);
                      }}
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
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteProject(project.id, project.title);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: theme.colors.danger,
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <p style={{
                  fontSize: '14px',
                  color: theme.colors.textSecondary,
                  lineHeight: '1.5',
                  marginBottom: '16px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {project.description}
                </p>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '16px'
                }}>
                  {project.skills && project.skills.split(',').map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: theme.colors.primary + '20',
                        color: theme.colors.primary,
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}
                    >
                      {skill.trim()}
                    </span>
                  ))}
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '14px',
                    color: theme.colors.textSecondary
                  }}>
                    Budget: <span style={{ color: theme.colors.text, fontWeight: '600' }}>{project.budget}</span>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: theme.colors.textSecondary
                  }}>
                    Posted: {new Date(project.created_at).toLocaleDateString()}
                  </div>
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

export default CompanyProjects;
