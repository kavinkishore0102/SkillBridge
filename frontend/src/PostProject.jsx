import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, projectAPI } from './utils/api';

function PostProject() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    skills: '',
    budget: '',
    deadline: '',
    difficulty: 'intermediate',
    duration: '',
    team_size: '',
    location: 'remote'
  });
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const user = utils.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    if (user.role !== 'company') {
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);

    try {
      // Validation - check required fields
      const requiredFields = ['title', 'description', 'skills', 'budget', 'deadline'];
      const missingFields = requiredFields.filter(field => !formData[field] || formData[field].trim() === '');
      
      if (missingFields.length > 0) {
        alert(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        setPosting(false);
        return;
      }

      const token = utils.getToken();
      
      // Format the data before sending
      const projectData = {
        ...formData,
        // Convert date string to ISO format with time
        deadline: formData.deadline ? new Date(formData.deadline + 'T23:59:59.999Z').toISOString() : new Date().toISOString()
      };
      
      console.log('Sending project data:', projectData);
      
      const response = await projectAPI.postProject(projectData, token);
      
      addNotification(
        `Project "${formData.title}" posted successfully! Students can now apply.`,
        'Just now'
      );
      
      navigate('/company/projects');
    } catch (error) {
      console.error('Error posting project:', error);
      console.error('Error details:', error.message);
      alert(`Failed to post project: ${error.message}. Please try again.`);
    } finally {
      setPosting(false);
    }
  };

  return (
    <div style={{
      backgroundColor: theme.colors.background,
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '900px',
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
            📝 Post New Project
          </h1>
          <button
            onClick={() => navigate('/company/projects')}
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
            ← Back to My Projects
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{
          backgroundColor: theme.colors.surface,
          borderRadius: '12px',
          padding: '40px',
          boxShadow: theme.shadows.card,
          display: 'flex',
          flexDirection: 'column',
          gap: '30px'
        }}>
          {/* Basic Information */}
          <div>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px', fontSize: '24px' }}>
              📋 Basic Information
            </h3>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                color: theme.colors.text, 
                fontWeight: '600', 
                marginBottom: '8px', 
                display: 'block',
                fontSize: '16px'
              }}>
                Project Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., E-commerce Website Development"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                color: theme.colors.text, 
                fontWeight: '600', 
                marginBottom: '8px', 
                display: 'block',
                fontSize: '16px'
              }}>
                Project Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows="6"
                placeholder="Describe your project in detail. What are you looking to build? What's the purpose and scope?"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                color: theme.colors.text, 
                fontWeight: '600', 
                marginBottom: '8px', 
                display: 'block',
                fontSize: '16px'
              }}>
                Requirements & Qualifications
              </label>
              <textarea
                name="requirements"
                value={formData.requirements}
                onChange={handleChange}
                rows="4"
                placeholder="What are the specific requirements? What qualifications should applicants have?"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  resize: 'vertical',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
            </div>
          </div>

          {/* Technical Details */}
          <div>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px', fontSize: '24px' }}>
              🛠️ Technical Details
            </h3>
            
            <div style={{ marginBottom: '25px' }}>
              <label style={{ 
                color: theme.colors.text, 
                fontWeight: '600', 
                marginBottom: '8px', 
                display: 'block',
                fontSize: '16px'
              }}>
                Required Skills *
              </label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                required
                placeholder="e.g., React, Node.js, MongoDB, JavaScript (separate with commas)"
                style={{
                  width: '100%',
                  padding: '15px 20px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                onBlur={(e) => e.target.style.borderColor = theme.colors.border}
              />
              <p style={{ 
                color: theme.colors.textSecondary, 
                fontSize: '14px', 
                marginTop: '5px',
                fontStyle: 'italic'
              }}>
                Separate multiple skills with commas
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <option value="beginner">🌱 Beginner</option>
                  <option value="intermediate">🚀 Intermediate</option>
                  <option value="advanced">🎯 Advanced</option>
                </select>
              </div>

              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Expected Duration
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  placeholder="e.g., 2-3 months, 6 weeks"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>
          </div>

          {/* Project Details */}
          <div>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px', fontSize: '24px' }}>
              💼 Project Details
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Budget *
                </label>
                <input
                  type="text"
                  name="budget"
                  value={formData.budget}
                  onChange={handleChange}
                  required
                  placeholder="e.g., $5000, $10,000 - $15,000"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>

              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Application Deadline
                </label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Team Size
                </label>
                <input
                  type="text"
                  name="team_size"
                  value={formData.team_size}
                  onChange={handleChange}
                  placeholder="e.g., 1-2 students, 3-4 developers"
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                  onFocus={(e) => e.target.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.target.style.borderColor = theme.colors.border}
                />
              </div>

              <div>
                <label style={{ 
                  color: theme.colors.text, 
                  fontWeight: '600', 
                  marginBottom: '8px', 
                  display: 'block',
                  fontSize: '16px'
                }}>
                  Work Location
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '15px 20px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text,
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <option value="remote">🌐 Remote</option>
                  <option value="hybrid">🏢 Hybrid</option>
                  <option value="onsite">🏭 On-site</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ 
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: `1px solid ${theme.colors.border}`
          }}>
            <button
              type="submit"
              disabled={posting}
              style={{
                background: posting 
                  ? theme.colors.textSecondary 
                  : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                color: 'white',
                border: 'none',
                padding: '18px 50px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: posting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: posting ? 0.7 : 1,
                transform: posting ? 'scale(0.95)' : 'scale(1)'
              }}
              onMouseEnter={(e) => {
                if (!posting) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (!posting) {
                  e.target.style.transform = 'scale(1)';
                }
              }}
            >
              {posting ? '📤 Posting Project...' : '🚀 Post Project'}
            </button>
            
            <p style={{ 
              color: theme.colors.textSecondary, 
              marginTop: '15px', 
              fontSize: '14px',
              fontStyle: 'italic'
            }}>
              Your project will be visible to all students immediately after posting
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PostProject;
