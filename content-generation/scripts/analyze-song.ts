import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import { z } from 'zod';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
const TRANSCRIBED_LYRICS_DIR = path.resolve(__dirname, '../data/transcribed-lyrics');
const ANALYZED_LYRICS_DIR = path.resolve(__dirname, '../data/analyzed-lyrics');
const PROMPT_TEMPLATE_PATH = path.resolve(__dirname, '../prompt-analyze.txt');
const ANALYSIS_EXAMPLES_DIR = path.resolve(__dirname, '../data/analysis-examples');
const STRUCTURE_EXAMPLES_DIR = path.resolve(__dirname, '../data/structure-examples');

interface TranscribedSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

interface TranscribedData {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  language: string;
  segments: TranscribedSegment[];
  transcribedAt?: string;
}

interface AnalyzedLyric {
  text: string;
  start_ms: number;
  end_ms: number;
  explanation: string | null;
}

interface StructuredSection {
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
  structuredSections: StructuredSection[];
}

// Zod schema for structured output
const AnalyzedLyricSchema = z.object({
  text: z.string(),
  start_ms: z.number(),
  end_ms: z.number(),
  explanation: z.string().nullable(),
});

const StructuredSectionSchema = z.object({
  title: z.string(),
  sectionExplanation: z.string(),
  start_ms: z.number(),
  end_ms: z.number(),
});

const AnalysisResponseSchema = z.object({
  lyrics: z.array(AnalyzedLyricSchema),
  structuredSections: z.array(StructuredSectionSchema),
});

type OpenAIResponse = z.infer<typeof AnalysisResponseSchema>;

/**
 * Load prompt template and replace placeholders
 */
async function loadPromptTemplate(title: string, artist: string): Promise<string> {
  const template = await fs.readFile(PROMPT_TEMPLATE_PATH, 'utf-8');
  return template
    .replace('[Song Title]', title)
    .replace('[Artist]', artist);
}

/**
 * Load all example files for few-shot learning
 */
async function loadExamples(): Promise<{ analysisExamples: any[]; structureExamples: any[] }> {
  const analysisExamples: any[] = [];
  const structureExamples: any[] = [];
  
  try {
    // Load all .json files from analysis-examples directory
    const analysisFiles = await fs.readdir(ANALYSIS_EXAMPLES_DIR);
    for (const file of analysisFiles) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(ANALYSIS_EXAMPLES_DIR, file), 'utf-8');
          const parsed = JSON.parse(content);
          analysisExamples.push(parsed);
        } catch (e) {
          console.warn(`  ⚠️  Could not load analysis example ${file}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }
    }
  } catch (e) {
    console.warn(`  ⚠️  Could not read analysis-examples directory: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  
  try {
    // Load all .json files from structure-examples directory
    const structureFiles = await fs.readdir(STRUCTURE_EXAMPLES_DIR);
    for (const file of structureFiles) {
      if (file.endsWith('.json')) {
        try {
          const content = await fs.readFile(path.join(STRUCTURE_EXAMPLES_DIR, file), 'utf-8');
          const parsed = JSON.parse(content);
          structureExamples.push(parsed);
        } catch (e) {
          console.warn(`  ⚠️  Could not load structure example ${file}: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
      }
    }
  } catch (e) {
    console.warn(`  ⚠️  Could not read structure-examples directory: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
  
  return { analysisExamples, structureExamples };
}

/**
 * Build the full prompt with examples and lyrics
 */
function buildPrompt(
  promptTemplate: string,
  segments: TranscribedSegment[],
  analysisExamples: any[],
  structureExamples: any[]
): string {
  let prompt = promptTemplate;
  
  // Add examples section
  if (analysisExamples.length > 0 || structureExamples.length > 0) {
    prompt += '\n\n## Examples\n\n';
    
    if (analysisExamples.length > 0) {
      prompt += '### Examples: Line-by-line explanations\n';
      for (let i = 0; i < analysisExamples.length; i++) {
        prompt += `#### Example ${i + 1}\n`;
        prompt += '```json\n';
        prompt += JSON.stringify(analysisExamples[i], null, 2);
        prompt += '\n```\n\n';
      }
    }
    
    if (structureExamples.length > 0) {
      prompt += '### Examples: Structured sections\n';
      for (let i = 0; i < structureExamples.length; i++) {
        prompt += `#### Example ${i + 1}\n`;
        prompt += '```json\n';
        prompt += JSON.stringify(structureExamples[i], null, 2);
        prompt += '\n```\n\n';
      }
    }
  }
  
  // Add the actual lyrics to analyze
  prompt += '\n## Lyrics to Analyze\n\n';
  prompt += '```json\n';
  prompt += JSON.stringify({ segments }, null, 2);
  prompt += '\n```\n\n';
  
  prompt += 'Please analyze these lyrics and provide your response in the exact JSON format specified above.';
  
  return prompt;
}

/**
 * Call OpenAI API to analyze lyrics using structured output
 */
async function analyzeWithOpenAI(
  prompt: string
): Promise<OpenAIResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  console.log(`  🤖 Calling OpenAI API for analysis...`);
  
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  
  try {
    const completion = await openai.beta.chat.completions.parse({
      model: 'gpt-4o-2024-08-06',
      messages: [
        {
          role: 'system',
          content: 'You are a music lyric analyst. You analyze song lyrics and provide detailed explanations of meaning, cultural context, and slang. You also identify song sections (Intro, Verse, Chorus, etc.) and provide section-level explanations. Always respond with valid JSON in the exact format specified.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: zodResponseFormat(AnalysisResponseSchema, 'analysis_response'),
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
      
      console.log(`  📊 Token usage - Request: ${inputTokens.toLocaleString()}, Response: ${outputTokens.toLocaleString()}, Total: ${totalTokens.toLocaleString()}`);
      console.log(`  💰 Cost - Input: $${inputCost.toFixed(4)}, Output: $${outputCost.toFixed(4)}, Total: $${totalCost.toFixed(4)}`);
    }
    
    // Get parsed content (structured output automatically parses and validates)
    const parsed = completion.choices[0]?.message?.parsed;
    if (!parsed) {
      throw new Error('No parsed content in OpenAI response');
    }
    
    // Validate with zod schema (should already be validated by structured output, but double-check)
    const validated = AnalysisResponseSchema.parse(parsed);
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('  ⚠️  Zod validation error:', error.errors);
      throw new Error(`Response validation failed: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Process a single video: analyze lyrics
 */
async function analyzeVideo(videoId: string, skipExisting: boolean = true): Promise<boolean> {
  console.log(`\n🔍 Analyzing: ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    const analyzedPath = path.join(ANALYZED_LYRICS_DIR, `${videoId}.json`);
    
    // Check if analyzed-lyrics already exists
    let shouldCreate = true;
    if (skipExisting) {
      try {
        await fs.access(analyzedPath);
        console.log(`  ⏭️  Analyzed lyrics already exist, skipping analysis...`);
        shouldCreate = false;
      } catch {
        // File doesn't exist, continue to create it
      }
    }
    
    // Create analysis file if needed
    if (shouldCreate) {
      console.log(`  📝 Creating analysis file...`);
      
      // Read transcribed-lyrics
      const transcribedPath = path.join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
      let transcribedData: TranscribedData;
      
      try {
        const transcribedContent = await fs.readFile(transcribedPath, 'utf-8');
        transcribedData = JSON.parse(transcribedContent);
      } catch (e) {
        throw new Error(`Could not read transcribed-lyrics: ${e instanceof Error ? e.message : 'Unknown error'}`);
      }
      
      // Extract metadata
      const metadata = {
        videoId: transcribedData.videoId || videoId,
        title: transcribedData.title || 'Unknown Title',
        artist: transcribedData.artist || 'Unknown Artist',
        thumbnailUrl: transcribedData.thumbnailUrl || '',
        originalLanguage: transcribedData.language || 'es',
      };
      
      // Load prompt template and examples
      const [promptTemplate, examples] = await Promise.all([
        loadPromptTemplate(metadata.title, metadata.artist),
        loadExamples(),
      ]);
      
      // Build the full prompt
      const fullPrompt = buildPrompt(
        promptTemplate,
        transcribedData.segments,
        examples.analysisExamples,
        examples.structureExamples
      );
      
      // Call OpenAI API
      const analysisResult = await analyzeWithOpenAI(fullPrompt);
      
      // Combine metadata with analysis results
      const analyzedData: AnalyzedData = {
        ...metadata,
        lyrics: analysisResult.lyrics,
        structuredSections: analysisResult.structuredSections,
      };
      
      // Save analyzed data
      await fs.mkdir(ANALYZED_LYRICS_DIR, { recursive: true });
      await fs.writeFile(analyzedPath, JSON.stringify(analyzedData, null, 2));
      console.log(`  💾 Saved analyzed data: ${analyzedPath}`);
    }
    
    // Call translate-song.ts script (if it exists)
    const translateScript = path.join(__dirname, 'translate-song.ts');
    try {
      await fs.access(translateScript);
      // Script exists, run it
      console.log(`  🌍 Starting translation...`);
      
      return new Promise((resolve) => {
        const translateArgs = [translateScript, videoId];
        if (!skipExisting) {
          translateArgs.push('--clean-slate');
        }
        const translateProcess = spawn('npx', ['ts-node', ...translateArgs], {
          cwd: __dirname,
          stdio: 'inherit',
          shell: true
        });
        
        translateProcess.on('close', (code: number) => {
          if (code === 0) {
            resolve(true);
          } else {
            console.error(`  ❌ Translation failed with code ${code}`);
            resolve(false);
          }
        });
        
        translateProcess.on('error', (error: Error) => {
          console.error(`  ❌ Failed to start translation: ${error.message}`);
          resolve(false);
        });
      });
    } catch {
      // Script doesn't exist, skip silently
      console.log(`  ⏭️  Translation script not found, skipping...`);
      return true;
    }
    
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
    console.error('   Usage: npx ts-node scripts/analyze-song.ts <VIDEO_ID> [--clean-slate]');
    process.exit(1);
  }
  
  const success = await analyzeVideo(videoId, skipExisting);
  process.exit(success ? 0 : 1);
}

main();

