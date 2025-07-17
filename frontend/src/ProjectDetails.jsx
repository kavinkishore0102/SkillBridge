import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, projectAPI } from './utils/api';

function ProjectDetails() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();
  const user = utils.getUser();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchProjectDetails();
  }, [id, navigate]);

  const fetchProjectDetails = async () => {
    try {
      const token = utils.getToken();
      const response = await projectAPI.getProjectById(id, token);
      setProject(response.data);
      
      // Check if user has already applied (if endpoint exists)
      if (user.role === 'student') {
        checkApplicationStatus();
      }
    } catch (error) {
      console.error('Error fetching project details:', error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    try {
      const token = utils.getToken();
      const response = await projectAPI.checkApplicationStatus(id, token);
      setHasApplied(response.data.hasApplied);
    } catch (error) {
      // If endpoint doesn't exist, assume not applied
      setHasApplied(false);
    }
  };

  const handleApply = async () => {
    if (!user || user.role !== 'student') {
      alert('Only students can apply to projects');
      return;
    }

    setApplying(true);
    try {
      const token = utils.getToken();
      await projectAPI.applyToProject(id, token);
      
      setHasApplied(true);
      addNotification(
        `Successfully applied to "${project.title}"! You will be notified about the review status.`,
        "Just now"
      );
      
      // Trigger a storage event to notify other components about the change
      window.dispatchEvent(new CustomEvent('applicationsUpdated'));
      
    } catch (error) {
      console.error('Error applying to project:', error);
      alert('Failed to apply to project. You may have already applied.');
    } finally {
      setApplying(false);
    }
  };

  const isDeadlineSoon = (deadline) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff <= 7 && daysDiff > 0;
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
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
          maxWidth: '1000px',
          margin: '0 auto',
          paddingTop: '50px'
        }}>
          <p style={{ color: theme.colors.text, fontSize: '18px' }}>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{
        backgroundColor: theme.colors.background,
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          paddingTop: '50px'
        }}>
          <h2 style={{ color: theme.colors.text }}>Project not found</h2>
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
              marginTop: '20px'
            }}
          >
            ← Back to Projects
          </button>
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
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px'
        }}>
          <button
            onClick={() => navigate('/projects')}
            style={{
              background: 'transparent',
              color: theme.colors.textSecondary,
              border: `2px solid ${theme.colors.textSecondary}`,
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = theme.colors.textSecondary;
              e.target.style.color = theme.colors.surface;
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = theme.colors.textSecondary;
            }}
          >
            ← Back to Projects
          </button>

          {user.role === 'student' && !isDeadlinePassed(project.deadline) && (
            <button
              onClick={handleApply}
              disabled={applying || hasApplied}
              style={{
                background: hasApplied 
                  ? theme.colors.success
                  : applying 
                    ? theme.colors.textSecondary 
                    : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                color: 'white',
                border: 'none',
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: (applying || hasApplied) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: (applying || hasApplied) ? 0.7 : 1
              }}
            >
              {hasApplied ? '✅ Applied' : applying ? '⏳ Applying...' : '🚀 Apply Now'}
            </button>
          )}
        </div>

        {/* Main Content */}
        <div style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          padding: '40px',
          boxShadow: theme.shadows.card,
          marginBottom: '30px'
        }}>
          {/* Title and Status */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '25px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <h1 style={{
              color: theme.colors.text,
              fontSize: '36px',
              fontWeight: 'bold',
              margin: 0,
              flex: 1,
              minWidth: '300px'
            }}>
              {project.title}
            </h1>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              alignItems: 'flex-end'
            }}>
              <div style={{
                backgroundColor: theme.colors.primary + '20',
                color: theme.colors.primary,
                padding: '8px 16px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                border: `1px solid ${theme.colors.primary}40`
              }}>
                💰 {project.budget}
              </div>
              
              {project.deadline && (
                <div style={{
                  backgroundColor: isDeadlineSoon(project.deadline) || isDeadlinePassed(project.deadline)
                    ? theme.colors.danger + '20'
                    : theme.colors.success + '20',
                  color: isDeadlineSoon(project.deadline) || isDeadlinePassed(project.deadline)
                    ? theme.colors.danger
                    : theme.colors.success,
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  border: `1px solid ${(isDeadlineSoon(project.deadline) || isDeadlinePassed(project.deadline)
                    ? theme.colors.danger
                    : theme.colors.success)}40`
                }}>
                  {isDeadlinePassed(project.deadline) 
                    ? '⏰ Deadline Passed' 
                    : `📅 Due: ${new Date(project.deadline).toLocaleDateString()}`}
                </div>
              )}
            </div>
          </div>

          {/* Company Info */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            marginBottom: '30px',
            padding: '15px',
            backgroundColor: theme.colors.background,
            borderRadius: '8px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: theme.colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              🏢
            </div>
            <div>
              <h3 style={{ color: theme.colors.text, margin: '0 0 5px 0', fontSize: '18px' }}>
                {project.company_name || 'Company Name'}
              </h3>
              <p style={{ color: theme.colors.textSecondary, margin: 0, fontSize: '14px' }}>
                Posted on {new Date(project.CreatedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '15px', fontSize: '24px' }}>
              📝 Project Description
            </h3>
            <p style={{
              color: theme.colors.textSecondary,
              fontSize: '16px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap'
            }}>
              {project.description}
            </p>
          </div>

          {/* Requirements */}
          {project.requirements && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ color: theme.colors.text, marginBottom: '15px', fontSize: '24px' }}>
                📋 Requirements
              </h3>
              <p style={{
                color: theme.colors.textSecondary,
                fontSize: '16px',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap'
              }}>
                {project.requirements}
              </p>
            </div>
          )}

          {/* Skills */}
          <div style={{ marginBottom: '30px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '15px', fontSize: '24px' }}>
              🛠️ Required Skills
            </h3>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              {project.skills?.split(',').map((skill, index) => (
                <span
                  key={index}
                  style={{
                    backgroundColor: theme.colors.primary + '20',
                    color: theme.colors.primary,
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: `1px solid ${theme.colors.primary}40`
                  }}
                >
                  {skill.trim()}
                </span>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            padding: '20px',
            backgroundColor: theme.colors.background,
            borderRadius: '8px'
          }}>
            <div>
              <h4 style={{ color: theme.colors.text, margin: '0 0 8px 0' }}>📊 Difficulty</h4>
              <p style={{ color: theme.colors.textSecondary, margin: 0, textTransform: 'capitalize' }}>
                {project.difficulty || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 style={{ color: theme.colors.text, margin: '0 0 8px 0' }}>⏱️ Duration</h4>
              <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                {project.duration || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 style={{ color: theme.colors.text, margin: '0 0 8px 0' }}>👥 Team Size</h4>
              <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                {project.team_size || 'Not specified'}
              </p>
            </div>
            <div>
              <h4 style={{ color: theme.colors.text, margin: '0 0 8px 0' }}>📍 Location</h4>
              <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                {project.location || 'Remote'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons for Students */}
        {user.role === 'student' && !isDeadlinePassed(project.deadline) && (
          <div style={{
            backgroundColor: theme.colors.surface,
            borderRadius: '12px',
            padding: '30px',
            boxShadow: theme.shadows.card,
            textAlign: 'center'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
              Interested in this project?
            </h3>
            <button
              onClick={handleApply}
              disabled={applying || hasApplied}
              style={{
                background: hasApplied 
                  ? theme.colors.success
                  : applying 
                    ? theme.colors.textSecondary 
                    : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                color: 'white',
                border: 'none',
                padding: '18px 40px',
                borderRadius: '8px',
                fontSize: '20px',
                fontWeight: '600',
                cursor: (applying || hasApplied) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: (applying || hasApplied) ? 0.7 : 1
              }}
            >
              {hasApplied ? '✅ Application Submitted' : applying ? '⏳ Submitting Application...' : '🚀 Submit Application'}
            </button>
            
            {hasApplied && (
              <p style={{ color: theme.colors.textSecondary, marginTop: '15px', fontSize: '14px' }}>
                You have successfully applied to this project. You will be notified about the status of your application.
              </p>
            )}
          </div>
        )}

        {/* Deadline Warning */}
        {isDeadlinePassed(project.deadline) && (
          <div style={{
            backgroundColor: theme.colors.danger + '20',
            color: theme.colors.danger,
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.danger}40`
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>⏰ Application Deadline Passed</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              The deadline for this project was {new Date(project.deadline).toLocaleDateString()}. 
              Applications are no longer being accepted.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetails;
