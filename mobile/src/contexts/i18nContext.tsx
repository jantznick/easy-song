import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n, { updateLanguageMaps, loadTranslationsFromAPI, LANGUAGE_CODE_MAP } from '../i18n/config';
import { fetchLanguages, fetchTranslations } from '../utils/api';
import { useUser } from './UserContext';

export interface i18nContextType {
  language: string;
  availableLanguages: Array<{ code: string; name: string }>;
  isLoading: boolean;
  translationsLoaded: boolean; // Whether initial translations have been loaded
  changeLanguage: (languageName: string) => Promise<void>;
}

const i18nContext = createContext<i18nContextType | undefined>(undefined);

export function usei18n(): i18nContextType {
  const context = useContext(i18nContext);
  if (!context) {
    throw new Error('usei18n must be used within an I18nProvider');
  }
  return context;
}

interface i18nProviderProps {
  children: ReactNode;
}

export function I18nProvider({ children }: i18nProviderProps) { 
  const { i18n: i18nInstance } = useTranslation();
  const { preferences } = useUser();
  const [availableLanguages, setAvailableLanguages] = useState<Array<{ code: string; name: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [loadedLanguages, setLoadedLanguages] = useState<Set<string>>(new Set()); // Track which languages we've loaded from API

  // Fetch available languages on mount
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const response = await fetchLanguages();
        setAvailableLanguages(response.languages);
        updateLanguageMaps(response.languages);
      } catch (error) {
        console.error('Failed to fetch languages from API:', error);
        // If API fails, we can't proceed - show error or retry
        throw error;
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages().catch((error) => {
      console.error('Critical: Failed to load languages from API', error);
      setIsLoading(false);
    });
  }, []);

  // Load translations for user's interface language (or default language on initial load)
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (isLoading) return; // Wait for languages to be loaded first

      // Determine which language to load
      const interfaceLanguage = preferences?.language?.interface || 'English';
      const languageCode = LANGUAGE_CODE_MAP[interfaceLanguage] || 'en';
      const currentLanguage = i18n.language || 'en';

      // Always fetch from API - no fallbacks
      if (!loadedLanguages.has(languageCode)) {
        try {
          console.log(`[I18n] Fetching translations for ${languageCode} from API...`);
          const response = await fetchTranslations(languageCode);
          await loadTranslationsFromAPI(languageCode, response.translations);
          setLoadedLanguages(prev => new Set([...prev, languageCode]));
          
          // Change to the user's preferred language (or keep current if it matches)
          if (currentLanguage !== languageCode) {
            i18n.changeLanguage(languageCode);
          }
          
          // Mark translations as loaded on first successful load
          if (!translationsLoaded) {
            setTranslationsLoaded(true);
          }
        } catch (error) {
          console.error(`Failed to fetch translations for ${languageCode} from API:`, error);
          // No fallback - app will show missing translations or error state
          throw error;
        }
      } else {
        // Language already loaded from API, just switch to it if needed
        if (currentLanguage !== languageCode) {
          i18n.changeLanguage(languageCode);
        }
        if (!translationsLoaded) {
          setTranslationsLoaded(true);
        }
      }
    };

    loadUserLanguage().catch((error) => {
      console.error('Critical: Failed to load translations from API', error);
      // Could show an error screen here or retry logic
    });
  }, [preferences?.language?.interface, isLoading, loadedLanguages]);

  const changeLanguage = async (languageName: string): Promise<void> => {
    const languageCode = LANGUAGE_CODE_MAP[languageName] || 'en';

    // If we haven't loaded this language from API yet, fetch it
    if (!loadedLanguages.has(languageCode)) {
      try {
        const response = await fetchTranslations(languageCode);
        await loadTranslationsFromAPI(languageCode, response.translations);
        setLoadedLanguages(prev => new Set([...prev, languageCode]));
        i18n.changeLanguage(languageCode);
      } catch (error) {
        console.error(`Failed to fetch translations for ${languageCode} from API:`, error);
        throw error; // No fallback - let caller handle the error
      }
    } else {
      // Language already loaded, just switch to it
      i18n.changeLanguage(languageCode);
    }
  };

  const value: i18nContextType = {
    language: i18nInstance.language || 'en',
    availableLanguages,
    isLoading,
    translationsLoaded,
    changeLanguage,
  };

  return <i18nContext.Provider value={value}>{children}</i18nContext.Provider>;
}

