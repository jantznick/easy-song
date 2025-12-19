/**
 * Standard section title translations
 * These can be reused across songs for common section types
 */
export const STANDARD_SECTION_TITLES: Record<string, Record<string, string>> = {
  "Intro": {
    "en": "Intro",
    "es": "Introducción",
    "fr": "Introduction",
    "de": "Einleitung",
    "zh": "介绍",
    "it": "Introduzione"
  },
  "Verse": {
    "en": "Verse",
    "es": "Estrofa",
    "fr": "Couplet",
    "de": "Strophe",
    "zh": "诗句",
    "it": "Strofa"
  },
  "Verse 1": {
    "en": "Verse 1",
    "es": "Estrofa 1",
    "fr": "Couplet 1",
    "de": "Strophe 1",
    "zh": "第一段",
    "it": "Strofa 1"
  },
  "Verse 2": {
    "en": "Verse 2",
    "es": "Estrofa 2",
    "fr": "Couplet 2",
    "de": "Strophe 2",
    "zh": "第二段",
    "it": "Strofa 2"
  },
  "Verse 3": {
    "en": "Verse 3",
    "es": "Estrofa 3",
    "fr": "Couplet 3",
    "de": "Strophe 3",
    "zh": "第三段",
    "it": "Strofa 3"
  },
  "Chorus": {
    "en": "Chorus",
    "es": "Coro",
    "fr": "Refrain",
    "de": "Refrain",
    "zh": "副歌",
    "it": "Ritornello"
  },
  "Bridge": {
    "en": "Bridge",
    "es": "Puente",
    "fr": "Pont",
    "de": "Bridge",
    "zh": "桥段",
    "it": "Ponte"
  },
  "Outro": {
    "en": "Outro",
    "es": "Final",
    "fr": "Final",
    "de": "Outro",
    "zh": "结尾",
    "it": "Finale"
  },
  "Interlude": {
    "en": "Interlude",
    "es": "Interludio",
    "fr": "Interlude",
    "de": "Zwischenspiel",
    "zh": "间奏",
    "it": "Interludio"
  },
  "Interlude 2": {
    "en": "Interlude 2",
    "es": "Interludio 2",
    "fr": "Interlude 2",
    "de": "Zwischenspiel 2",
    "zh": "间奏 2",
    "it": "Interludio 2"
  },
  "Lyrics": {
    "en": "Lyrics",
    "es": "Letra",
    "fr": "Paroles",
    "de": "Texte",
    "zh": "歌词",
    "it": "Testo"
  }
};

/**
 * Get translated section title
 * If title exists in standard titles, use it. Otherwise, return simple object with English.
 * For custom titles, you may want to use AI translation or translation API.
 */
export function getSectionTitleI18n(title: string): Record<string, string> {
  // Check if it's a standard title
  if (STANDARD_SECTION_TITLES[title]) {
    return STANDARD_SECTION_TITLES[title];
  }
  
  // For custom titles, return English only (can be enhanced with AI translation)
  return {
    "en": title,
    "es": title, // Fallback - should be translated
    "fr": title,
    "de": title,
    "zh": title,
    "it": title
  };
}

/**
 * Convert old format (string title) to new format (i18n object)
 */
export function convertTitleToI18n(title: string): Record<string, string> {
  return getSectionTitleI18n(title);
}

