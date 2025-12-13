import { useTranslation as useI18nTranslation } from 'react-i18next';

/**
 * Custom hook for translations
 * Provides a simpler API for accessing translations
 */
export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  
  return {
    t, // Translation function
    language: i18n.language, // Current language code
  };
}

