import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Path to mobile app translations (served to mobile app)
const MOBILE_LOCALES_DIR = path.resolve(__dirname, '../i18n/mobile-locales');
const LANGUAGES_FILE = path.join(MOBILE_LOCALES_DIR, 'languages.json');

// Cache for translations (can be cleared to force reload)
// Note: languages are read fresh from languages.json each time (no cache)
const translationCache: Record<string, any> = {};

/**
 * Get available languages from languages.json file
 */
async function getAvailableLanguages(): Promise<Array<{ code: string; name: string }>> {
  try {
    const fileContent = await fs.readFile(LANGUAGES_FILE, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Validate structure
    if (!data.languages || !Array.isArray(data.languages)) {
      throw new Error('Invalid languages.json format: expected { languages: [...] }');
    }
    
    return data.languages;
  } catch (error) {
    console.error('Error reading languages.json:', error);
    // Fallback to default languages if file read fails
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'zh', name: 'Chinese (Mandarin)' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
    ];
  }
}

/**
 * Load translations for a language from file (with caching)
 */
async function loadTranslations(lang: string): Promise<any> {
  // Check cache first
  if (translationCache[lang]) {
    return translationCache[lang];
  }

  const filePath = path.join(MOBILE_LOCALES_DIR, `${lang}.json`);
  
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const translations = JSON.parse(fileContent);
    
    // Cache the translations
    translationCache[lang] = translations;
    
    return translations;
  } catch (error) {
    console.error(`Error loading translations for ${lang}:`, error);
    throw error;
  }
}

/**
 * GET /api/i18n/languages
 * Get list of available languages (reads from files, no DB check)
 */
router.get('/languages', async (req: Request, res: Response) => {
  try {
    const languages = await getAvailableLanguages();
    res.json({
      languages,
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({ error: 'Failed to fetch languages' });
  }
});

/**
 * GET /api/i18n/translations/:lang
 * Get translations for a specific language (mobile app UI strings)
 * Reads from mobile-locales folder dynamically
 */
router.get('/translations/:lang', async (req: Request, res: Response) => {
  try {
    const { lang } = req.params;
    
    // Check if language file exists (no DB check, just file check)
    const filePath = path.join(MOBILE_LOCALES_DIR, `${lang}.json`);
    try {
      await fs.access(filePath);
    } catch {
      return res.status(404).json({ error: `Language ${lang} not found` });
    }

    // Load translations from file (with caching)
    const translations = await loadTranslations(lang);

    res.json({
      language: lang,
      translations,
    });
  } catch (error) {
    console.error('Error fetching translations:', error);
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

/**
 * POST /api/i18n/clear-cache
 * Clear translation cache (useful for hot-reloading during development)
 * Note: In production, you might want to add authentication to this endpoint
 */
router.post('/clear-cache', (req: Request, res: Response) => {
  try {
    Object.keys(translationCache).forEach(key => delete translationCache[key]);
    // Note: languages are read fresh each time, so no cache to clear for that
    res.json({ success: true, message: 'Translation cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;

