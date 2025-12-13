import { useTheme } from '../contexts/ThemeContext';

/**
 * Get theme-aware class names
 * Since NativeWind v4's dark: variants don't work reliably in React Native,
 * we conditionally apply classes based on isDark
 */
export function useThemeClasses() {
  const { isDark } = useTheme();
  
  return {
    /**
     * Get background color class
     */
    bg: (light: string, dark: string) => isDark ? dark : light,
    
    /**
     * Get text color class
     */
    text: (light: string, dark: string) => isDark ? dark : light,
    
    /**
     * Get border color class
     */
    border: (light: string, dark: string) => isDark ? dark : light,
    
    /**
     * Get a class conditionally
     */
    class: (light: string, dark: string) => isDark ? dark : light,
  };
}

/**
 * Helper to combine multiple class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
