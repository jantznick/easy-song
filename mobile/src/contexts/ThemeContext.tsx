import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Appearance } from 'react-native';
import { useUser } from '../hooks/useUser';
import { getThemeColors, getEffectiveTheme, type ThemeColors } from '../utils/themes';

export type ThemeMode = 'light' | 'dark';

export interface ThemeContextType {
  colors: ThemeColors;
  theme: ThemeMode;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { preferences } = useUser();
  const [systemTheme, setSystemTheme] = React.useState<ThemeMode>(
    (Appearance.getColorScheme() || 'dark') as ThemeMode
  );

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme((colorScheme || 'dark') as ThemeMode);
    });

    return () => subscription.remove();
  }, []);

  // Get effective theme (resolves 'system' to actual theme)
  const effectiveTheme = getEffectiveTheme(preferences.display.theme, systemTheme);
  
  // Get theme colors based on effective theme
  const colors = getThemeColors(preferences.display.theme, systemTheme);

  const value: ThemeContextType = {
    colors,
    theme: effectiveTheme,
    isDark: effectiveTheme === 'dark',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

