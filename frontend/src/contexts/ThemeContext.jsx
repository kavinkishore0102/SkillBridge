import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check if user has a saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      primary: isDarkMode ? '#1976d2' : '#2196f3',
      secondary: isDarkMode ? '#f48fb1' : '#e91e63',
      background: isDarkMode ? '#1a1a1a' : '#ffffff',
      surface: isDarkMode ? '#2a2a2a' : '#f5f5f5',
      card: isDarkMode ? '#3a3a3a' : '#ffffff',
      text: isDarkMode ? '#ffffff' : '#333333',
      textSecondary: isDarkMode ? '#cccccc' : '#666666',
      border: isDarkMode ? '#555555' : '#e0e0e0',
      success: isDarkMode ? '#4caf50' : '#388e3c',
      warning: isDarkMode ? '#ff9800' : '#f57c00',
      danger: isDarkMode ? '#f44336' : '#d32f2f',
      error: isDarkMode ? '#f44336' : '#d32f2f',
      info: isDarkMode ? '#2196f3' : '#1976d2'
    },
    shadows: {
      card: isDarkMode 
        ? '0 4px 8px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)' 
        : '0 4px 8px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.05)',
      cardHover: isDarkMode
        ? '0 8px 16px rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.3)'
        : '0 8px 16px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.1)',
      navbar: isDarkMode
        ? '0 2px 8px rgba(0,0,0,0.3)'
        : '0 2px 8px rgba(0,0,0,0.1)'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
