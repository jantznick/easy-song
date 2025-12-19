import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Innertube } from 'youtubei.js';
import { createLLMClient, callLLM, getLLMConfigFromEnv } from './utils/llm-client';
import { translateText, SUPPORTED_LANGUAGES, SupportedLanguage } from './utils/translations';
import { convertTitleToI18n } from './utils/section-titles';

const execAsync = promisify(exec);

// --- Configuration ---
const INPUT_FILE = process.env.PIPELINE_INPUT_FILE || path.resolve(__dirname, '../data/toDownload.json');
const DOWNLOADS_DIR = path.resolve(__dirname, '../data/downloads');
const TRANSCRIPTIONS_DIR = path.resolve(__dirname, '../data/transcriptions');
const ANALYZED_DIR = path.resolve(__dirname, '../data/analyzed');
const FINAL_SONGS_DIR = path.resolve(__dirname, '../data/songs');
const FINAL_STUDY_DIR = path.resolve(__dirname, '../data/study');
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:8000';

interface VideoIdList {
  videoIds: string[];
}

interface TranscriptionSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

interface AnalysisLine {
  spanish: string;
  english: string;
  explanation: string | null;
}

interface AnalysisResponse {
  analysis: AnalysisLine[];
  sections?: Array<{
    title: string;
    sectionExplanation: string;
    lines: string[]; // Spanish lines in this section
  }>;
}

/**
 * Step 1: Download videos using yt-dlp
 */
async function downloadVideo(videoId: string): Promise<string> {
  const outputDir = path.join(DOWNLOADS_DIR, videoId);
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${videoId}.%(ext)s`);
  
  console.log(`  📥 Downloading video ${videoId}...`);
  
  const command = `yt-dlp -x --audio-format wav -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`  ⚠️  Download warnings: ${stderr}`);
    }
    
    // Find the downloaded file
    const files = await fs.readdir(outputDir);
    const audioFile = files.find(f => f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp3'));
    
    if (!audioFile) {
      throw new Error('Downloaded audio file not found');
    }
    
    return path.join(outputDir, audioFile);
  } catch (error) {
    console.error(`  ❌ Download failed:`, error);
    throw error;
  }
}

/**
 * Step 2: Transcribe with Whisper (with timestamps - YES, Whisper provides timestamps!)
 */
async function transcribeWithWhisper(audioFilePath: string, language?: string): Promise<TranscriptionSegment[]> {
  console.log(`  🎤 Transcribing with Whisper...`);
  
  const FormData = (global as any).FormData || require('form-data');
  const formData = new FormData();
  
  const audioBuffer = await fs.readFile(audioFilePath);
  const audioBlob = new Blob([audioBuffer]);
  formData.append('audio_file', audioBlob, path.basename(audioFilePath));
  
  if (language) {
    formData.append('language', language);
  }
  
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');
  
  const headers: Record<string, string> = {};
  if (formData.getHeaders) {
    Object.assign(headers, formData.getHeaders());
  }
  
  try {
    const response = await fetch(`${WHISPER_API_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      headers: headers,
      body: formData as any,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Whisper API error: ${response.status} ${errorText}`);
    }
    
    const result = await response.json();
    
    // Whisper provides timestamps in segments array
    if (!result.segments || result.segments.length === 0) {
      throw new Error('No transcription segments found');
    }
    
    return result.segments.map((seg: any) => ({
      text: seg.text.trim(),
      start_ms: Math.round(seg.start * 1000), // Convert seconds to milliseconds
      end_ms: Math.round(seg.end * 1000),
    })).filter((seg: TranscriptionSegment) => seg.text.length > 0);
  } catch (error) {
    console.error(`  ❌ Transcription failed:`, error);
    throw error;
  }
}

/**
 * Step 3: Analyze lyrics with AI (single language input, English output)
 */
async function analyzeLyrics(
  segments: TranscriptionSegment[],
  videoId: string
): Promise<{ analysis: AnalysisResponse; title: string; artist: string; thumbnailUrl: string }> {
  console.log(`  🤖 Analyzing lyrics with AI...`);
  
  const llmConfig = getLLMConfigFromEnv();
  const client = createLLMClient(llmConfig);
  
  // Get video metadata first
  let title = 'Unknown Title';
  let artist = 'Unknown Artist';
  let thumbnailUrl = '';
  
  try {
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);
    title = videoInfo.basic_info.title || 'Unknown Title';
    artist = videoInfo.basic_info.author || 'Unknown Artist';
    thumbnailUrl = videoInfo.basic_info.thumbnail?.pop()?.url || '';
  } catch (e) {
    console.warn(`  ⚠️  Could not fetch metadata:`, e);
  }
  
  const lyricsText = segments.map(seg => seg.text).join('\n');
  
  // Read prompt template
  const PROMPT_PATH = path.resolve(__dirname, '../prompt.txt');
  const promptTemplate = await fs.readFile(PROMPT_PATH, 'utf-8');
  
  // Load examples
  const EXAMPLES_DIR = path.resolve(__dirname, '../data/analysis-examples');
  let examplesText = '';
  try {
    const files = await fs.readdir(EXAMPLES_DIR);
    const exampleFiles = files.filter(f => f.endsWith('.json')).slice(0, 5);
    const examples: any[] = [];
    for (const file of exampleFiles) {
      const content = await fs.readFile(path.join(EXAMPLES_DIR, file), 'utf-8');
      examples.push(JSON.parse(content));
    }
    if (examples.length > 0) {
      examplesText = `\n\nHere are ${examples.length} example(s):\n${JSON.stringify(examples, null, 2)}`;
    }
  } catch {
    // Examples are optional
  }
  
  const finalPrompt = promptTemplate
    .replace('[Song Title]', title)
    .replace('[Artist]', artist)
    + examplesText
    + `\n\nHere are the lyrics to analyze:\n\n${lyricsText}`;
  
  const llmResponse = await callLLM(
    client,
    llmConfig.model,
    [
      {
        role: 'system',
        content: 'You are an expert in music history, linguistics, and cultural studies. Analyze song lyrics and provide detailed, structured explanations in JSON format. Include section structure if you can identify verses, choruses, etc.',
      },
      {
        role: 'user',
        content: finalPrompt,
      },
    ],
    {
      responseFormat: { type: 'json_object' },
      temperature: 0.7,
    }
  );
  
  const analysisData = JSON.parse(llmResponse.content);
  
  return {
    analysis: analysisData,
    title,
    artist,
    thumbnailUrl,
  };
}

/**
 * Step 4: Translate to all languages
 */
async function translateToAllLanguages(
  segments: TranscriptionSegment[],
  analysis: AnalysisResponse,
  videoId: string,
  title: string,
  artist: string,
  thumbnailUrl: string,
  sourceLanguage: string = 'es'
): Promise<{
  songs: any;
  study: any;
}> {
  console.log(`  🌍 Translating to all languages...`);
  
  // Create analysis map
  const normalizeText = (text: string) => text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g, '').toLowerCase();
  const analysisMap = new Map<string, { english: string; explanation: string | null }>();
  
  for (const item of analysis.analysis) {
    analysisMap.set(normalizeText(item.spanish), {
      english: item.english,
      explanation: item.explanation,
    });
  }
  
  // Translate explanations
  const explanationsToTranslate = Array.from(new Set(
    Array.from(analysisMap.values())
      .map(v => v.explanation)
      .filter((exp): exp is string => exp !== null && exp !== undefined)
  ));
  
  console.log(`  📝 Translating ${explanationsToTranslate.length} explanations...`);
  const translatedExplanations = await Promise.all(
    explanationsToTranslate.map(exp => translateText(exp, 'en', SUPPORTED_LANGUAGES.filter(l => l !== 'en') as SupportedLanguage[]))
  );
  
  const explanationTranslationMap = new Map<string, Record<string, string>>();
  explanationsToTranslate.forEach((exp, idx) => {
    explanationTranslationMap.set(exp, translatedExplanations[idx]);
  });
  
  // Build final lines with i18n
  const finalLines = segments.map(seg => {
    const analysis = analysisMap.get(normalizeText(seg.text));
    const explanation = analysis?.explanation || null;
    
    const explanationI18n: Record<string, string> | null = explanation
      ? {
          en: explanation,
          ...(explanationTranslationMap.get(explanation) || {}),
        }
      : null;
    
    return {
      es: seg.text, // Original (assuming Spanish)
      en: analysis ? analysis.english : '...',
      explanation: explanationI18n,
      start_ms: seg.start_ms,
      end_ms: seg.end_ms,
    };
  });
  
  // Build songs file
  const songsData = {
    videoId,
    title,
    artist,
    thumbnailUrl,
    sections: [
      {
        title: convertTitleToI18n('Lyrics'),
        lines: finalLines,
      },
    ],
  };
  
  // Build study file (if sections were identified)
  let studyData = null;
  if (analysis.sections && analysis.sections.length > 0) {
    // Translate section explanations
    const sectionExplanations = analysis.sections.map(s => s.sectionExplanation);
    const translatedSectionExplanations = await Promise.all(
      sectionExplanations.map(exp => translateText(exp, 'en', SUPPORTED_LANGUAGES.filter(l => l !== 'en') as SupportedLanguage[]))
    );
    
    const structuredSections = analysis.sections.map((section, idx) => ({
      title: convertTitleToI18n(section.title),
      sectionExplanation: {
        en: section.sectionExplanation,
        ...translatedSectionExplanations[idx],
      },
      lines: section.lines.map(lineText => {
        const seg = segments.find(s => normalizeText(s.text) === normalizeText(lineText));
        const analysisItem = analysisMap.get(normalizeText(lineText));
        const explanation = analysisItem?.explanation || null;
        
        const explanationI18n: Record<string, string> | null = explanation
          ? {
              en: explanation,
              ...(explanationTranslationMap.get(explanation) || {}),
            }
          : null;
        
        return {
          es: lineText,
          en: analysisItem ? analysisItem.english : '...',
          explanation: explanationI18n,
          start_ms: seg?.start_ms || 0,
          end_ms: seg?.end_ms || 0,
        };
      }),
    }));
    
    studyData = {
      videoId,
      title,
      artist,
      structuredSections,
    };
  }
  
  return {
    songs: songsData,
    study: studyData,
  };
}

/**
 * Main pipeline function
 */
async function processVideo(videoId: string, skipDownload: boolean = false): Promise<void> {
  console.log(`\n🎵 Processing video: ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    let audioFilePath: string;
    let segments: TranscriptionSegment[];
    
    // Step 1: Download (or skip if lyrics file exists)
    const transcriptionPath = path.join(TRANSCRIPTIONS_DIR, `${videoId}.json`);
    
    if (skipDownload || await fs.access(transcriptionPath).then(() => true).catch(() => false)) {
      console.log(`  ⏭️  Skipping download, using existing transcription`);
      const transcriptionData = JSON.parse(await fs.readFile(transcriptionPath, 'utf-8'));
      segments = transcriptionData.segments || transcriptionData;
    } else {
      audioFilePath = await downloadVideo(videoId);
      console.log(`  ✅ Downloaded: ${audioFilePath}`);
      
      // Step 2: Transcribe
      segments = await transcribeWithWhisper(audioFilePath, 'es'); // Assuming Spanish
      console.log(`  ✅ Transcribed ${segments.length} segments`);
      
      // Save transcription
      await fs.mkdir(TRANSCRIPTIONS_DIR, { recursive: true });
      await fs.writeFile(transcriptionPath, JSON.stringify(segments, null, 2));
      console.log(`  💾 Saved transcription: ${transcriptionPath}`);
    }
    
    // Step 3: Analyze
    const { analysis, title, artist, thumbnailUrl } = await analyzeLyrics(segments, videoId);
    console.log(`  ✅ Analyzed ${analysis.analysis.length} lines`);
    
    // Save analysis
    await fs.mkdir(ANALYZED_DIR, { recursive: true });
    const analysisPath = path.join(ANALYZED_DIR, `${videoId}.json`);
    await fs.writeFile(analysisPath, JSON.stringify({ analysis, title, artist, thumbnailUrl }, null, 2));
    console.log(`  💾 Saved analysis: ${analysisPath}`);
    
    // Step 4: Translate
    const { songs, study } = await translateToAllLanguages(segments, analysis, videoId, title, artist, thumbnailUrl);
    
    // Save final files
    await fs.mkdir(FINAL_SONGS_DIR, { recursive: true });
    await fs.mkdir(FINAL_STUDY_DIR, { recursive: true });
    
    const songsPath = path.join(FINAL_SONGS_DIR, `${videoId}.json`);
    await fs.writeFile(songsPath, JSON.stringify(songs, null, 2));
    console.log(`  ✅ Saved songs file: ${songsPath}`);
    
    if (study) {
      const studyPath = path.join(FINAL_STUDY_DIR, `${videoId}.json`);
      await fs.writeFile(studyPath, JSON.stringify(study, null, 2));
      console.log(`  ✅ Saved study file: ${studyPath}`);
    }
    
    console.log(`\n✅ Complete! Video ${videoId} processed successfully.`);
    
  } catch (error) {
    console.error(`\n❌ Error processing ${videoId}:`, error);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  const skipDownload = process.argv.includes('--skip-download');
  const singleVideoId = process.argv[2]; // If provided, process single video
  
  console.log('🚀 Full Pipeline: YouTube → Final i18n Files');
  console.log('═'.repeat(50));
  
  if (singleVideoId) {
    // Process single video
    await processVideo(singleVideoId, skipDownload);
  } else {
    // Process from input file
    console.log(`📄 Reading video IDs from: ${INPUT_FILE}`);
    
    try {
      const inputContent = await fs.readFile(INPUT_FILE, 'utf-8');
      const { videoIds }: VideoIdList = JSON.parse(inputContent);
      
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        throw new Error('Invalid input file: expected { "videoIds": [...] }');
      }
      
      console.log(`📋 Found ${videoIds.length} video(s) to process\n`);
      
      for (let i = 0; i < videoIds.length; i++) {
        const videoId = videoIds[i];
        console.log(`\n[${i + 1}/${videoIds.length}]`);
        await processVideo(videoId, skipDownload);
        
        // Small delay to avoid rate limiting
        if (i < videoIds.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`\n\n🎉 All ${videoIds.length} video(s) processed successfully!`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`\n❌ Input file not found: ${INPUT_FILE}`);
        console.error(`   Create a file with: { "videoIds": ["VIDEO_ID_1", "VIDEO_ID_2", ...] }`);
      } else {
        console.error(`\n❌ Error:`, error);
      }
      process.exit(1);
    }
  }
}

main();

