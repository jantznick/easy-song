import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { z } from 'zod';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
// In Docker, scripts are at /app/scripts, data is at /app/data, prompts are at /app/
// Locally, everything is relative to scripts directory
const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'production';
const BASE_DIR = isDocker ? '/app' : path.resolve(__dirname, '..');

const ANALYZED_LYRICS_DIR = path.join(BASE_DIR, 'data', 'analyzed-lyrics');
const FINAL_SONGS_DIR = path.join(BASE_DIR, 'data', 'songs');
const PROMPT_TEMPLATE_PATH = path.join(BASE_DIR, 'prompt-translate.txt');

interface AnalyzedLyric {
  text: string;
  start_ms: number;
  end_ms: number;
  explanation: string | null;
}

interface AnalyzedSection {
  title: string;
  sectionExplanation: string;
  start_ms: number;
  end_ms: number;
}

interface AnalyzedData {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  originalLanguage: string;
  lyrics: AnalyzedLyric[];
  structuredSections: AnalyzedSection[];
}

// Supported languages
const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'zh', 'it'] as const;
type Language = typeof SUPPORTED_LANGUAGES[number];

// Zod schemas for single-language translation responses
const SingleLanguageLyricTranslationSchema = z.object({
  text: z.string(),
  translation: z.string(),
  explanation: z.string().nullable(),
});

const SingleLanguageLyricsResponseSchema = z.object({
  translations: z.array(SingleLanguageLyricTranslationSchema),
});

const SingleLanguageSectionTranslationSchema = z.object({
  title: z.string(),
  sectionExplanation: z.string(),
});

const SingleLanguageSectionsResponseSchema = z.object({
  sectionTranslations: z.array(SingleLanguageSectionTranslationSchema),
});

type SingleLanguageLyricsResponse = z.infer<typeof SingleLanguageLyricsResponseSchema>;
type SingleLanguageSectionsResponse = z.infer<typeof SingleLanguageSectionsResponseSchema>;

/**
 * Load translation guidelines from prompt template
 */
async function loadTranslationGuidelines(): Promise<string> {
  try {
    const guidelines = await fs.readFile(PROMPT_TEMPLATE_PATH, 'utf-8');
    // Extract just the guidelines section (skip the header if needed)
    return guidelines;
  } catch {
    // If file doesn't exist, return empty string
    return '';
  }
}

/**
 * Build prompt for single-language lyrics translation
 */
async function buildSingleLanguageLyricsPrompt(
  lyrics: AnalyzedLyric[],
  targetLanguage: Language,
  originalLanguage: string,
  guidelines: string = ''
): Promise<string> {
  const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    it: 'Italian',
  };
  
  const origLang = originalLanguage as Language;
  
  let prompt = `Your task is to translate song lyrics and their explanations into ${languageNames[targetLanguage]}.`;
  
  const origLangName = SUPPORTED_LANGUAGES.includes(origLang) ? languageNames[origLang] : originalLanguage;
  prompt += `\n\nThe original language is ${origLangName}. Please translate all lyrics and explanations into ${languageNames[targetLanguage]}.`;
  
  // Add translation guidelines if available
  if (guidelines) {
    prompt += '\n\n## Translation Guidelines\n\n';
    prompt += guidelines;
  }
  
  prompt += '\n\n## Lyrics to Translate\n\n';
  prompt += '```json\n';
  prompt += JSON.stringify({ lyrics }, null, 2);
  prompt += '\n```\n\n';
  
  return prompt;
}

async function buildSingleLanguageSectionsPrompt(
  structuredSections: AnalyzedSection[],
  targetLanguage: Language,
  originalLanguage: string,
  guidelines: string = ''
): Promise<string> {
  const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    it: 'Italian',
  };
  
  let prompt = `Your task is to translate song section titles and their explanations into ${languageNames[targetLanguage]}.`;
  
  const origLang = originalLanguage as Language;
  if (targetLanguage === origLang && SUPPORTED_LANGUAGES.includes(origLang)) {
    prompt += `\n\n**Note:** The target language (${languageNames[targetLanguage]}) is the same as the original language. Please use the original text for titles, but still translate the explanations into ${languageNames[targetLanguage]}.`;
  } else {
    const origLangName = SUPPORTED_LANGUAGES.includes(origLang) ? languageNames[origLang] : originalLanguage;
    prompt += `\n\nThe original language is ${origLangName}. Please translate all section titles and explanations into ${languageNames[targetLanguage]}.`;
  }
  
  // Add translation guidelines if available
  if (guidelines) {
    prompt += '\n\n## Translation Guidelines\n\n';
    prompt += guidelines;
  }
  
  prompt += '\n\n## Structured Sections to Translate\n\n';
  prompt += '```json\n';
  prompt += JSON.stringify({ structuredSections }, null, 2);
  prompt += '\n```\n\n';
  
  return prompt;
}

/**
 * Call OpenAI API to translate lyrics into a single language
 */
async function translateLyricsForLanguage(
  lyrics: AnalyzedLyric[],
  targetLanguage: Language,
  originalLanguage: string,
  guidelines: string = ''
): Promise<SingleLanguageLyricsResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    it: 'Italian',
  };
  
  console.log(`  🌐 Translating lyrics to ${languageNames[targetLanguage]}...`);
  
  const prompt = await buildSingleLanguageLyricsPrompt(lyrics, targetLanguage, originalLanguage, guidelines);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  try {
    console.log(`  🤖 Calling OpenAI API for lyrics translation...`);
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in song lyrics. You translate lyrics and explanations while preserving meaning, tone, cultural context, and nuance. Always respond with valid JSON in the exact format specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: zodResponseFormat(SingleLanguageLyricsResponseSchema, 'single_language_lyrics_response'),
    });
    
    // Log token usage with cost calculation
    if (completion.usage) {
      const inputTokens = completion.usage.prompt_tokens;
      const outputTokens = completion.usage.completion_tokens;
      const totalTokens = completion.usage.total_tokens;
      
      // Pricing for gpt-4o: $2.50 per 1M input tokens, $10.00 per 1M output tokens
      const inputCost = (inputTokens / 1_000_000) * 2.50;
      const outputCost = (outputTokens / 1_000_000) * 10.00;
      const totalCost = inputCost + outputCost;
      
      console.log(`    📊 ${languageNames[targetLanguage]} - Tokens: ${inputTokens.toLocaleString()}/${outputTokens.toLocaleString()}/${totalTokens.toLocaleString()} | Cost: $${totalCost.toFixed(4)}`);
    }
    
    // Get parsed content (structured output automatically parses and validates)
    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed content in OpenAI response');
    }
    
    // Validate with zod schema
    const validated = SingleLanguageLyricsResponseSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`  ⚠️  Zod validation error for ${languageNames[targetLanguage]}:`, error.errors);
      throw new Error(`Response validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Call OpenAI API to translate sections into a single language
 */
async function translateSectionsForLanguage(
  structuredSections: AnalyzedSection[],
  targetLanguage: Language,
  originalLanguage: string,
  guidelines: string = ''
): Promise<SingleLanguageSectionsResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  const languageNames: Record<Language, string> = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    de: 'German',
    zh: 'Chinese',
    it: 'Italian',
  };
  
  console.log(`  🌐 Translating sections to ${languageNames[targetLanguage]}...`);
  
  const prompt = await buildSingleLanguageSectionsPrompt(structuredSections, targetLanguage, originalLanguage, guidelines);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  try {
    console.log(`  🤖 Calling OpenAI API for sections translation...`);
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator specializing in song lyrics. You translate section titles and explanations while preserving meaning, tone, cultural context, and nuance. Always respond with valid JSON in the exact format specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: zodResponseFormat(SingleLanguageSectionsResponseSchema, 'single_language_sections_response'),
    });
    
    // Log token usage with cost calculation
    if (completion.usage) {
      const inputTokens = completion.usage.prompt_tokens;
      const outputTokens = completion.usage.completion_tokens;
      const totalTokens = completion.usage.total_tokens;
      
      // Pricing for gpt-4o: $2.50 per 1M input tokens, $10.00 per 1M output tokens
      const inputCost = (inputTokens / 1_000_000) * 2.50;
      const outputCost = (outputTokens / 1_000_000) * 10.00;
      const totalCost = inputCost + outputCost;
      
      console.log(`    📊 ${languageNames[targetLanguage]} - Tokens: ${inputTokens.toLocaleString()}/${outputTokens.toLocaleString()}/${totalTokens.toLocaleString()} | Cost: $${totalCost.toFixed(4)}`);
    }
    
    // Get parsed content (structured output automatically parses and validates)
    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed content in OpenAI response');
    }
    
    // Validate with zod schema
    const validated = SingleLanguageSectionsResponseSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`  ⚠️  Zod validation error for ${languageNames[targetLanguage]}:`, error.errors);
      throw new Error(`Response validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Merge language-by-language translations into final format
 * For the original language, copies the corrected text instead of translating
 */
function mergeLanguageTranslations(
  analyzedData: AnalyzedData,
  lyricsTranslationsByLanguage: Partial<Record<Language, SingleLanguageLyricsResponse>>,
  sectionsTranslationsByLanguage: Partial<Record<Language, SingleLanguageSectionsResponse>>,
  originalLanguage: string
): any {
  const origLang = originalLanguage as Language;
  
  // Merge lyrics with translations from all languages
  const lyrics = analyzedData.lyrics.map((lyric, index) => {
    const translations: Record<Language, string> = {} as Record<Language, string>;
    const explanations: Record<Language, string | null> = {} as Record<Language, string | null>;
    
    // Collect translations from each language
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === origLang && SUPPORTED_LANGUAGES.includes(origLang)) {
        // For original language, use the corrected text from analyzed data
        translations[lang] = lyric.text;
        explanations[lang] = lyric.explanation;
      } else {
        // For other languages, use the translation
        const langTranslation = lyricsTranslationsByLanguage[lang]?.translations[index];
        if (!langTranslation) {
          throw new Error(`Missing ${lang} translation for lyric at index ${index}`);
        }
        translations[lang] = langTranslation.translation;
        explanations[lang] = langTranslation.explanation;
      }
    }
    
    return {
      text: lyric.text, // This is the corrected text from analysis
      start_ms: lyric.start_ms,
      end_ms: lyric.end_ms,
      translations,
      explanations,
    };
  });
  
  // Merge structured sections with translations from all languages
  const structuredSections = analyzedData.structuredSections.map((section, index) => {
    const title: Record<Language, string> = {} as Record<Language, string>;
    const sectionExplanation: Record<Language, string> = {} as Record<Language, string>;
    
    // Collect translations from each language
    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === origLang && SUPPORTED_LANGUAGES.includes(origLang)) {
        // For original language, use the original title and explanation
        title[lang] = section.title;
        sectionExplanation[lang] = section.sectionExplanation;
      } else {
        // For other languages, use the translation
        const langTranslation = sectionsTranslationsByLanguage[lang]?.sectionTranslations[index];
        if (!langTranslation) {
          throw new Error(`Missing ${lang} translation for section at index ${index}`);
        }
        title[lang] = langTranslation.title;
        sectionExplanation[lang] = langTranslation.sectionExplanation;
      }
    }
    
    return {
      title,
      sectionExplanation,
      start_ms: section.start_ms,
      end_ms: section.end_ms,
    };
  });
  
  return {
    videoId: analyzedData.videoId,
    title: analyzedData.title,
    artist: analyzedData.artist,
    thumbnailUrl: analyzedData.thumbnailUrl || '',
    originalLanguage: analyzedData.originalLanguage,
    transcribedAt: new Date().toISOString(),
    lyrics,
    structuredSections,
  };
}

/**
 * Check if file exists and validate its structure
 * Returns: { exists: boolean, missingLanguages: Language[], existingData?: any }
 */
async function checkExistingFile(finalPath: string, analyzedData: AnalyzedData): Promise<{
  exists: boolean;
  missingLanguages: Language[];
  existingData?: any;
}> {
  try {
    await fs.access(finalPath);
    // File exists, check structure
    const content = await fs.readFile(finalPath, 'utf-8');
    const data = JSON.parse(content);
    
    const missingLanguages: Language[] = [];
    
    // Check each language individually
    for (const lang of SUPPORTED_LANGUAGES) {
      let langComplete = true;
      
      // Check lyrics translations and explanations for this language
      const hasLyrics = Array.isArray(data.lyrics) && data.lyrics.length > 0;
      if (hasLyrics) {
        const lyricsComplete = data.lyrics.every((lyric: any, index: number) => {
          // Check if translation exists
          if (!lyric.translations || lyric.translations[lang] === undefined) {
            return false;
          }
          // Check if explanation exists (can be null or empty string)
          if (!lyric.explanations || lyric.explanations[lang] === undefined) {
            return false;
          }
          // Check if count matches analyzed data
          if (data.lyrics.length !== analyzedData.lyrics.length) {
            return false;
          }
          return true;
        });
        if (!lyricsComplete) {
          langComplete = false;
        }
      } else {
        langComplete = false;
      }
      
      // Check sections for this language
      const hasSections = Array.isArray(data.structuredSections) && data.structuredSections.length > 0;
      if (hasSections) {
        const sectionsComplete = data.structuredSections.every((section: any, index: number) => {
          if (!section.title || section.title[lang] === undefined) {
            return false;
          }
          if (!section.sectionExplanation || section.sectionExplanation[lang] === undefined) {
            return false;
          }
          // Check if count matches analyzed data
          if (data.structuredSections.length !== analyzedData.structuredSections.length) {
            return false;
          }
          return true;
        });
        if (!sectionsComplete) {
          langComplete = false;
        }
      } else {
        langComplete = false;
      }
      
      if (!langComplete) {
        missingLanguages.push(lang);
      }
    }
    
    return {
      exists: true,
      missingLanguages,
      existingData: data,
    };
  } catch {
    // File doesn't exist
    return {
      exists: false,
      missingLanguages: [...SUPPORTED_LANGUAGES],
    };
  }
}

/**
 * Process a single video: translate lyrics
 */
async function translateVideo(videoId: string, skipExisting: boolean = true): Promise<boolean> {
  console.log(`\n🌍 Translating: ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    const finalPath = path.join(FINAL_SONGS_DIR, `${videoId}.json`);
    
    // Load analyzed data first (needed for checking)
    const analyzedPath = path.join(ANALYZED_LYRICS_DIR, `${videoId}.json`);
    let analyzedData: AnalyzedData;
    
    try {
      const analyzedContent = await fs.readFile(analyzedPath, 'utf-8');
      analyzedData = JSON.parse(analyzedContent);
    } catch (e) {
      throw new Error(`Could not read analyzed-lyrics: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    
    // Check if final output exists and what parts are needed
    let existingData: any = null;
    let missingLanguages: Language[] = [...SUPPORTED_LANGUAGES];
    
    if (skipExisting) {
      const fileCheck = await checkExistingFile(finalPath, analyzedData);
      
      if (fileCheck.exists) {
        existingData = fileCheck.existingData;
        missingLanguages = fileCheck.missingLanguages;
        
        // If no languages are missing, we're done
        if (missingLanguages.length === 0) {
          console.log(`  ✅ All translations already exist, skipping...`);
          return true;
        }
        console.log(`  🔍 Found existing file, checking structure...`);
        console.log(`  ⚠️  Missing languages: ${missingLanguages.join(', ')}`);
      } else {
        console.log(`  🔍 No existing file found, will create new translation file...`);
      }
    } else {
      console.log(`  🔍 Will create/overwrite translation file...`);
    }
    
    console.log(`  📝 Creating translation file...`);
    
    // Load translation guidelines
    const guidelines = await loadTranslationGuidelines();
    
    // Translate language by language
    const lyricsTranslationsByLanguage: Record<Language, SingleLanguageLyricsResponse> = {} as Record<Language, SingleLanguageLyricsResponse>;
    const sectionsTranslationsByLanguage: Record<Language, SingleLanguageSectionsResponse> = {} as Record<Language, SingleLanguageSectionsResponse>;
    
    // Initialize or load existing file for incremental writing
    await fs.mkdir(FINAL_SONGS_DIR, { recursive: true });
    let currentData: any = existingData || {
      videoId: analyzedData.videoId,
      title: analyzedData.title,
      artist: analyzedData.artist,
      thumbnailUrl: analyzedData.thumbnailUrl || '',
      originalLanguage: analyzedData.originalLanguage,
      transcribedAt: new Date().toISOString(),
      lyrics: analyzedData.lyrics.map((lyric) => ({
        text: lyric.text,
        start_ms: lyric.start_ms,
        end_ms: lyric.end_ms,
        translations: {} as Record<Language, string>,
        explanations: {} as Record<Language, string | null>,
      })),
      structuredSections: analyzedData.structuredSections.map((section) => ({
        title: {} as Record<Language, string>,
        sectionExplanation: {} as Record<Language, string>,
        start_ms: section.start_ms,
        end_ms: section.end_ms,
      })),
    };
    
    // Helper function to save incrementally
    const saveIncrementally = async () => {
      await fs.writeFile(finalPath, JSON.stringify(currentData, null, 2));
    };
    
    const origLang = analyzedData.originalLanguage as Language;
    
    // Get languages needing translation (including original if missing)
    const languagesNeedingLyrics = missingLanguages;
    const languagesNeedingSections = missingLanguages;
    
    // Translate lyrics for each needed language
    if (languagesNeedingLyrics.length > 0) {
      console.log(`  📝 Translating ${analyzedData.lyrics.length} lyric lines into ${languagesNeedingLyrics.length} language(s)...`);
      for (const lang of languagesNeedingLyrics) {
        const translation = await translateLyricsForLanguage(
          analyzedData.lyrics,
          lang,
          analyzedData.originalLanguage,
          guidelines
        );
        
        // Update current data incrementally
        for (let i = 0; i < translation.translations.length; i++) {
          // If target language is the original language, use original text instead of translation
          if (lang === origLang && SUPPORTED_LANGUAGES.includes(origLang)) {
            currentData.lyrics[i].translations[lang] = analyzedData.lyrics[i].text; // Use corrected original text
          } else {
            currentData.lyrics[i].translations[lang] = translation.translations[i].translation;
          }
          currentData.lyrics[i].explanations[lang] = translation.translations[i].explanation;
        }
        
        // Save after each language
        await saveIncrementally();
        console.log(`  💾 Saved ${lang} lyrics translations`);
      }
    }
    
    // Use existing lyrics translations for languages that don't need translation
    if (existingData && existingData.lyrics) {
      for (const lang of SUPPORTED_LANGUAGES) {
        if (!languagesNeedingLyrics.includes(lang)) {
          // Extract existing translations for this language
          for (let i = 0; i < existingData.lyrics.length; i++) {
            currentData.lyrics[i].translations[lang] = existingData.lyrics[i].translations[lang];
            currentData.lyrics[i].explanations[lang] = existingData.lyrics[i].explanations[lang];
          }
        }
      }
    }
    
    // Translate sections for each needed language
    if (languagesNeedingSections.length > 0) {
      console.log(`  📝 Translating ${analyzedData.structuredSections.length} sections into ${languagesNeedingSections.length} language(s)...`);
      for (const lang of languagesNeedingSections) {
        const translation = await translateSectionsForLanguage(
          analyzedData.structuredSections,
          lang,
          analyzedData.originalLanguage,
          guidelines
        );
        
        // Update current data incrementally
        for (let i = 0; i < translation.sectionTranslations.length; i++) {
          // If target language is the original language, use original titles but translated explanations
          if (lang === origLang && SUPPORTED_LANGUAGES.includes(origLang)) {
            currentData.structuredSections[i].title[lang] = analyzedData.structuredSections[i].title; // Original title
            currentData.structuredSections[i].sectionExplanation[lang] = translation.sectionTranslations[i].sectionExplanation; // Translated explanation
          } else {
            currentData.structuredSections[i].title[lang] = translation.sectionTranslations[i].title;
            currentData.structuredSections[i].sectionExplanation[lang] = translation.sectionTranslations[i].sectionExplanation;
          }
        }
        
        // Save after each language
        await saveIncrementally();
        console.log(`  💾 Saved ${lang} sections translations`);
      }
    }
    
    // Use existing sections translations for languages that don't need translation
    if (existingData && existingData.structuredSections) {
      for (const lang of SUPPORTED_LANGUAGES) {
        if (!languagesNeedingSections.includes(lang)) {
          // Extract existing translations for this language
          for (let i = 0; i < existingData.structuredSections.length; i++) {
            currentData.structuredSections[i].title[lang] = existingData.structuredSections[i].title[lang];
            currentData.structuredSections[i].sectionExplanation[lang] = existingData.structuredSections[i].sectionExplanation[lang];
          }
        }
      }
    }
    
    // Final save
    await saveIncrementally();
    console.log(`  💾 Saved final song file: ${finalPath}`);
    console.log(`  ✅ Translation complete!`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error:`, error);
    if (error instanceof Error) {
      console.error(`     ${error.message}`);
    }
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const cleanSlate = args.includes('--clean-slate');
  const skipExisting = !cleanSlate;
  const videoId = args.find(arg => !arg.startsWith('--'));
  
  if (!videoId) {
    console.error('❌ Error: Video ID is required.');
    console.error('   Usage: npx ts-node scripts/translate-song.ts <VIDEO_ID> [--clean-slate]');
    process.exit(1);
  }
  
  const success = await translateVideo(videoId, skipExisting);
  process.exit(success ? 0 : 1);
}

main();

