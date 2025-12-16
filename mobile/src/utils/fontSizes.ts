import type { StoredPreferences } from './storage';

type FontSizePreference = StoredPreferences['display']['fontSize'];

export interface FontSizes {
  main: number;        // Main lyric text
  translation: number; // Translation text
  explanation: number; // Explanation text
  lineHeight: {
    main: number;
    translation: number;
    explanation: number;
  };
}

const FONT_SIZE_MAP: Record<FontSizePreference, FontSizes> = {
  small: {
    main: 14,
    translation: 12,
    explanation: 11,
    lineHeight: {
      main: 20,
      translation: 18,
      explanation: 16,
    },
  },
  medium: {
    main: 18,
    translation: 16,
    explanation: 15,
    lineHeight: {
      main: 26,
      translation: 20,
      explanation: 22,
    },
  },
  large: {
    main: 21,
    translation: 18,
    explanation: 21,
    lineHeight: {
      main: 30,
      translation: 26,
      explanation: 24,
    },
  },
};

/**
 * Get font sizes based on the user's fontSize preference
 * @param fontSize - The fontSize preference ('small', 'medium', or 'large')
 * @returns An object with font sizes for different text types
 */
export function getFontSizes(fontSize: FontSizePreference): FontSizes {
  return FONT_SIZE_MAP[fontSize];
}


