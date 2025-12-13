import type { StoredPreferences } from './storage';

type ThemePreference = StoredPreferences['display']['theme'];

export interface ThemeColors {
  primary: string;
  'primary-hover': string;
  secondary: string;
  accent: string;
  background: string;
  'background-secondary': string;
  surface: string;
  'surface-hover': string;
  border: string;
  'text-primary': string;
  'text-secondary': string;
  'text-muted': string;
}

const LIGHT_THEME: ThemeColors = {
  primary: '#6366F1',
  'primary-hover': '#818CF8',
  secondary: '#10B981',
  accent: '#F59E0B',
  background: '#FAFBFC', // Soft off-white, not pure white
  'background-secondary': '#F4F6F8',
  surface: '#FFFFFF', // Pure white for cards/surfaces for contrast
  'surface-hover': '#F8FAFC',
  border: '#E4E7EB', // Softer, warmer border
  'text-primary': '#1A1F2E', // Darker, richer black
  'text-secondary': '#4B5563', // Medium gray
  'text-muted': '#9CA3AF', // Lighter gray for muted text
};

const DARK_THEME: ThemeColors = {
  primary: '#6366F1',
  'primary-hover': '#818CF8',
  secondary: '#10B981',
  accent: '#F59E0B',
  background: '#0F172A',
  'background-secondary': '#1E293B',
  surface: '#1E293B',
  'surface-hover': '#334155',
  border: '#334155',
  'text-primary': '#F1F5F9',
  'text-secondary': '#94A3B8',
  'text-muted': '#64748B',
};

/**
 * Get theme colors based on the theme preference
 * @param theme - The theme preference ('light', 'dark', or 'system')
 * @param systemTheme - The system theme ('light' or 'dark')
 * @returns Theme colors object
 */
export function getThemeColors(theme: ThemePreference, systemTheme: 'light' | 'dark' = 'dark'): ThemeColors {
  if (theme === 'system') {
    return systemTheme === 'light' ? LIGHT_THEME : DARK_THEME;
  }
  return theme === 'light' ? LIGHT_THEME : DARK_THEME;
}

/**
 * Get the effective theme (resolves 'system' to actual theme)
 * @param theme - The theme preference ('light', 'dark', or 'system')
 * @param systemTheme - The system theme ('light' or 'dark')
 * @returns The effective theme ('light' or 'dark')
 */
export function getEffectiveTheme(theme: ThemePreference, systemTheme: 'light' | 'dark' = 'dark'): 'light' | 'dark' {
  if (theme === 'system') {
    return systemTheme;
  }
  return theme;
}

