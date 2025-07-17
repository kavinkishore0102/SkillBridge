import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { utils, authAPI } from './utils/api';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const userData = utils.getUser();
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);
    setLoading(false);
  }, [navigate]);

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
            👤 Profile
          </h1>
          <button
            onClick={() => navigate('/profile/edit')}
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
            ✏️ Edit Profile
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 2fr',
          gap: '30px',
          alignItems: 'start'
        }}>
          {/* Profile Picture & Basic Info */}
          <div style={{
            textAlign: 'center',
            padding: '20px',
            backgroundColor: theme.colors.background,
            borderRadius: '12px'
          }}>
            {user.picture ? (
              <img
                src={user.picture}
                alt="Profile"
                style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: `4px solid ${theme.colors.primary}`,
                  marginBottom: '20px'
                }}
              />
            ) : (
              <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                backgroundColor: theme.colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '60px',
                color: 'white',
                margin: '0 auto 20px auto'
              }}>
                {user.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <h2 style={{ color: theme.colors.text, margin: '0 0 10px 0' }}>
              {user.name}
            </h2>
            <p style={{
              color: theme.colors.primary,
              fontSize: '18px',
              fontWeight: '600',
              textTransform: 'capitalize',
              margin: 0
            }}>
              {user.role}
            </p>
          </div>

          {/* Detailed Information */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px'
            }}>
              <h3 style={{ color: theme.colors.text, marginBottom: '15px' }}>
                📧 Contact Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                  <strong>Email:</strong> {user.email}
                </p>
                {user.phone && (
                  <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                    <strong>Phone:</strong> {user.phone}
                  </p>
                )}
              </div>
            </div>

            {user.role === 'student' && (
              <div style={{
                padding: '20px',
                backgroundColor: theme.colors.background,
                borderRadius: '12px'
              }}>
                <h3 style={{ color: theme.colors.text, marginBottom: '15px' }}>
                  🎓 Academic Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {user.university && (
                    <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                      <strong>University:</strong> {user.university}
                    </p>
                  )}
                  {user.major && (
                    <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                      <strong>Major:</strong> {user.major}
                    </p>
                  )}
                  {user.year && (
                    <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                      <strong>Year:</strong> {user.year}
                    </p>
                  )}
                </div>
              </div>
            )}

            {user.role === 'company' && (
              <div style={{
                padding: '20px',
                backgroundColor: theme.colors.background,
                borderRadius: '12px'
              }}>
                <h3 style={{ color: theme.colors.text, marginBottom: '15px' }}>
                  🏢 Company Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {user.company_name && (
                    <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                      <strong>Company:</strong> {user.company_name}
                    </p>
                  )}
                  {user.position && (
                    <p style={{ color: theme.colors.textSecondary, margin: 0 }}>
                      <strong>Position:</strong> {user.position}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div style={{
              padding: '20px',
              backgroundColor: theme.colors.background,
              borderRadius: '12px'
            }}>
              <h3 style={{ color: theme.colors.text, marginBottom: '15px' }}>
                🔗 Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {user.linkedin && (
                  <a
                    href={user.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.colors.primary,
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    💼 LinkedIn Profile
                  </a>
                )}
                {user.github_url && (
                  <a
                    href={user.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.colors.primary,
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    🐱 GitHub Profile
                  </a>
                )}
                {user.portfolio_url && (
                  <a
                    href={user.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: theme.colors.primary,
                      textDecoration: 'none',
                      fontWeight: '500'
                    }}
                  >
                    🌐 Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
