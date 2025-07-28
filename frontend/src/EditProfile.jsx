import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, authAPI } from './utils/api';

function EditProfile() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const { addNotification } = useNotifications();

  useEffect(() => {
    const userData = utils.getUser();
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);
    setFormData({
      name: userData.name || '',
      email: userData.email || '',
      phone: userData.phone || '',
      university: userData.university || '',
      major: userData.major || '',
      year: userData.year || '',
      company_name: userData.company_name || '',
      position: userData.position || '',
      linkedin: userData.linkedin || '',
      github_url: userData.github_url || '',
      portfolio_url: userData.portfolio_url || '',
      bio: userData.bio || ''
    });
    setLoading(false);
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = utils.getToken();
      const response = await authAPI.updateProfile(formData, token);
      
      // Update local storage with the response data
      if (response.user) {
        utils.saveUser(response.user);
      } else {
        // Fallback to merging current user with form data
        const updatedUser = { ...user, ...formData };
        utils.saveUser(updatedUser);
      }
      
      addNotification('Profile updated successfully!', 'success');
      navigate('/profile');
    } catch (error) {
      console.error('Error updating profile:', error);
      addNotification(`Failed to update profile: ${error.message}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        backgroundColor: theme.colors.background,
        minHeight: '100vh'
      }}>
        <p style={{ color: theme.colors.text }}>Loading profile...</p>
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
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: theme.colors.surface,
        borderRadius: '12px',
        padding: '30px',
        boxShadow: theme.shadows.card
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
            ✏️ Edit Profile
          </h1>
          <button
            onClick={() => navigate('/profile')}
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
            ← Back to Profile
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {/* Basic Information */}
          <div style={{
            padding: '20px',
            backgroundColor: theme.colors.background,
            borderRadius: '12px'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
              📝 Basic Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }}
                />
              </div>
              <div>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.background,
                    color: theme.colors.textSecondary,
                    opacity: 0.7
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text
                }}
              />
            </div>
          </div>

          {/* Role-specific fields */}
          {user.role === 'student' && (
            <div style={{
              padding: '20px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px'
            }}>
              <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
                🎓 Academic Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Major
                  </label>
                  <input
                    type="text"
                    name="major"
                    value={formData.major}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                  />
                </div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  Year of Study
                </label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }}
                >
                  <option value="">Select Year</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Graduate">Graduate</option>
                </select>
              </div>
            </div>
          )}

          {user.role === 'company' && (
            <div style={{
              padding: '20px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px'
            }}>
              <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
                🏢 Company Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Company Name
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                  />
                </div>
                <div>
                  <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: `2px solid ${theme.colors.border}`,
                      borderRadius: '8px',
                      fontSize: '16px',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Links */}
          <div style={{
            padding: '20px',
            backgroundColor: theme.colors.background,
            borderRadius: '12px'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
              🔗 Social Links
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }}
                />
              </div>
              <div>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  GitHub Profile
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  placeholder="https://github.com/yourusername"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }}
                />
              </div>
              <div>
                <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                  Portfolio Website
                </label>
                <input
                  type="url"
                  name="portfolio_url"
                  value={formData.portfolio_url}
                  onChange={handleChange}
                  placeholder="https://yourportfolio.com"
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div style={{
            padding: '20px',
            backgroundColor: theme.colors.background,
            borderRadius: '12px'
          }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '20px' }}>
              📄 About You
            </h3>
            <div>
              <label style={{ color: theme.colors.text, fontWeight: '600', marginBottom: '5px', display: 'block' }}>
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="4"
                placeholder="Tell us about yourself, your interests, and experience..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: `2px solid ${theme.colors.border}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center' }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: saving 
                  ? theme.colors.textSecondary 
                  : `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                color: 'white',
                border: 'none',
                padding: '15px 40px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: saving ? 0.7 : 1
              }}
            >
              {saving ? '💾 Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
