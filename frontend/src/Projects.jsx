import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { projectAPI, utils } from './utils/api';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState('recommended');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  // Get unique skills from all projects
  const getUniqueSkills = (projectsList) => {
    const allSkills = projectsList
      .map(project => project.skills)
      .join(',')
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill !== '');
    return [...new Set(allSkills)];
  };

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const currentUser = utils.getUser();
        setUser(currentUser);

        const token = utils.getToken();
        const response = await projectAPI.getAllProjects(token);
        setProjects(response.projects || []);
        setFilteredProjects(response.projects || []);
      } catch (error) {
        console.error('Error loading projects:', error);
        setError('Failed to load projects');
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, []);

  // Filter and sort projects
  useEffect(() => {
    let filtered = [...projects];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.skills.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Skill filter
    if (skillFilter) {
      filtered = filtered.filter(project =>
        project.skills.toLowerCase().includes(skillFilter.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case 'recommended':
        // Do nothing, keep backend order (which is sorted by relevance)
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.CreatedAt) - new Date(b.CreatedAt));
        break;
      case 'deadline':
        filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    setFilteredProjects(filtered);
  }, [projects, searchTerm, skillFilter, sortBy]);

  const handleApplyToProject = async (projectId) => {
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'student') {
      alert('Only students can apply to projects');
      return;
    }

    try {
      const token = utils.getToken();
      const response = await projectAPI.applyToProject(projectId, token);

      // Find the project to get its title
      const appliedProject = projects.find(p => p.id === projectId);
      const projectTitle = appliedProject ? appliedProject.title : 'Unknown Project';

      // Add notification for successful application
      addNotification(
        `Successfully applied to "${projectTitle}"! You will be notified about the review status.`,
        "Just now"
      );

      alert('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying to project:', error);
      alert('Failed to apply to project. You may have already applied.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isDeadlineSoon = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isDeadlinePassed = (deadline) => {
    return new Date(deadline) < new Date();
  };

  const handleLogout = () => {
    utils.logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme.colors.background,
        color: theme.colors.text
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: `4px solid ${theme.colors.border}`,
            borderTop: `4px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{ fontSize: '18px' }}>Loading projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

          {/* Header */}
          <div style={{
            marginBottom: '30px',
            padding: '30px',
            backgroundColor: theme.colors.card,
            borderRadius: '16px',
            boxShadow: theme.shadows.card,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.colors.primary}20 0%, ${theme.colors.secondary}20 100%)`,
            border: `1px solid ${theme.colors.border}`
          }}>
            <h1 style={{
              margin: '0 0 10px 0',
              color: theme.colors.text,
              fontSize: '32px',
              fontWeight: '700'
            }}>
              🚀 Discover Amazing Projects
            </h1>
            <p style={{
              margin: 0,
              color: theme.colors.textSecondary,
              fontSize: '16px'
            }}>
              Find projects that match your skills and interests
            </p>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '30px',
            padding: '25px',
            backgroundColor: theme.colors.card,
            borderRadius: '16px',
            boxShadow: theme.shadows.card,
            border: `1px solid ${theme.colors.border}`
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: theme.colors.text,
                fontSize: '14px'
              }}>
                🔍 Search Projects
              </label>
              <input
                type="text"
                placeholder="Search by title, description, or skills..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${theme.colors.border}`,
                  fontSize: '14px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  transition: 'border-color 0.2s ease',
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: theme.colors.text,
                fontSize: '14px'
              }}>
                🛠️ Filter by Skills
              </label>
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${theme.colors.border}`,
                  fontSize: '14px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Skills</option>
                {getUniqueSkills(projects).map(skill => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: theme.colors.text,
                fontSize: '14px'
              }}>
                📊 Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: `2px solid ${theme.colors.border}`,
                  fontSize: '14px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  outline: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  cursor: 'pointer'
                }}
              >
                <option value="recommended">Recommended (Skill Match)</option>
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="deadline">Deadline</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          {/* Projects Count */}
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: theme.colors.primary + '20',
            borderRadius: '8px',
            textAlign: 'center',
            border: `1px solid ${theme.colors.border}`
          }}>
            <h3 style={{ margin: 0, color: theme.colors.primary }}>
              {filteredProjects.length} Project{filteredProjects.length !== 1 ? 's' : ''} Found
            </h3>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: '15px',
              backgroundColor: theme.colors.danger + '20',
              color: theme.colors.danger,
              borderRadius: '8px',
              marginBottom: '20px',
              border: `1px solid ${theme.colors.danger}40`
            }}>
              {error}
            </div>
          )}

          {/* Projects Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {filteredProjects.map(project => (
              <div key={project.id} style={{
                backgroundColor: theme.colors.card,
                borderRadius: '8px',
                padding: '20px',
                boxShadow: theme.shadows.card,
                border: isDeadlinePassed(project.deadline) ? `2px solid ${theme.colors.danger}` :
                  isDeadlineSoon(project.deadline) ? `2px solid ${theme.colors.warning}` : `1px solid ${theme.colors.border}`,
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{
                  margin: '0 0 10px 0',
                  color: theme.colors.text,
                  fontSize: '18px'
                }}>
                  {project.title}
                </h3>

                <p style={{
                  margin: '0 0 15px 0',
                  color: theme.colors.textSecondary,
                  lineHeight: '1.5'
                }}>
                  {project.description}
                </p>

                {project.skills && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '5px'
                    }}>
                      {project.skills.split(',').map((skill, index) => (
                        <span key={index} style={{
                          backgroundColor: theme.colors.primary + '20',
                          color: theme.colors.primary,
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          border: `1px solid ${theme.colors.primary}40`
                        }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  fontSize: '14px',
                  color: theme.colors.textSecondary
                }}>
                  <span>📅 Posted: {formatDate(project.CreatedAt)}</span>
                  <span style={{
                    color: isDeadlinePassed(project.deadline) ? theme.colors.danger :
                      isDeadlineSoon(project.deadline) ? theme.colors.warning : theme.colors.textSecondary
                  }}>
                    ⏰ Due: {formatDate(project.deadline)}
                  </span>
                </div>

                {isDeadlinePassed(project.deadline) && (
                  <div style={{
                    backgroundColor: theme.colors.danger + '20',
                    color: theme.colors.danger,
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '15px',
                    textAlign: 'center',
                    border: `1px solid ${theme.colors.danger}40`
                  }}>
                    ⚠️ Deadline has passed
                  </div>
                )}

                {isDeadlineSoon(project.deadline) && !isDeadlinePassed(project.deadline) && (
                  <div style={{
                    backgroundColor: theme.colors.warning + '20',
                    color: theme.colors.warning,
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '15px',
                    textAlign: 'center',
                    border: `1px solid ${theme.colors.warning}40`
                  }}>
                    ⏰ Deadline approaching soon!
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  {user && user.role === 'student' && !isDeadlinePassed(project.deadline) && (
                    <button
                      onClick={() => handleApplyToProject(project.id)}
                      style={{
                        backgroundColor: theme.colors.success,
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      Apply Now
                    </button>
                  )}
                  <button
                    onClick={() => navigate(`/projects/${project.id}`)}
                    style={{
                      backgroundColor: theme.colors.blue,
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '0.9';
                      e.target.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* No Projects Message */}
          {filteredProjects.length === 0 && !loading && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              backgroundColor: theme.colors.card,
              borderRadius: '8px',
              boxShadow: theme.shadows.card,
              border: `1px solid ${theme.colors.border}`
            }}>
              <h3 style={{ color: theme.colors.text }}>No projects found</h3>
              <p style={{ color: theme.colors.textSecondary }}>
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Add CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Projects;
