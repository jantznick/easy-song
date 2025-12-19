import 'dotenv/config';
import { Innertube } from 'youtubei.js';
import fs from 'fs/promises';
import path from 'path';
import { createLLMClient, callLLM, getLLMConfigFromEnv } from './utils/llm-client';
import { checkSystemResources, formatSystemResources } from './utils/system-resources';

// --- Configuration ---
const RAW_LYRICS_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const PROMPT_PATH = path.resolve(__dirname, '../prompt.txt');
const EXAMPLES_DIR = path.resolve(__dirname, '../data/analysis-examples');

// Get LLM configuration
const llmConfig = getLLMConfigFromEnv();
const llmClient = createLLMClient(llmConfig);

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

/**
 * Load analysis examples for few-shot learning.
 * 
 * Place example JSON files in: backend/data/analysis-examples/
 * Each file should contain a complete analysis object matching the expected output format.
 * 
 * Example file structure (example-1.json):
 * {
 *   "analysis": [
 *     {
 *       "spanish": "Example Spanish lyric line",
 *       "english": "Example English translation",
 *       "explanation": "Example explanation of meaning, culture, or slang"
 *     },
 *     ...
 *   ]
 * }
 * 
 * The script will automatically load up to 5 examples to include in the prompt.
 * This helps the AI understand the desired format and quality level.
 * 
 * When to switch to RAG/MCP:
 * - If you have 10+ examples and want semantic search over them
 * - If examples are getting too large for context window
 * - If you need to dynamically select relevant examples based on song genre/theme
 * - If token costs become a concern (few-shot uses more tokens)
 */
async function loadAnalysisExamples(): Promise<string> {
  try {
    const files = await fs.readdir(EXAMPLES_DIR);
    const exampleFiles = files.filter(f => f.endsWith('.json')).sort();
    
    if (exampleFiles.length === 0) {
      console.log('No analysis examples found. Add examples to:', EXAMPLES_DIR);
      return '';
    }

    // Load up to 5 examples (to avoid token limits)
    // You can adjust this number based on your needs
    const maxExamples = 5;
    const examples: any[] = [];
    
    for (const file of exampleFiles.slice(0, maxExamples)) {
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

    console.log(`Loaded ${examples.length} analysis example(s) for few-shot learning.`);
    
    // Format examples as a string for the prompt
    return `\n\nHere are ${examples.length} example(s) of the analysis format I'm looking for:\n${JSON.stringify(examples, null, 2)}`;
  } catch (error) {
    // If directory doesn't exist, that's okay - examples are optional
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Error loading examples:', error);
    }
    return '';
  }
}

/**
 * Main function to generate the final song analysis.
 */
async function main() {
  const videoId = process.argv[2];
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    console.log("Usage: npx ts-node scripts/generate-analysis.ts <YOUTUBE_VIDEO_ID>");
    process.exit(1);
  }

  try {
    // 1. Read the structured lyrics file
    const rawLyricsPath = path.join(RAW_LYRICS_DIR, `${videoId}.json`);
    const lyricsFileContent = await fs.readFile(rawLyricsPath, 'utf-8');
    const structuredLyrics: LyricSegment[] = JSON.parse(lyricsFileContent);

    // 2. Read the prompt template
    const promptTemplate = await fs.readFile(PROMPT_PATH, 'utf-8');

    // 3. Get video metadata (title and artist)
    console.log(`Fetching metadata for ${videoId}...`);
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);
    const title = videoInfo.basic_info.title || 'Unknown Title';
    const artist = videoInfo.basic_info.author || 'Unknown Artist';
    // Extract the best available thumbnail URL
    const thumbnailUrl = videoInfo.basic_info.thumbnail?.pop()?.url || '';

    // 4. Format lyrics into a simple text block for the prompt
    const lyricsText = structuredLyrics.map(seg => seg.text).join('\n');

    // 5. Load examples for few-shot learning
    const examplesText = await loadAnalysisExamples();

    // 6. Build the final prompt
    let finalPrompt = promptTemplate
      .replace('[Song Title]', title)
      .replace('[Artist]', artist);
    
    finalPrompt = `${finalPrompt}${examplesText}\n\nHere are the lyrics to analyze:\n\n${lyricsText}`;

    // 7. Check system resources if using Ollama
    if (llmConfig.provider === 'ollama') {
      const resources = await checkSystemResources();
      console.log(formatSystemResources(resources));
      if (!resources.canRunLLM) {
        console.warn('⚠️  System resources may be insufficient. Proceeding anyway...');
      }
    }

    // 8. Call LLM API (OpenAI or Ollama)
    console.log(`Generating analysis with ${llmConfig.provider.toUpperCase()} (${llmConfig.model})...`);
    
    const llmResponse = await callLLM(
      llmClient,
      llmConfig.model,
      [
        { role: "system", content: "You are an expert in music history, linguistics, and cultural studies. Your task is to analyze song lyrics and provide detailed, structured explanations in JSON format as requested." },
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

    // 9. Combine AI analysis with our structured lyrics
    // Create a lookup map from the AI's analysis for robust matching
    const normalizeText = (text: string) => text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").toLowerCase();
    const analysisMap = new Map<string, { english: string, explanation: string | null }>();
    for (const item of analysisData.analysis) {
        analysisMap.set(normalizeText(item.spanish), { english: item.english, explanation: item.explanation });
    }

    // Iterate through our original, timestamped lyrics as the source of truth
    const finalLines = structuredLyrics.map(seg => {
        const analysis = analysisMap.get(normalizeText(seg.text));
        return {
            spanish: seg.text,
            english: analysis ? analysis.english : "...", // Use AI english or a placeholder
            explanation: analysis ? analysis.explanation : null,
            start_ms: seg.start_ms,
            end_ms: seg.end_ms,
        };
    });
    
    // For now, we will put all lines into a single "Main" section.
    // Structuring into verses/choruses can be a future enhancement.
    const finalSongData = {
        videoId: videoId,
        title: title,
        artist: artist,
        thumbnailUrl: thumbnailUrl,
        sections: [{
            title: "Lyrics",
            lines: finalLines,
        }],
    };


    // 10. Save the final, combined data
    await fs.mkdir(SONGS_DIR, { recursive: true });
    const outputPath = path.join(SONGS_DIR, `${videoId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(finalSongData, null, 2));

    console.log(`✅ Successfully generated and saved final song data to: ${outputPath}`);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
