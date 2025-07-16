import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { utils, authAPI } from './utils/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // Check if user is logged in
        if (!utils.isLoggedIn()) {
          navigate('/');
          return;
        }

        // Get user data from localStorage
        const userData = utils.getUser();
        if (userData) {
          setUser(userData);
        } else {
          // If no user data, try to get it from the API
          const token = utils.getToken();
          if (token && token !== 'google-oauth-token') {
            try {
              const userProfile = await authAPI.getProfile(token);
              setUser(userProfile);
              utils.saveUser(userProfile);
            } catch (error) {
              console.error('Error fetching user profile:', error);
              // Token might be invalid, redirect to login
              utils.logout();
              navigate('/');
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error initializing dashboard:', error);
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
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <div>No user data available</div>;
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

        {/* Role-based content */}
        {user.role === 'student' && (
          <div style={{ 
            backgroundColor: '#e3f2fd',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>🎓 Student Dashboard</h3>
            <p>Welcome to your student dashboard! Here you can:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Browse available projects</li>
              <li>Apply for projects that match your skills</li>
              <li>Track your applications</li>
              <li>Submit your completed work</li>
              <li>View feedback from companies</li>
            </ul>
          </div>
        )}

        {user.role === 'company' && (
          <div style={{ 
            backgroundColor: '#e8f5e8',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>🏢 Company Dashboard</h3>
            <p>Welcome to your company dashboard! Here you can:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Post new projects for students</li>
              <li>Review student applications</li>
              <li>Manage your posted projects</li>
              <li>Review student submissions</li>
              <li>Provide feedback to students</li>
            </ul>
          </div>
        )}

        {user.role === 'guide' && (
          <div style={{ 
            backgroundColor: '#fff3e0',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>👨‍🏫 Guide Dashboard</h3>
            <p>Welcome to your guide dashboard! Here you can:</p>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Review student submissions</li>
              <li>Provide detailed feedback</li>
              <li>Mentor students through projects</li>
              <li>Track student progress</li>
              <li>Collaborate with companies</li>
            </ul>
          </div>
        )}

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
