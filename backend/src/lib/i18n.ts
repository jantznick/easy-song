import i18next from 'i18next';
import en from '../i18n/locales/en.json';
import es from '../i18n/locales/es.json';
import zh from '../i18n/locales/zh.json';
import fr from '../i18n/locales/fr.json';
import de from '../i18n/locales/de.json';
import it from '../i18n/locales/it.json';

// Initialize i18next
i18next.init({
  resources: {
    en: { translation: en },
    es: { translation: es },
    zh: { translation: zh },
    fr: { translation: fr },
    de: { translation: de },
    it: { translation: it },
  },
  fallbackLng: 'en',
  defaultNS: 'translation',
  interpolation: {
    escapeValue: false, // We're not in a browser, so no need to escape
  },
});

export default i18next;

// Re-export t function for convenience
export const t = (key: string, options?: any) => i18next.t(key, options);


