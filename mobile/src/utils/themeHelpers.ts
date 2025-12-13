import { StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import type { ThemeColors } from './themes';

/**
 * Helper to create theme-aware styles
 * Usage: const styles = createThemedStyles(colors, (colors) => ({
 *   container: { backgroundColor: colors.background },
 *   text: { color: colors['text-primary'] },
 * }));
 */
export function createThemedStyles<T extends Record<string, ViewStyle | TextStyle>>(
  colors: ThemeColors,
  styleFn: (colors: ThemeColors) => T
): T {
  return StyleSheet.create(styleFn(colors));
}

/**
 * Get a theme color by key
 * Usage: const bgColor = getThemeColor(colors, 'background');
 */
export function getThemeColor(colors: ThemeColors, key: keyof ThemeColors): string {
  return colors[key];
}

