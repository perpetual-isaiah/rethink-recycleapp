// context/ThemeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  /* 1 ▸ state with loading indicator */
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  /* 2 ▸ load saved choice on mount */
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const stored = await AsyncStorage.getItem('dark_mode');
        if (stored !== null) {
          setDarkMode(stored === 'true');
        } else {
          // If no stored preference, use system preference
          const systemTheme = Appearance.getColorScheme() === 'dark';
          setDarkMode(systemTheme);
          // Save the system preference as default
          await AsyncStorage.setItem('dark_mode', systemTheme.toString());
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
        // Fallback to system theme
        setDarkMode(Appearance.getColorScheme() === 'dark');
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, []);

  /* 3 ▸ listen to system theme changes (optional) */
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Only auto-update if user hasn't manually set a preference
      AsyncStorage.getItem('dark_mode').then((stored) => {
        if (stored === null) {
          setDarkMode(colorScheme === 'dark');
        }
      });
    });

    return () => subscription?.remove();
  }, []);

  /* 4 ▸ toggle + persist with proper async handling */
  const toggleTheme = async () => {
    try {
      const newMode = !darkMode;
      setDarkMode(newMode);
      await AsyncStorage.setItem('dark_mode', newMode.toString());
      console.log('Theme toggled to:', newMode ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
      // Revert the state if saving failed
      setDarkMode(darkMode);
    }
  };

  /* 5 ▸ central colour palette with switch-specific colors */
  const colors = darkMode
    ? {
        // Base colors
        bg:         '#121212',
        card:       '#1E1E1E',
        text:       '#E5E5E5',
        tint:       '#90EE90',
        separator:  '#333333',
        
        // Switch-specific colors
        switchTrackFalse: '#3e3e3e',
        switchTrackTrue:  '#4a90e2',
        switchThumbOff:   '#f4f3f4',
        switchThumbOn:    '#f5dd4b',
        switchIosBackground: '#3e3e3e',
        
        // Additional utility colors
        textSecondary: '#B0B0B0',
        danger:       '#dc2626',
        success:      '#22c55e',
        warning:      '#f59e0b',
      }
    : {
        // Base colors
        bg:         '#FFFFFF',
        card:       '#FFFFFF',
        text:       '#111827',
        tint:       '#4CAF50',
        separator:  '#F3F4F6',
        
        // Switch-specific colors
        switchTrackFalse: '#767577',
        switchTrackTrue:  '#81b0ff',
        switchThumbOff:   '#ffffff',
        switchThumbOn:    '#f5dd4b',
        switchIosBackground: '#e9e9ea',
        
        // Additional utility colors
        textSecondary: '#6B7280',
        danger:       '#dc2626',
        success:      '#22c55e',
        warning:      '#f59e0b',
      };

  /* 6 ▸ helper function to reset theme */
  const resetToSystemTheme = async () => {
    try {
      await AsyncStorage.removeItem('dark_mode');
      const systemTheme = Appearance.getColorScheme() === 'dark';
      setDarkMode(systemTheme);
      console.log('Theme reset to system preference:', systemTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Error resetting theme:', error);
    }
  };

  /* 7 ▸ provide context value */
  const contextValue = {
    darkMode,
    toggleTheme,
    colors,
    isLoading,
    resetToSystemTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

/* convenience hook with error handling */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};