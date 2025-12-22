import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { Innertube } from 'youtubei.js';

const execAsync = promisify(exec);

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
// In Docker, scripts are at /app/scripts, data is at /app/data
// Locally, everything is relative to scripts directory
const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'production';
const BASE_DIR = isDocker ? '/app' : path.resolve(__dirname, '..');

const YOUTUBE_VIDEOS_DIR = path.join(BASE_DIR, 'data', 'youtube-videos');
const RAW_LYRICS_DIR = path.join(BASE_DIR, 'data', 'raw-lyrics');
const TRANSCRIBED_LYRICS_DIR = path.join(BASE_DIR, 'data', 'transcribed-lyrics');

interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
}

interface WhisperResponse {
  segments?: Array<{
    text: string;
    start: number;
    end: number;
  }>;
  text?: string;
}

/**
 * Check if yt-dlp is installed
 */
async function checkYtDlp(): Promise<boolean> {
  try {
    await execAsync('which yt-dlp');
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if video already downloaded
 */
async function isVideoDownloaded(videoId: string): Promise<string | null> {
  try {
    const outputDir = path.join(YOUTUBE_VIDEOS_DIR, videoId);
    const files = await fs.readdir(outputDir);
    const audioFile = files.find(f => f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp3') || f.endsWith('.opus'));
    return audioFile ? path.join(outputDir, audioFile) : null;
  } catch {
    return null;
  }
}

/**
 * Download video using yt-dlp (audio only)
 */
async function downloadVideo(videoId: string): Promise<string> {
  const outputDir = path.join(YOUTUBE_VIDEOS_DIR, videoId);
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${videoId}.%(ext)s`);
  
  console.log(`  📥 Downloading audio...`);
  
  // Download audio only
  // Use m4a for smaller files (better for OpenAI API 25MB limit)
  const audioFormat = 'm4a';
  const command = `yt-dlp -x --audio-format ${audioFormat} -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr && !stderr.includes('WARNING')) {
      console.warn(`  ⚠️  Warnings: ${stderr}`);
    }
    
    // Find the downloaded file
    const files = await fs.readdir(outputDir);
    const audioFile = files.find(f => f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp3') || f.endsWith('.opus'));
    
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
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithOpenAIWhisper(audioFilePath: string, language?: string): Promise<WhisperResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  console.log(`  🎤 Transcribing with OpenAI Whisper...`);
  
  const FormData = (global as any).FormData || require('form-data');
  const formData = new FormData();
  
  const fileStream = await fs.readFile(audioFilePath);
  const blob = new Blob([fileStream]);
  formData.append('file', blob, path.basename(audioFilePath));
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  if (language) {
    formData.append('language', language);
  }
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
  };
  
  if (formData.getHeaders) {
    Object.assign(headers, formData.getHeaders());
  }
  
  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: headers,
    body: formData as any,
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI Whisper API error: ${response.status} ${errorText}`);
  }
  
  return await response.json() as WhisperResponse;
}

/**
 * Convert Whisper segments to our format (with ms timestamps)
 */
function convertToLyricSegments(whisperResponse: WhisperResponse): Array<{ text: string; start_ms: number; end_ms: number }> {
  if (!whisperResponse.segments || whisperResponse.segments.length === 0) {
    // Fallback: if no segments, create one from full text
    if (whisperResponse.text) {
      return [{
        text: whisperResponse.text,
        start_ms: 0,
        end_ms: 0, // Unknown duration
      }];
    }
    throw new Error('No transcription segments found');
  }
  
  return whisperResponse.segments.map(seg => ({
    text: seg.text.trim(),
    start_ms: Math.round(seg.start * 1000), // Convert seconds to milliseconds
    end_ms: Math.round(seg.end * 1000),
  })).filter(seg => seg.text.length > 0);
}

/**
 * Get video metadata
 */
async function getVideoMetadata(videoId: string) {
  try {
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);
    return {
      title: videoInfo.basic_info.title || 'Unknown Title',
      artist: videoInfo.basic_info.author || 'Unknown Artist',
      thumbnailUrl: videoInfo.basic_info.thumbnail?.pop()?.url || '',
    };
  } catch (e) {
    console.warn(`  ⚠️  Could not fetch metadata:`, e);
    return {
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      thumbnailUrl: '',
    };
  }
}

/**
 * Process a single video: download and transcribe
 */
async function processVideo(videoId: string, language: string = 'es', skipExisting: boolean = true): Promise<boolean> {
  console.log(`\n🎵 Processing: ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    const rawLyricsPath = path.join(RAW_LYRICS_DIR, `${videoId}.json`);
    const transcribedPath = path.join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
    
    // 1. Check if transcribed-lyrics already exists
    let shouldSkipDownloadTranscribe = false;
    if (skipExisting) {
      try {
        await fs.access(transcribedPath);
        console.log(`  ⏭️  Transcribed lyrics already exist, skipping download/transcribe...`);
        shouldSkipDownloadTranscribe = true;
      } catch {
        // File doesn't exist, continue
      }
    }
    
    // 2. Only download/transcribe if we need to
    if (!shouldSkipDownloadTranscribe) {
      let lyricSegments: Array<{ text: string; start_ms: number; end_ms: number }>;
      
      // 2a. Check if raw-lyrics exists - if so, use it instead of downloading/transcribing
      try {
        const rawContent = await fs.readFile(rawLyricsPath, 'utf-8');
        lyricSegments = JSON.parse(rawContent);
        console.log(`  📖 Found existing raw-lyrics, using it (${lyricSegments.length} segments)`);
        console.log(`  ⏭️  Skipping download and transcription`);
      } catch {
        // No raw-lyrics, need to download and transcribe
        // Download (or use existing)
        let audioFilePath: string | null = await isVideoDownloaded(videoId);
        if (!audioFilePath) {
          audioFilePath = await downloadVideo(videoId);
          console.log(`  ✅ Downloaded: ${path.basename(audioFilePath)}`);
        } else {
          console.log(`  ⏭️  Using existing audio: ${path.basename(audioFilePath)}`);
        }
        
        // Transcribe with OpenAI Whisper
        const whisperResponse = await transcribeWithOpenAIWhisper(audioFilePath, language);
        
        // Convert to our format
        lyricSegments = convertToLyricSegments(whisperResponse);
        console.log(`  ✅ Transcribed ${lyricSegments.length} segments`);
        
        // Save to raw-lyrics format (for compatibility with existing scripts)
        await fs.mkdir(RAW_LYRICS_DIR, { recursive: true });
        await fs.writeFile(rawLyricsPath, JSON.stringify(lyricSegments, null, 2));
        console.log(`  💾 Saved raw lyrics: ${rawLyricsPath}`);
      }
      
      // 3. Get metadata
      const metadata = await getVideoMetadata(videoId);
      
      // 4. Save with metadata to transcribed-lyrics
      await fs.mkdir(TRANSCRIBED_LYRICS_DIR, { recursive: true });
      const transcribedData = {
        videoId,
        ...metadata,
        language: language || 'auto',
        segments: lyricSegments,
        transcribedAt: new Date().toISOString(),
      };
      await fs.writeFile(transcribedPath, JSON.stringify(transcribedData, null, 2));
      console.log(`  💾 Saved transcribed data: ${transcribedPath}`);
    }
    
    // 7. Call analyze-song.ts script (if it exists)
    const analyzeScript = isDocker 
      ? '/app/scripts/analyze-song.ts'
      : path.join(__dirname, 'analyze-song.ts');
    try {
      await fs.access(analyzeScript);
      // Script exists, run it
      console.log(`  🔍 Starting analysis...`);
      
      // Find tsx executable (same logic as server uses)
      const serverNodeModules = isDocker 
        ? '/app/node_modules'
        : path.resolve(__dirname, '../../server/node_modules');
      const contentGenNodeModules = isDocker 
        ? '/app/content-generation-node_modules'
        : path.resolve(__dirname, '../node_modules');
      
      const serverTsx = path.join(serverNodeModules, '.bin', 'tsx');
      const contentGenTsx = path.join(contentGenNodeModules, '.bin', 'tsx');
      
      // Use tsx (handles ESM better than ts-node)
      let tsxPath: string;
      try {
        await fs.access(serverTsx);
        tsxPath = serverTsx;
      } catch {
        try {
          await fs.access(contentGenTsx);
          tsxPath = contentGenTsx;
        } catch {
          // Fallback to npx tsx
          tsxPath = 'npx';
        }
      }
      
      return new Promise((resolve) => {
        const analyzeArgs = tsxPath === 'npx' 
          ? ['--yes', 'tsx', analyzeScript, videoId]
          : [analyzeScript, videoId];
        
        if (!skipExisting) {
          analyzeArgs.push('--clean-slate');
        }
        
        const analyzeProcess = spawn(
          tsxPath === 'npx' ? 'npx' : tsxPath,
          analyzeArgs,
          {
            cwd: isDocker ? '/app/scripts' : __dirname,
            stdio: 'inherit',
            shell: true,
            env: { ...process.env, DOCKER: isDocker ? 'true' : undefined }
          }
        );
        
        analyzeProcess.on('close', (code: number) => {
          if (code === 0) {
            console.log(`  ✅ Analysis complete!`);
            resolve(true);
          } else {
            console.error(`  ❌ Analysis failed with code ${code}`);
            resolve(false);
          }
        });
        
        analyzeProcess.on('error', (error: Error) => {
          console.error(`  ❌ Failed to start analysis: ${error.message}`);
          resolve(false);
        });
      });
    } catch {
      // Script doesn't exist, skip silently
      console.log(`  ⏭️  Analysis script not found, skipping...`);
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
  // Parse arguments
  const args = process.argv.slice(2);
  const cleanSlate = args.includes('--clean-slate');
  const skipExisting = !cleanSlate; // Default to true, unless --clean-slate is used
  
  // Find language from --lang= flag or positional arg
  let language = 'es'; // Default
  const langFlag = args.find(arg => arg.startsWith('--lang='));
  if (langFlag) {
    language = langFlag.split('=')[1];
  }
  
  // Find video ID (11 alphanumeric characters, not a flag)
  const videoId = args.find(arg => 
    !arg.startsWith('--') && 
    arg.length === 11 && 
    /^[a-zA-Z0-9_-]+$/.test(arg)
  );
  
  // If no video ID but there's a positional arg that's 2-3 chars, it might be language
  if (!videoId && !langFlag) {
    const langArg = args.find(arg => !arg.startsWith('--') && arg.length >= 2 && arg.length <= 3);
    if (langArg) {
      language = langArg;
    }
  }
  
  if (!videoId) {
    console.error('❌ Error: Video ID is required.');
    console.error('   Usage: npx ts-node scripts/download-and-transcribe.ts <VIDEO_ID> [--lang=es] [--clean-slate]');
    process.exit(1);
  }
  
  // Check for yt-dlp
  const hasYtDlp = await checkYtDlp();
  if (!hasYtDlp) {
    console.error('❌ Error: yt-dlp is not installed.');
    console.error('   Install it with: pip install yt-dlp');
    console.error('   Or: brew install yt-dlp');
    process.exit(1);
  }
  
  // Check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set.');
    process.exit(1);
  }
  
  // Process single video
  console.log('🚀 Download & Transcribe Pipeline');
  console.log('═'.repeat(50));
  console.log(`🎵 Video ID: ${videoId}`);
  console.log(`🌐 Whisper API: OpenAI`);
  console.log(`🌍 Language: ${language}`);
  console.log(`⏭️  Skip existing: ${skipExisting ? 'Yes' : 'No (--clean-slate)'}`);
  console.log('═'.repeat(50));
  
  const success = await processVideo(videoId, language, skipExisting);
  process.exit(success ? 0 : 1);
}

main();

