import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Path to mobile app translations (served to mobile app)
const MOBILE_LOCALES_DIR = path.resolve(__dirname, '../i18n/mobile-locales');

// Language metadata
const LANGUAGE_METADATA = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese (Mandarin)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

// Cache for translations (can be cleared to force reload)
const translationCache: Record<string, any> = {};

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
 * Get list of available languages
 */
router.get('/languages', (req: Request, res: Response) => {
  try {
    res.json({
      languages: LANGUAGE_METADATA,
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
    
    // Validate language code
    const validLanguages = LANGUAGE_METADATA.map(l => l.code);
    if (!validLanguages.includes(lang)) {
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
    res.json({ success: true, message: 'Translation cache cleared' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

export default router;

