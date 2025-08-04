import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationContext';
import { utils } from '../utils/api';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const user = utils.getUser();

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = () => {
    utils.logout();
    navigate('/');
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const navItems = [
    { name: 'Projects', path: '/projects', icon: '' },
    { name: 'Dashboard', path: '/dashboard', icon: '' },
    ...(user?.role === 'student' ? [{ name: 'Applications', path: '/applied-projects', icon: '' }] : []),
    ...(user?.role === 'student' ? [{ name: 'Submissions', path: '/submissions', icon: '' }] : []),
    ...(user?.role === 'company' ? [{ name: 'My Projects', path: '/company/projects', icon: '' }] : []),
    ...(user?.role === 'company' ? [{ name: 'Applications', path: '/company/applications', icon: '' }] : []),
    ...(user?.role === 'company' ? [{ name: 'Post Project', path: '/post-project', icon: '' }] : []),
    { name: 'Profile', path: '/profile', icon: '' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={{
      background: theme.colors.surface,
      borderBottom: `1px solid ${theme.colors.border}`,
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
      backgroundColor: theme.colors.surface + 'F0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '60px'
        }}>
          
          {/* Logo */}
          <div 
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              padding: '4px 8px',
              borderRadius: '8px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.backgroundColor = theme.colors.primary + '10';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              transition: 'transform 0.3s ease'
            }}>
              <img 
                src="/skillbridge-logo.svg" 
                alt="SkillBridge Logo" 
                style={{ 
                  width: '36px', 
                  height: '36px',
                  transition: 'all 0.3s ease'
                }} 
              />
            </div>
            <span style={{ 
              color: theme.colors.primary,
              transition: 'color 0.3s ease'
            }}>SkillBridge</span>
          </div>

          {/* Desktop Navigation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '30px'
          }}>
            {user && (
              <div style={{
                display: 'flex',
                gap: '20px'
              }}>
                {navItems.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: isActive(item.path) ? theme.colors.primary : 'transparent',
                      border: 'none',
                      color: isActive(item.path) ? 'white' : theme.colors.text,
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.background = theme.colors.border;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive(item.path)) {
                        e.target.style.background = 'transparent';
                      }
                    }}
                  >
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Theme Toggle */}
            <button
              onClick={theme.toggleTheme}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                color: theme.colors.text,
                padding: '6px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = theme.colors.border;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
              }}
              title={theme.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme.isDarkMode ? '☀' : '🌙'}
            </button>

            {/* Notifications */}
            <div ref={notificationRef} style={{ position: 'relative' }}>
              <button
                onClick={toggleNotifications}
                style={{
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  color: theme.colors.text,
                  padding: '6px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = theme.colors.border;
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                }}
                title="Notifications"
              >
                🔔
                {/* Notification badge */}
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    background: '#ff4757',
                    color: 'white',
                    borderRadius: '50%',
                    width: '12px',
                    height: '12px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div style={{
                  position: 'absolute',
                  top: '50px',
                  right: '0',
                  width: '320px',
                  maxHeight: '400px',
                  background: theme.isDarkMode ? '#2c3e50' : 'white',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  border: `1px solid ${theme.isDarkMode ? '#34495e' : '#e1e8ed'}`,
                  zIndex: 1001,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '15px',
                    borderBottom: `1px solid ${theme.isDarkMode ? '#34495e' : '#e1e8ed'}`,
                    background: theme.isDarkMode ? '#34495e' : '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <h4 style={{
                      margin: 0,
                      color: theme.isDarkMode ? 'white' : '#2c3e50',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      Notifications ({unreadCount})
                    </h4>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: theme.colors.primary,
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 185, 102, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'none';
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          style={{
                            padding: '15px',
                            borderBottom: `1px solid ${theme.isDarkMode ? '#34495e' : '#e1e8ed'}`,
                            cursor: 'pointer',
                            background: theme.isDarkMode ? '#34495e' : '#f8f9fa',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = theme.isDarkMode ? '#3d566e' : '#e8f0fe';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = theme.isDarkMode ? '#34495e' : '#f8f9fa';
                          }}
                        >
                          <div style={{
                            fontSize: '14px',
                            color: theme.isDarkMode ? 'white' : '#2c3e50',
                            marginBottom: '5px',
                            fontWeight: '600'
                          }}>
                            {notification.message}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: theme.isDarkMode ? '#bdc3c7' : '#657786'
                          }}>
                            {notification.time}
                            <span style={{
                              marginLeft: '10px',
                              color: '#ff4757',
                              fontSize: '10px'
                            }}>
                              • NEW
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: theme.isDarkMode ? '#bdc3c7' : '#657786',
                        fontSize: '14px'
                      }}>
                        No notifications
                      </div>
                    )}
                  </div>
                  <div style={{
                    padding: '10px',
                    textAlign: 'center',
                    borderTop: `1px solid ${theme.isDarkMode ? '#34495e' : '#e1e8ed'}`,
                    background: theme.isDarkMode ? '#34495e' : '#f8f9fa'
                  }}>
                    <button
                      onClick={() => setShowNotifications(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: theme.colors.primary,
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '600'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            {user && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: theme.colors.text
                }}>
                  {user.picture && (
                    <img 
                      src={user.picture} 
                      alt="Profile" 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: `2px solid ${theme.colors.border}`
                      }}
                    />
                  )}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      color: theme.colors.text
                    }}>
                      {user.name}
                    </span>
                    <span style={{ 
                      fontSize: '12px', 
                      color: theme.colors.textSecondary,
                      textTransform: 'capitalize'
                    }}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.colors.danger}`,
                    color: theme.colors.danger,
                    padding: '6px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = theme.colors.danger;
                    e.target.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                    e.target.style.color = theme.colors.danger;
                  }}
                >
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'none',
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div style={{
            display: 'none',
            flexDirection: 'column',
            padding: '20px 0',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.path);
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: 'white',
                  padding: '12px 0',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
