# Backend i18n Setup

The backend now supports internationalization (i18n) using `i18next`, matching the frontend's i18n setup.

## How It Works

1. **Language Detection**: The `i18nMiddleware` automatically detects the user's preferred language from:
   - Query parameter: `?lang=en` (e.g., `/api/history?lang=es`)
   - `Accept-Language` HTTP header
   - Falls back to `en` if no language is detected

2. **Translation Files**: Located in `src/i18n/locales/` with support for:
   - English (`en.json`)
   - Spanish (`es.json`)
   - French (`fr.json`)
   - German (`de.json`)
   - Chinese (`zh.json`)

## Usage in Routes

Import the `t` function and use it to translate error messages:

```typescript
import { t } from '../middleware/i18n';

// Simple translation
return res.status(400).json({ error: t('errors.auth.emailRequired') });

// Translation with variables
return res.status(400).json({ 
  error: t('errors.history.pageOutOfRange', { page: 5, maxPage: 3 })
});
```

## Translation Key Structure

Translation keys follow a nested structure:
- `errors.auth.*` - Authentication errors
- `errors.user.*` - User-related errors
- `errors.preferences.*` - Preferences errors
- `errors.history.*` - History errors
- `errors.common.*` - Common errors
- `success.*` - Success messages

## Adding New Translations

1. Add the key to all locale files in `src/i18n/locales/`
2. Use the key in your route: `t('errors.yourCategory.yourKey')`

## Example

```typescript
// Before
return res.status(400).json({ error: 'Email is required' });

// After
return res.status(400).json({ error: t('errors.auth.emailRequired') });
```

The error message will automatically be translated based on the user's language preference!
