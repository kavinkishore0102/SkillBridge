import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './contexts/ThemeContext';
import { useNotifications } from './contexts/NotificationContext';
import { utils, authAPI, dashboardAPI } from './utils/api';

// Dashboard configurations for different roles
const getDashboardConfig = (role, data, user, theme) => {
  const configs = {
    student: {
      title: 'Student Dashboard',
      backgroundColor: theme.colors.surface,
      stats: [
        { key: 'applied_projects', label: 'Applications', color: theme.colors.primary, value: data?.applied_projects || 0 },
        { key: 'submissions', label: 'Submissions', color: theme.colors.primary, value: data?.submissions || 0 },
        { key: 'accepted', label: 'Accepted', color: theme.colors.success, value: data?.submission_summary?.accepted || 0 },
        { key: 'pending', label: 'Pending', color: theme.colors.warning, value: data?.submission_summary?.pending || 0 },
        { key: 'rejected', label: 'Rejected', color: theme.colors.danger, value: data?.submission_summary?.rejected || 0 },
      ],
      profileLinks: [
        { label: 'LinkedIn', url: user?.linkedin, icon: '' },
        { label: 'GitHub', url: user?.github_url, icon: '' },
        { label: 'Portfolio', url: user?.portfolio_url, icon: '' },
      ]
    },
    company: {
      title: 'Company Dashboard',
      backgroundColor: theme.colors.surface,
      stats: [
        { key: 'posted_projects', label: 'Posted Projects', color: theme.colors.success, value: data?.posted_projects || 0 },
        { key: 'total_applicants', label: 'Total Applicants', color: theme.colors.primary, value: data?.total_applicants || 0 },
        { key: 'total_submissions', label: 'Total Submissions', color: theme.colors.warning, value: data?.total_submissions || 0 },
      ],
      profileLinks: [
        { label: 'Company Website', url: user?.company_url, icon: '' },
        { label: 'LinkedIn', url: user?.linkedin, icon: '' },
        { label: 'Careers Page', url: user?.careers_url, icon: '' },
      ]
    },
    guide: {
      title: 'Guide Dashboard',
      backgroundColor: theme.colors.surface,
      stats: [
        { key: 'assigned_projects', label: 'Assigned Students', color: theme.colors.warning, value: data?.assigned_projects || 0 },
        { key: 'total_submissions', label: 'Total Submissions', color: theme.colors.primary, value: data?.total_submissions || 0 },
        { key: 'completed_reviews', label: 'Completed Reviews', color: theme.colors.success, value: data?.completed_reviews || 0 },
      ],
      profileLinks: [
        { label: 'LinkedIn', url: user?.linkedin, icon: '' },
        { label: 'GitHub', url: user?.github_url, icon: '🐱' },
        { label: 'Academic Profile', url: user?.academic_url, icon: '🎓' },
      ]
    }
  };

  return configs[role] || {
    title: '📊 Dashboard',
    backgroundColor: '#f5f5f5',
    stats: [],
    profileLinks: []
  };
};

function Dashboard() {
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateFormData, setUpdateFormData] = useState({
    name: '',
    email: '',
    bio: '',
    github_url: '',
    linkedin: '',
    portfolio_url: '',
    company_url: '',
    careers_url: '',
    academic_url: ''
  });
  const [updating, setUpdating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if user is logged in
        const token = utils.getToken();
        if (!token || !utils.isLoggedIn()) {
          navigate('/');
          return;
        }

        let userData = utils.getUser();

        // Get user data if not in localStorage
        if (!userData && token && token !== 'google-oauth-token') {
          try {
            const userProfile = await authAPI.getProfile(token);
            userData = userProfile;
            setUser(userProfile);
            utils.saveUser(userProfile);
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Token might be invalid, clear it and redirect
            utils.logout();
            navigate('/');
            return;
          }
        } else if (userData) {
          setUser(userData);
        }

        // If we still don't have user data, redirect to login
        if (!userData) {
          utils.logout();
          navigate('/');
          return;
        }

        // Fetch dashboard data based on user role
        if (userData.role && token) {
          try {
            let dashboardResponse;
            switch (userData.role) {
              case 'student':
                dashboardResponse = await dashboardAPI.getStudentDashboard(token);
                break;
              case 'company':
                dashboardResponse = await dashboardAPI.getCompanyDashboard(token);
                break;
              case 'guide':
                dashboardResponse = await dashboardAPI.getGuideDashboard(token);
                break;
              default:
                console.log('Unknown role:', userData.role);
            }

            if (dashboardResponse) {
              setDashboardData(dashboardResponse);
            }
          } catch (error) {
            console.error('Error fetching dashboard data:', error);
            // Don't redirect, just show the dashboard without stats
          }
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        utils.logout();
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();

    // Listen for application updates from other components
    const handleApplicationsUpdate = () => {
      console.log('Applications updated, refreshing dashboard...');
      initializeDashboard();
    };

    window.addEventListener('applicationsUpdated', handleApplicationsUpdate);

    return () => {
      window.removeEventListener('applicationsUpdated', handleApplicationsUpdate);
    };
  }, [navigate]);

  const handleLogout = () => {
    utils.logout();
    navigate('/');
  };

  const handleUpdateProfile = () => {
    setUpdateFormData({
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      github_url: user.github_url || '',
      linkedin: user.linkedin || '',
      portfolio_url: user.portfolio_url || '',
      company_url: user.company_url || '',
      careers_url: user.careers_url || '',
      academic_url: user.academic_url || ''
    });
    setShowUpdateModal(true);
  };

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const token = utils.getToken();
      await authAPI.updateProfile(updateFormData, token);

      // Update user state with new data
      const updatedUser = { ...user, ...updateFormData };
      setUser(updatedUser);
      utils.saveUser(updatedUser);

      setShowUpdateModal(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCloseModal = () => {
    setShowUpdateModal(false);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Loading Dashboard...</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Please wait while we load your data</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        backgroundColor: theme.colors.background,
        color: theme.colors.text
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px', color: theme.colors.danger }}>No user data available</div>
        <div style={{ fontSize: '14px', color: theme.colors.textSecondary }}>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      minHeight: '100vh',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: theme.colors.card,
          borderRadius: '8px',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.card
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {user.picture && (
              <img
                src={user.picture}
                alt="Profile"
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h2 style={{ margin: 0, color: theme.colors.text }}>Welcome, {user.name}!</h2>
              <p style={{ margin: 0, color: theme.colors.textSecondary }}>
                Role: <strong>{user.role}</strong> | Email: {user.email}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => navigate('/projects')}
              style={{
                padding: '10px 20px',
                backgroundColor: theme.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              View Projects
            </button>
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                backgroundColor: theme.colors.danger,
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Dynamic Role-based Dashboard */}
        {user.role === 'student' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px' }}>Student Dashboard</h3>
            {dashboardData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Projects section */}
                <div style={{ backgroundColor: theme.colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows?.card }}>
                  <h4 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px' }}>Projects</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.primary }}>{dashboardData.projects?.applications ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Applications</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.success }}>{dashboardData.projects?.accepted ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Accepted</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.danger }}>{dashboardData.projects?.rejected ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Rejected</div>
                    </div>
                  </div>
                </div>
                {/* Jobs section */}
                <div style={{ backgroundColor: theme.colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows?.card }}>
                  <h4 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px' }}>Jobs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.primary }}>{dashboardData.jobs?.applications ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Applications</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.success }}>{dashboardData.jobs?.accepted ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Accepted</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.danger }}>{dashboardData.jobs?.rejected ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Rejected</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: theme.colors.textSecondary }}>Loading dashboard data...</p>
            )}
            {/* Profile Links - Student */}
            {dashboardData && (
              <div style={{ marginTop: '20px', backgroundColor: theme.colors.card, padding: '15px', borderRadius: '8px', border: `1px solid ${theme.colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: theme.colors.text }}>Profile Links</h4>
                  <button onClick={handleUpdateProfile} style={{ backgroundColor: theme.colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Update Profile</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[{ label: 'LinkedIn', url: user?.linkedin }, { label: 'GitHub', url: user?.github_url }, { label: 'Portfolio', url: user?.portfolio_url }].map((link, i) => (
                    <div key={i}>{link.url ? <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'none', fontSize: '14px' }}>{link.label}</a> : <span style={{ color: theme.colors.textSecondary, fontSize: '14px', fontStyle: 'italic' }}>{link.label} not set</span>}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {user.role === 'company' && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ color: theme.colors.text, marginBottom: '16px' }}>Company Dashboard</h3>
            {dashboardData ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Projects section */}
                <div style={{ backgroundColor: theme.colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows?.card }}>
                  <h4 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px' }}>Projects</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.success }}>{dashboardData.projects?.posted ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Posted</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.primary }}>{dashboardData.projects?.applications ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Applications</div>
                    </div>
                  </div>
                </div>
                {/* Jobs section */}
                <div style={{ backgroundColor: theme.colors.card, padding: '20px', borderRadius: '8px', border: `1px solid ${theme.colors.border}`, boxShadow: theme.shadows?.card }}>
                  <h4 style={{ margin: '0 0 16px 0', color: theme.colors.text, fontSize: '16px' }}>Jobs</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.success }}>{dashboardData.jobs?.posted ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Posted</div>
                    </div>
                    <div style={{ padding: '12px', backgroundColor: theme.colors.background, borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: 'bold', color: theme.colors.primary }}>{dashboardData.jobs?.applications ?? 0}</div>
                      <div style={{ fontSize: '12px', color: theme.colors.textSecondary }}>Applications</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: theme.colors.textSecondary }}>Loading dashboard data...</p>
            )}
            {/* Profile Links - Company */}
            {dashboardData && (
              <div style={{ marginTop: '20px', backgroundColor: theme.colors.card, padding: '15px', borderRadius: '8px', border: `1px solid ${theme.colors.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0, color: theme.colors.text }}>Profile Links</h4>
                  <button onClick={handleUpdateProfile} style={{ backgroundColor: theme.colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Update Profile</button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[{ label: 'Company Website', url: user?.company_url }, { label: 'LinkedIn', url: user?.linkedin }, { label: 'Careers Page', url: user?.careers_url }].map((link, i) => (
                    <div key={i}>{link.url ? <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'none', fontSize: '14px' }}>{link.label}</a> : <span style={{ color: theme.colors.textSecondary, fontSize: '14px', fontStyle: 'italic' }}>{link.label} not set</span>}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {user.role === 'guide' && (() => {
          const config = getDashboardConfig('guide', dashboardData, user, theme);
          return (
            <div style={{ backgroundColor: config.backgroundColor, padding: '20px', borderRadius: '8px', marginBottom: '20px', border: `1px solid ${theme.colors.border}` }}>
              <h3 style={{ color: theme.colors.text }}>{config.title}</h3>
              {dashboardData ? (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    {config.stats.map((stat, index) => (
                      <div key={index} style={{ backgroundColor: theme.colors.card, padding: '15px', borderRadius: '8px', boxShadow: theme.shadows.card, border: `1px solid ${theme.colors.border}` }}>
                        <h4 style={{ margin: '0 0 10px 0', color: stat.color }}>{stat.label}</h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: theme.colors.text }}>{stat.value}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor: theme.colors.card, padding: '15px', borderRadius: '8px', boxShadow: theme.shadows.card, border: `1px solid ${theme.colors.border}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: theme.colors.text }}>Profile Links</h4>
                      <button onClick={handleUpdateProfile} style={{ backgroundColor: theme.colors.primary, color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Update Profile</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {config.profileLinks.map((link, index) => (
                        <div key={index}>{link.url ? <a href={link.url.startsWith('http') ? link.url : `https://${link.url}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.colors.primary, textDecoration: 'none', fontSize: '14px' }}>{link.label}</a> : <span style={{ color: theme.colors.textSecondary, fontSize: '14px', fontStyle: 'italic' }}>{link.label} not set</span>}</div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color: theme.colors.textSecondary }}>Loading dashboard data...</p>
              )}
            </div>
          );
        })()}

        {/* Quick Actions */}
        <div style={{
          backgroundColor: theme.colors.card,
          borderRadius: '8px',
          padding: '25px',
          marginTop: '30px',
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.shadows.card
        }}>
          <h3 style={{
            color: theme.colors.text,
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            🚀 Quick Actions
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px'
          }}>
            {user.role === 'student' && (
              <>
                <button
                  onClick={() => navigate('/projects')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🔍 Browse Projects
                </button>

                <button
                  onClick={() => navigate('/jobs')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.tertiary || '#6b5b95',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  💼 Apply for Jobs
                </button>

                <button
                  onClick={() => navigate('/applied-projects')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📋 My Applications
                </button>

                <button
                  onClick={() => navigate('/submissions')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.warning,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📤 My Submissions
                </button>

                <button
                  onClick={() => navigate('/guides')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  🎓 Connect with Guides
                </button>
                <button
                  onClick={() => navigate('/conversations')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.info,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  💬 My Conversations
                </button>
              </>
            )}

            {user.role === 'company' && (
              <>
                <button
                  onClick={() => navigate('/post-project')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ➕ Post New Project
                </button>

                <button
                  onClick={() => navigate('/post-job')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.tertiary || '#6b5b95',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ➕ Post New Job
                </button>

                <button
                  onClick={() => navigate('/company/projects')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.secondary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📁 My Projects
                </button>

                <button
                  onClick={() => navigate('/company/applications')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.warning,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  👥 View Applications
                </button>

                <button
                  onClick={() => navigate('/company/submissions')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.success,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  📊 Review Submissions
                </button>
              </>
            )}

            {user.role === 'guide' && (
              <>
                <button
                  onClick={() => navigate('/guide/pending-confirmations')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.danger,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  ✓ Pending Confirmations
                </button>



                <button
                  onClick={() => navigate('/conversations')}
                  style={{
                    padding: '15px 20px',
                    backgroundColor: theme.colors.info,
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                  onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                >
                  💬 Student Conversations
                </button>
              </>
            )}

            {/* Common actions for all roles */}
            <button
              onClick={() => navigate('/profile')}
              style={{
                padding: '15px 20px',
                backgroundColor: theme.colors.textSecondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
            >
              👤 View Profile
            </button>
          </div>
        </div>

      </div>

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '30px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Update Profile</h3>

            <form onSubmit={handleUpdateSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={updateFormData.name}
                  onChange={handleUpdateFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={updateFormData.email}
                  onChange={handleUpdateFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  Bio
                </label>
                <textarea
                  name="bio"
                  value={updateFormData.bio}
                  onChange={handleUpdateFormChange}
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    resize: 'vertical'
                  }}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={updateFormData.linkedin}
                  onChange={handleUpdateFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="https://linkedin.com/in/yourprofile"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={updateFormData.github_url}
                  onChange={handleUpdateFormChange}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                  placeholder="https://github.com/yourusername"
                />
              </div>

              {user?.role === 'student' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Portfolio URL
                  </label>
                  <input
                    type="url"
                    name="portfolio_url"
                    value={updateFormData.portfolio_url}
                    onChange={handleUpdateFormChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                    placeholder="https://yourportfolio.com"
                  />
                </div>
              )}

              {user?.role === 'company' && (
                <>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Company Website
                    </label>
                    <input
                      type="url"
                      name="company_url"
                      value={updateFormData.company_url}
                      onChange={handleUpdateFormChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                      placeholder="https://yourcompany.com"
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                      Careers Page URL
                    </label>
                    <input
                      type="url"
                      name="careers_url"
                      value={updateFormData.careers_url}
                      onChange={handleUpdateFormChange}
                      style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                      placeholder="https://yourcompany.com/careers"
                    />
                  </div>
                </>
              )}

              {user?.role === 'guide' && (
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                    Academic Profile URL
                  </label>
                  <input
                    type="url"
                    name="academic_url"
                    value={updateFormData.academic_url}
                    onChange={handleUpdateFormChange}
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd'
                    }}
                    placeholder="https://scholar.google.com/citations?user=..."
                  />
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.7 : 1
                  }}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
