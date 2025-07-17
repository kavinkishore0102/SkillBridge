import { createContext, useContext, useState, useEffect } from 'react';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  // Initialize notifications from localStorage or use default
  const getInitialNotifications = () => {
    const saved = localStorage.getItem('skillbridge_notifications');
    if (saved) {
      return JSON.parse(saved);
    }
    // Default notifications only if none exist in localStorage
    return [
      { id: 1, message: "New project application received", time: "2 hours ago", unread: true },
      { id: 2, message: "Your submission has been reviewed", time: "1 day ago", unread: true },
      { id: 3, message: "New project available in your field", time: "3 days ago", unread: true }
    ];
  };

  const [notifications, setNotifications] = useState(getInitialNotifications);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('skillbridge_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Add new notification
  const addNotification = (message, time = "Just now") => {
    const newNotification = {
      id: Date.now(), // Simple ID generation
      message,
      time,
      unread: true
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  // Mark notification as read and remove it
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  // Mark all notifications as read and remove them
  const markAllAsRead = () => {
    setNotifications([]);
  };

  // Get unread count
  const unreadCount = notifications.length;

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    unreadCount
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
