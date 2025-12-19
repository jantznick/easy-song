# i18n Migration Guide

## Overview

The data structure has been updated to support internationalization (i18n) with the following changes:

1. **Language keys**: `spanish`/`english` → `es`/`en`
2. **Section titles**: String → i18n object `{ "en": "Lyrics", "es": "Letra", ... }`
3. **Section explanations**: String → i18n object (for study mode)

## File Structure

### Before (Old Format)
```json
{
  "sections": [{
    "title": "Lyrics",
    "lines": [{
      "spanish": "Hola mundo",
      "english": "Hello world",
      "explanation": "...",
      "start_ms": 0,
      "end_ms": 2000
    }]
  }]
}
```

### After (New Format)
```json
{
  "sections": [{
    "title": {
      "en": "Lyrics",
      "es": "Letra",
      "fr": "Paroles"
    },
    "lines": [{
      "es": "Hola mundo",
      "en": "Hello world",
      "explanation": "...",
      "start_ms": 0,
      "end_ms": 2000
    }]
  }]
}
```

## Migration

### Automatic Migration

Run the migration script to convert existing files:

```bash
cd backend

# Migrate all files (creates backups)
npx ts-node scripts/migrate-to-i18n.ts

# Migrate without backups (not recommended)
npx ts-node scripts/migrate-to-i18n.ts --no-backup

# Migrate only songs directory
npx ts-node scripts/migrate-to-i18n.ts --songs-only

# Migrate only study directory
npx ts-node scripts/migrate-to-i18n.ts --study-only
```

### What Gets Migrated

1. **Line translations**: `spanish` → `es`, `english` → `en`
2. **Section titles**: Converted to i18n objects using standard translations
3. **Section explanations**: Converted to i18n objects (English only initially)

### After Migration

- Original files are backed up as `.backup` files
- New files use the i18n format
- Section explanations need translation (currently English only)

## New Scripts Behavior

### `generate-analysis.ts`
- Now outputs `es`/`en` keys instead of `spanish`/`english`
- Section titles are i18n objects
- Ready for multi-language support

### `process-lyrics-folder.ts`
- Same changes as `generate-analysis.ts`
- Processes files in new format

## Standard Section Titles

Common section titles are automatically translated:

- `"Lyrics"` → `{ "en": "Lyrics", "es": "Letra", "fr": "Paroles", ... }`
- `"Intro"` → `{ "en": "Intro", "es": "Introducción", ... }`
- `"Chorus"` → `{ "en": "Chorus", "es": "Coro", ... }`
- `"Verse 1"` → `{ "en": "Verse 1", "es": "Estrofa 1", ... }`

See `scripts/utils/section-titles.ts` for the full list.

## Custom Section Titles

For custom section titles (not in the standard list):
- Currently returns English only
- Can be enhanced with:
  - AI translation during analysis
  - Translation API
  - Manual curation

## Section Explanations

Section explanations in study mode files are converted to i18n objects but currently only contain English. To add translations:

1. **AI Generation**: Modify analysis scripts to generate explanations in multiple languages
2. **Translation API**: Use a translation service to translate existing explanations
3. **Manual**: Curate translations manually

## Frontend/Backend Integration

### Backend API

The API should extract the appropriate language based on user preference:

```typescript
// GET /api/songs/:videoId?lang=en
const userLang = req.query.lang || 'en';
const sectionTitle = section.title[userLang] || section.title.en;
const lineText = line[userLang] || line.en;
```

### Frontend/Mobile

Components should select the appropriate language:

```typescript
const currentLang = 'en'; // From user preferences
const title = section.title[currentLang] || section.title.en;
const text = line[currentLang] || line.en;
const original = line.es; // Always show original Spanish
```

## Adding New Languages

### 1. Update Section Titles

Add translations to `scripts/utils/section-titles.ts`:

```typescript
export const STANDARD_SECTION_TITLES: Record<string, Record<string, string>> = {
  "Lyrics": {
    "en": "Lyrics",
    "es": "Letra",
    "fr": "Paroles",
    "pt": "Letra", // Add Portuguese
    // ...
  }
};
```

### 2. Update Migration Script

The migration script automatically includes all languages defined in `STANDARD_SECTION_TITLES`.

### 3. Update Analysis Scripts

Modify analysis scripts to generate translations in new languages (optional, can use translation API instead).

## Backward Compatibility

### During Transition

- API can support both formats temporarily
- Migration script checks if file is already migrated
- Old format files can coexist with new format

### After Migration

- Remove old format support
- All files use new structure
- Update documentation

## Testing

### Test Migration

```bash
# 1. Backup your data directory
cp -r backend/data backend/data.backup

# 2. Run migration
npx ts-node scripts/migrate-to-i18n.ts

# 3. Verify a file
cat backend/data/songs/KU5V5WZVcVE.json | jq '.sections[0].title'

# Should show:
# {
#   "en": "Lyrics",
#   "es": "Letra",
#   ...
# }
```

### Test New Scripts

```bash
# Generate new song (will use new format)
npx ts-node scripts/generate-analysis.ts VIDEO_ID

# Check output
cat backend/data/songs/VIDEO_ID.json | jq '.sections[0].lines[0]'

# Should show:
# {
#   "es": "Spanish text",
#   "en": "English text",
#   ...
# }
```

## Next Steps

1. **Run migration** on existing files
2. **Update backend API** to extract language-specific data
3. **Update frontend/mobile** to use new structure
4. **Add translations** for section explanations (optional)
5. **Test** with different languages
6. **Remove old format support** after verification

## Questions?

- See `DATA_STRUCTURE_I18N_PROPOSAL.md` for detailed proposal
- See `scripts/utils/section-titles.ts` for standard translations
- See `scripts/utils/data-migration.ts` for migration logic

