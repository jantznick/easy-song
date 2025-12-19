import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { Innertube } from 'youtubei.js';
import { createLLMClient, callLLM, getLLMConfigFromEnv, LLMConfig } from './utils/llm-client';
import { checkSystemResources, formatSystemResources, waitForResources } from './utils/system-resources';

// --- Configuration ---
const LYRICS_TO_ANALYZE_DIR = path.resolve(__dirname, '../data/lyrics-to-analyze');
const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const PROCESSED_LYRICS_DIR = path.resolve(__dirname, '../data/processed-lyrics');
const PROMPT_PATH = path.resolve(__dirname, '../prompt.txt');
const EXAMPLES_DIR = path.resolve(__dirname, '../data/analysis-examples');

// Get LLM configuration
const llmConfig = getLLMConfigFromEnv();
const llmClient = createLLMClient(llmConfig);

// System resource thresholds (adjust based on your system)
const MIN_FREE_MEMORY_MB = parseInt(process.env.MIN_FREE_MEMORY_MB || '1024'); // 1GB default
const MAX_MEMORY_USAGE_PERCENT = parseInt(process.env.MAX_MEMORY_USAGE_PERCENT || '85');

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

interface LanguageStats {
  [language: string]: {
    count: number;
    lastProcessed: string;
  };
}

const LANGUAGE_STATS_FILE = path.resolve(__dirname, '../data/language-stats.json');

/**
 * Load or create language statistics
 */
async function loadLanguageStats(): Promise<LanguageStats> {
  try {
    const statsContent = await fs.readFile(LANGUAGE_STATS_FILE, 'utf-8');
    return JSON.parse(statsContent);
  } catch {
    return {};
  }
}

/**
 * Update language statistics
 */
async function updateLanguageStats(language: string) {
  const stats = await loadLanguageStats();
  if (!stats[language]) {
    stats[language] = { count: 0, lastProcessed: '' };
  }
  stats[language].count += 1;
  stats[language].lastProcessed = new Date().toISOString();
  await fs.writeFile(LANGUAGE_STATS_FILE, JSON.stringify(stats, null, 2));
}

/**
 * Load analysis examples for few-shot learning
 */
async function loadAnalysisExamples(): Promise<string> {
  try {
    const files = await fs.readdir(EXAMPLES_DIR);
    const exampleFiles = files.filter(f => f.endsWith('.json'));
    
    if (exampleFiles.length === 0) {
      return '';
    }

    const examples: any[] = [];
    for (const file of exampleFiles.slice(0, 5)) { // Limit to 5 examples to avoid token limits
      try {
        const content = await fs.readFile(path.join(EXAMPLES_DIR, file), 'utf-8');
        const example = JSON.parse(content);
        examples.push(example);
      } catch (e) {
        console.warn(`Failed to load example ${file}:`, e);
      }
    }

    if (examples.length === 0) {
      return '';
    }

    // Format examples as a string for the prompt
    return `\n\nHere are some examples of the analysis format I'm looking for:\n${JSON.stringify(examples, null, 2)}`;
  } catch {
    return '';
  }
}

/**
 * Detect language from lyrics (simple heuristic - can be enhanced)
 */
function detectLanguage(text: string): string {
  // Simple heuristic - check for common Spanish words/patterns
  const spanishPatterns = /\b(y|el|la|los|las|de|que|en|un|una|es|son|con|por|para|más|muy|todo|todos|toda|todas|este|esta|estos|estas|ese|esa|esos|esas|aquel|aquella|aquellos|aquellas|yo|tú|él|ella|nosotros|vosotros|ellos|ellas)\b/i;
  const hasSpanish = spanishPatterns.test(text);
  
  if (hasSpanish) {
    return 'es';
  }
  
  // Add more language detection logic here
  return 'unknown';
}

/**
 * Process a single lyrics file
 */
async function processLyricsFile(filePath: string) {
  const fileName = path.basename(filePath);
  const videoId = fileName.replace('.json', '');
  
  console.log(`\n=== Processing ${fileName} ===`);
  
  try {
    // 1. Read the lyrics file
    const lyricsContent = await fs.readFile(filePath, 'utf-8');
    const structuredLyrics: LyricSegment[] = JSON.parse(lyricsContent);
    
    // 2. Detect language
    const sampleText = structuredLyrics.slice(0, 10).map(s => s.text).join(' ');
    const detectedLanguage = detectLanguage(sampleText);
    console.log(`Detected language: ${detectedLanguage}`);
    
    // 3. Read the prompt template
    const promptTemplate = await fs.readFile(PROMPT_PATH, 'utf-8');
    
    // 4. Get video metadata (if videoId is valid)
    let title = 'Unknown Title';
    let artist = 'Unknown Artist';
    let thumbnailUrl = '';
    
    try {
      console.log(`Fetching metadata for ${videoId}...`);
      const youtube = await Innertube.create();
      const videoInfo = await youtube.getInfo(videoId);
      title = videoInfo.basic_info.title || 'Unknown Title';
      artist = videoInfo.basic_info.author || 'Unknown Artist';
      thumbnailUrl = videoInfo.basic_info.thumbnail?.pop()?.url || '';
    } catch (e) {
      console.warn(`Could not fetch metadata for ${videoId}, using defaults:`, e);
    }
    
    // 5. Format lyrics into text block
    const lyricsText = structuredLyrics.map(seg => seg.text).join('\n');
    
    // 6. Load examples for few-shot learning
    const examplesText = await loadAnalysisExamples();
    
    // 7. Build the final prompt
    let finalPrompt = promptTemplate
      .replace('[Song Title]', title)
      .replace('[Artist]', artist);
    
    finalPrompt = `${finalPrompt}${examplesText}\n\nHere are the lyrics to analyze:\n\n${lyricsText}`;
    
    // 8. Call LLM API (OpenAI or Ollama)
    console.log(`Generating analysis with ${llmConfig.provider.toUpperCase()} (${llmConfig.model})...`);
    
    const llmResponse = await callLLM(
      llmClient,
      llmConfig.model,
      [
        { 
          role: "system", 
          content: "You are an expert in music history, linguistics, and cultural studies. Your task is to analyze song lyrics and provide detailed, structured explanations in JSON format as requested." 
        },
        { role: "user", content: finalPrompt }
      ],
      {
        responseFormat: { type: "json_object" },
        temperature: 0.7,
      }
    );
    
    const analysisData = JSON.parse(llmResponse.content);
    
    if (llmResponse.usage) {
      console.log(`   Tokens used: ${llmResponse.usage.total_tokens} (prompt: ${llmResponse.usage.prompt_tokens}, completion: ${llmResponse.usage.completion_tokens})`);
    }
    
    // 9. Combine AI analysis with structured lyrics
    const normalizeText = (text: string) => text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").toLowerCase();
    const analysisMap = new Map<string, { english: string, explanation: string | null }>();
    
    for (const item of analysisData.analysis) {
      analysisMap.set(normalizeText(item.spanish), { 
        english: item.english, 
        explanation: item.explanation 
      });
    }
    
    const finalLines = structuredLyrics.map(seg => {
      const analysis = analysisMap.get(normalizeText(seg.text));
      return {
        spanish: seg.text,
        english: analysis ? analysis.english : "...",
        explanation: analysis ? analysis.explanation : null,
        start_ms: seg.start_ms,
        end_ms: seg.end_ms,
      };
    });
    
    const finalSongData = {
      videoId: videoId,
      title: title,
      artist: artist,
      thumbnailUrl: thumbnailUrl,
      language: detectedLanguage,
      sections: [{
        title: "Lyrics",
        lines: finalLines,
      }],
    };
    
    // 10. Save the final data
    await fs.mkdir(SONGS_DIR, { recursive: true });
    const outputPath = path.join(SONGS_DIR, `${videoId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(finalSongData, null, 2));
    
    // 11. Move processed file
    await fs.mkdir(PROCESSED_LYRICS_DIR, { recursive: true });
    const processedPath = path.join(PROCESSED_LYRICS_DIR, fileName);
    await fs.rename(filePath, processedPath);
    
    // 12. Update language stats
    await updateLanguageStats(detectedLanguage);
    
    console.log(`✅ Successfully processed and saved to: ${outputPath}`);
    console.log(`   Moved lyrics file to: ${processedPath}`);
    
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
    // Move to error folder instead of deleting
    const errorDir = path.resolve(__dirname, '../data/lyrics-errors');
    await fs.mkdir(errorDir, { recursive: true });
    const errorPath = path.join(errorDir, fileName);
    await fs.rename(filePath, errorPath).catch(() => {});
    console.log(`   Moved to error folder: ${errorPath}`);
  }
}

/**
 * Main function to process all lyrics files in the folder
 */
async function main() {
  const watchMode = process.argv.includes('--watch');
  const checkResources = !process.argv.includes('--skip-resource-check');
  const waitForResourcesFlag = process.argv.includes('--wait-for-resources');
  
  console.log('=== Lyrics Folder Processor ===');
  console.log(`LLM Provider: ${llmConfig.provider.toUpperCase()}`);
  console.log(`Model: ${llmConfig.model}`);
  console.log(`Watching folder: ${LYRICS_TO_ANALYZE_DIR}`);
  
  // Check system resources if using Ollama
  if (llmConfig.provider === 'ollama' && checkResources) {
    console.log('\n=== Checking System Resources ===');
    const resources = await checkSystemResources(MIN_FREE_MEMORY_MB, MAX_MEMORY_USAGE_PERCENT);
    console.log(formatSystemResources(resources));
    
    if (!resources.canRunLLM) {
      if (waitForResourcesFlag) {
        console.log('\n⏳ Waiting for system resources to become available...');
        const available = await waitForResources(60000, 3600000, MIN_FREE_MEMORY_MB, MAX_MEMORY_USAGE_PERCENT);
        if (!available) {
          console.error('❌ Could not acquire system resources. Exiting.');
          process.exit(1);
        }
      } else {
        console.warn('\n⚠️  System resources may be insufficient for LLM processing.');
        console.warn('   Consider using --wait-for-resources to wait, or --skip-resource-check to proceed anyway.');
        if (!process.stdin.isTTY) {
          // Non-interactive mode - just warn and continue
          console.warn('   Non-interactive mode: proceeding anyway...');
        } else {
          const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout
          });
          const answer = await new Promise<string>(resolve => {
            readline.question('Continue anyway? (y/N): ', resolve);
          });
          readline.close();
          if (answer.toLowerCase() !== 'y') {
            console.log('Exiting.');
            process.exit(0);
          }
        }
      }
    }
  }
  
  // Ensure directories exist
  await fs.mkdir(LYRICS_TO_ANALYZE_DIR, { recursive: true });
  await fs.mkdir(EXAMPLES_DIR, { recursive: true });
  
  const processAllFiles = async () => {
    try {
      const files = await fs.readdir(LYRICS_TO_ANALYZE_DIR);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      if (jsonFiles.length === 0) {
        console.log('No lyrics files found to process.');
        return;
      }
      
      console.log(`Found ${jsonFiles.length} file(s) to process.`);
      
      for (const file of jsonFiles) {
        const filePath = path.join(LYRICS_TO_ANALYZE_DIR, file);
        await processLyricsFile(filePath);
      }
      
      // Display language stats
      const stats = await loadLanguageStats();
      if (Object.keys(stats).length > 0) {
        console.log('\n=== Language Statistics ===');
        for (const [lang, data] of Object.entries(stats)) {
          console.log(`${lang}: ${data.count} songs (last: ${new Date(data.lastProcessed).toLocaleString()})`);
        }
      }
      
    } catch (error) {
      console.error('Error processing files:', error);
    }
  };
  
  // Process immediately
  await processAllFiles();
  
  // If watch mode, set up file watcher
  if (watchMode) {
    console.log('\n🔄 Watch mode enabled. Monitoring for new files...');
    
    // Simple polling approach (can be enhanced with chokidar if needed)
    setInterval(async () => {
      await processAllFiles();
    }, 30000); // Check every 30 seconds
  }
}

main();

