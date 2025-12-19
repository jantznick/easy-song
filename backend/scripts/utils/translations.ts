import OpenAI from 'openai';
import { getLLMConfigFromEnv, createLLMClient } from './llm-client';

/**
 * Supported languages for translations
 */
export const SUPPORTED_LANGUAGES = ['en', 'es', 'zh', 'fr', 'de', 'it'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Translate text to multiple languages using OpenAI
 */
export async function translateText(
  text: string,
  sourceLanguage: string = 'en',
  targetLanguages: SupportedLanguage[] = ['es', 'zh', 'fr', 'de', 'it']
): Promise<Record<string, string>> {
  if (!text || text.trim().length === 0) {
    return {};
  }

  const llmConfig = getLLMConfigFromEnv();
  const client = createLLMClient(llmConfig);

  // For OpenAI, we can use the translation API or chat completion
  // For Ollama, we'll use chat completion with translation prompt
  
  const translations: Record<string, string> = {
    [sourceLanguage]: text, // Original language
  };

  // If source is already in target languages, skip translation
  const languagesToTranslate = targetLanguages.filter(lang => lang !== sourceLanguage);
  
  if (languagesToTranslate.length === 0) {
    return translations;
  }

  // Batch translate to all target languages at once
  const prompt = `Translate the following text from ${sourceLanguage} to these languages: ${languagesToTranslate.join(', ')}.

Text to translate: "${text}"

Respond with a JSON object where keys are language codes and values are translations:
{
  "es": "translation in Spanish",
  "fr": "translation in French",
  ...
}

Only include the JSON object, no other text.`;

  try {
    const response = await client.chat.completions.create({
      model: llmConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate accurately while preserving meaning and context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent translations
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const translated = JSON.parse(content);
      Object.assign(translations, translated);
    }
  } catch (error) {
    console.warn(`Translation failed for text: "${text.substring(0, 50)}..."`, error);
    // Fallback: return original text for all languages
    languagesToTranslate.forEach(lang => {
      translations[lang] = text;
    });
  }

  return translations;
}

/**
 * Translate multiple texts in batch (more efficient)
 */
export async function translateBatch(
  texts: string[],
  sourceLanguage: string = 'en',
  targetLanguages: SupportedLanguage[] = ['es', 'zh', 'fr', 'de', 'it']
): Promise<Record<string, string>[]> {
  // For now, translate one by one
  // Could be optimized to batch multiple translations in one API call
  const results = await Promise.all(
    texts.map(text => translateText(text, sourceLanguage, targetLanguages))
  );
  return results;
}

