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
      primary: isDarkMode ? '#00b894' : '#009966',
      secondary: isDarkMode ? '#00cec9' : '#00774c',
      background: isDarkMode ? '#0F172A' : '#F8FAFC',
      surface: isDarkMode ? '#1E293B' : '#FFFFFF',
      card: isDarkMode ? '#334155' : '#FFFFFF',
      text: isDarkMode ? '#F1F5F9' : '#0F172A',
      textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
      border: isDarkMode ? '#475569' : '#E2E8F0',
      success: isDarkMode ? '#00b894' : '#009966',
      warning: isDarkMode ? '#F59E0B' : '#D97706',
      danger: isDarkMode ? '#EF4444' : '#DC2626',
      error: isDarkMode ? '#EF4444' : '#DC2626',
      info: isDarkMode ? '#00cec9' : '#00b894',
      blue: isDarkMode ? '#3B82F6' : '#2563EB'
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
