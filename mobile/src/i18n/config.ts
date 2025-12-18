import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Language metadata - will be populated from API
export let LANGUAGE_CODE_MAP: Record<string, string> = {
  'English': 'en',
  'Spanish': 'es',
  'Chinese (Mandarin)': 'zh',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
};

export let LANGUAGE_NAME_MAP: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'zh': 'Chinese (Mandarin)',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
};

// Get device language
const deviceLanguage = RNLocalize.getLocales()[0]?.languageCode || 'en';

// Initialize i18n with empty resources - all translations come from API
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {}, // No local translations - all from API
    lng: deviceLanguage, // Default to device language
    fallbackLng: false, // No fallback - require API translations
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Disable suspense for React Native
    },
  });

/**
 * Update language maps from API data
 */
export function updateLanguageMaps(languages: Array<{ code: string; name: string }>): void {
  LANGUAGE_CODE_MAP = {};
  LANGUAGE_NAME_MAP = {};
  
  languages.forEach(({ code, name }) => {
    LANGUAGE_CODE_MAP[name] = code;
    LANGUAGE_NAME_MAP[code] = name;
  });
}

/**
 * Load translations for a language from API and add to i18n resources
 */
export async function loadTranslationsFromAPI(
  lang: string,
  translations: Record<string, any>
): Promise<void> {
  // Add or update the language resource
  i18n.addResourceBundle(lang, 'translation', translations, true, true);
}

/**
 * Change the i18n language based on language name (e.g., "English", "Spanish")
 * Note: For API-based translations, use the changeLanguage function from i18nContext instead
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

