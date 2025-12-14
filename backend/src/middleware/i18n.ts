import { Request, Response, NextFunction } from 'express';
import i18next from '../lib/i18n';

/**
 * Middleware to detect and set language from:
 * 1. Query parameter: ?lang=en
 * 2. Accept-Language header
 * 3. Default to 'en'
 */
export function i18nMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check query parameter first
  const langFromQuery = req.query.lang as string;
  if (langFromQuery && ['en', 'es', 'fr', 'de', 'zh'].includes(langFromQuery)) {
    i18next.changeLanguage(langFromQuery);
    (req as any).language = langFromQuery;
    return next();
  }

  // Check Accept-Language header
  const acceptLanguage = req.headers['accept-language'];
  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,es;q=0.8")
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code] = lang.trim().split(';');
        return code.split('-')[0].toLowerCase(); // Extract base language code
      });

    // Find first supported language
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'zh'];
    const detectedLang = languages.find(lang => supportedLanguages.includes(lang)) || 'en';
    
    i18next.changeLanguage(detectedLang);
    (req as any).language = detectedLang;
  } else {
    i18next.changeLanguage('en');
    (req as any).language = 'en';
  }

  next();
}

/**
 * Helper function to get translated message
 * Usage: t('errors.auth.emailRequired')
 */
export function t(key: string, options?: any): string {
  const result = i18next.t(key, options);
  return typeof result === 'string' ? result : String(result);
}
