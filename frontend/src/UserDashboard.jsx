import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils, authAPI, dashboardAPI } from './utils/api';

// Dashboard configurations for different roles
const getDashboardConfig = (role, data) => {
  const configs = {
    student: {
      title: '🎓 Student Dashboard',
      backgroundColor: '#e3f2fd',
      stats: [
        { key: 'applied_projects', label: 'Applications', color: '#1976d2', value: data?.applied_projects || 0 },
        { key: 'submissions', label: 'Submissions', color: '#1976d2', value: data?.submissions || 0 },
        { key: 'accepted', label: 'Accepted', color: '#4caf50', value: data?.submission_summary?.accepted || 0 },
        { key: 'pending', label: 'Pending', color: '#ff9800', value: data?.submission_summary?.pending || 0 },
        { key: 'rejected', label: 'Rejected', color: '#f44336', value: data?.submission_summary?.rejected || 0 },
      ],
      quickActions: [
        'Browse available projects',
        'Apply for projects that match your skills',
        'Track your applications',
        'Submit your completed work',
        'View feedback from companies'
      ]
    },
    company: {
      title: '🏢 Company Dashboard',
      backgroundColor: '#e8f5e8',
      stats: [
        { key: 'posted_projects', label: 'Posted Projects', color: '#4caf50', value: data?.posted_projects || 0 },
        { key: 'total_applicants', label: 'Total Applicants', color: '#2196f3', value: data?.total_applicants || 0 },
        { key: 'total_submissions', label: 'Total Submissions', color: '#ff9800', value: data?.total_submissions || 0 },
      ],
      quickActions: [
        'Post new projects for students',
        'Review student applications',
        'Manage your posted projects',
        'Review student submissions',
        'Provide feedback to students'
      ]
    },
    guide: {
      title: '👨‍🏫 Guide Dashboard',
      backgroundColor: '#fff3e0',
      stats: [
        { key: 'assigned_projects', label: 'Assigned Projects', color: '#ff9800', value: data?.assigned_projects || 0 },
        { key: 'total_submissions', label: 'Total Submissions', color: '#2196f3', value: data?.total_submissions || 0 },
        { key: 'pending_reviews', label: 'Pending Reviews', color: '#f44336', value: data?.pending_reviews || 0 },
        { key: 'completed_reviews', label: 'Completed Reviews', color: '#4caf50', value: data?.completed_reviews || 0 },
      ],
      quickActions: [
        'Review pending submissions',
        'Provide guidance to students',
        'Monitor project progress',
        'Approve or reject submissions',
        'Give constructive feedback'
      ]
    }
  };

  return configs[role] || {
    title: '📊 Dashboard',
    backgroundColor: '#f5f5f5',
    stats: [],
    quickActions: ['Welcome to your dashboard']
  };
};

function Dashboard() {
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if user is logged in
        const token = utils.getToken();
        if (!token || !utils.isLoggedIn()) {
          console.log('No valid token found, redirecting to login');
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
          console.log('No user data available, redirecting to login');
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
  }, [navigate]);

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
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px', color: '#f44336' }}>No user data available</div>
        <div style={{ fontSize: '14px', color: '#666' }}>Redirecting to login...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px'
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
              <h2 style={{ margin: 0 }}>Welcome, {user.name}!</h2>
              <p style={{ margin: 0, color: '#666' }}>
                Role: <strong>{user.role}</strong> | Email: {user.email}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
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

        {/* Dynamic Role-based Dashboard */}
        {(() => {
          const config = getDashboardConfig(user.role, dashboardData);
          return (
            <div style={{ 
              backgroundColor: config.backgroundColor,
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3>{config.title}</h3>
              {dashboardData ? (
                <div>
                  {/* Stats Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '20px', 
                    marginBottom: '20px' 
                  }}>
                    {config.stats.map((stat, index) => (
                      <div key={index} style={{ 
                        backgroundColor: '#fff', 
                        padding: '15px', 
                        borderRadius: '8px', 
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: stat.color }}>
                          {stat.label}
                        </h4>
                        <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
                          {stat.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Actions */}
                  <div style={{ 
                    backgroundColor: '#fff', 
                    padding: '15px', 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
                  }}>
                    <h4>Quick Actions</h4>
                    <ul style={{ lineHeight: '1.8' }}>
                      {config.quickActions.map((action, index) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <p>Loading dashboard data...</p>
              )}
            </div>
          );
        })()}

        {/* Quick Stats */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginTop: '30px'
        }}>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4>📊 Quick Stats</h4>
            <p>Coming soon...</p>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4>🔔 Notifications</h4>
            <p>No new notifications</p>
          </div>
          <div style={{ 
            backgroundColor: '#f8f9fa',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h4>⚡ Quick Actions</h4>
            <p>Feature under development</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
