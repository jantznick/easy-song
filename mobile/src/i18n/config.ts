import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import zh from './locales/zh.json';
import fr from './locales/fr.json';
import de from './locales/de.json';

// Map language names to language codes
export const LANGUAGE_CODE_MAP: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Chinese (Mandarin)': 'zh',
  'French': 'fr',
  'German': 'de',
};

// Map language codes to language names (reverse)
export const LANGUAGE_NAME_MAP: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'zh': 'Chinese (Mandarin)',
  'fr': 'French',
  'de': 'German',
};

// Get device language
const deviceLanguage = RNLocalize.getLocales()[0]?.languageCode || 'en';

// Initialize i18n
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      es: { translation: es },
      zh: { translation: zh },
      fr: { translation: fr },
      de: { translation: de },
    },
    lng: deviceLanguage, // Default to device language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Change the i18n language based on language name (e.g., "English", "Spanish")
 */
export function changeLanguage(languageName: string): void {
  const languageCode = LANGUAGE_CODE_MAP[languageName] || 'en';
  i18n.changeLanguage(languageCode);
}

/**
 * Get current language code
 */
export function getCurrentLanguageCode(): string {
  return i18n.language || 'en';
}

/**
 * Get current language name
 */
export function getCurrentLanguageName(): string {
  return LANGUAGE_NAME_MAP[i18n.language] || 'English';
}

export default i18n;

