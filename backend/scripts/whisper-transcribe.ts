import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { Innertube } from 'youtubei.js';

const execAsync = promisify(exec);

// --- Configuration ---
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:8000';
const YOUTUBE_VIDEOS_DIR = path.resolve(__dirname, '../data/youtube-videos');
const RAW_LYRICS_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const TRANSCRIBED_LYRICS_DIR = path.resolve(__dirname, '../data/transcribed-lyrics');

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
 * Download video using yt-dlp
 */
async function downloadVideo(videoId: string): Promise<string> {
  const outputDir = path.join(YOUTUBE_VIDEOS_DIR, videoId);
  await fs.mkdir(outputDir, { recursive: true });
  
  const outputPath = path.join(outputDir, `${videoId}.%(ext)s`);
  
  console.log(`Downloading video ${videoId}...`);
  
  // Download audio only (faster, smaller)
  const command = `yt-dlp -x --audio-format wav -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`;
  
  try {
    const { stdout, stderr } = await execAsync(command);
    console.log(stdout);
    if (stderr) console.warn(stderr);
    
    // Find the downloaded file
    const files = await fs.readdir(outputDir);
    const audioFile = files.find(f => f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp3'));
    
    if (!audioFile) {
      throw new Error('Downloaded audio file not found');
    }
    
    return path.join(outputDir, audioFile);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Transcribe audio using Whisper API
 */
async function transcribeWithWhisper(audioFilePath: string, language?: string): Promise<WhisperResponse> {
  console.log(`Transcribing with Whisper API: ${WHISPER_API_URL}...`);
  
  // Use native FormData (available in Node.js 18+)
  const FormData = (global as any).FormData || require('form-data');
  const formData = new FormData();
  
  const audioBuffer = await fs.readFile(audioFilePath);
  const audioBlob = new Blob([audioBuffer]);
  formData.append('audio_file', audioBlob, path.basename(audioFilePath));
  
  if (language) {
    formData.append('language', language);
  }
  
  // Add timestamp options if your Whisper API supports it
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
      throw new Error(`Whisper API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Whisper API error:', error);
    throw error;
  }
}

/**
 * Alternative: Use OpenAI Whisper API (if self-hosted doesn't work)
 */
async function transcribeWithOpenAIWhisper(audioFilePath: string, language?: string): Promise<WhisperResponse> {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set');
  }
  
  console.log('Transcribing with OpenAI Whisper API...');
  
  // Use native FormData (available in Node.js 18+)
  // For older Node versions, you may need: npm install form-data
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
  
  // If using form-data package, get headers from it
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
  
  return await response.json();
}

/**
 * Convert Whisper segments to our format
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
    start_ms: Math.round(seg.start * 1000),
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
    console.warn(`Could not fetch metadata:`, e);
    return {
      title: 'Unknown Title',
      artist: 'Unknown Artist',
      thumbnailUrl: '',
    };
  }
}

/**
 * Main function
 */
async function main() {
  const videoId = process.argv[2];
  const language = process.argv[3]; // Optional: language code (e.g., 'es', 'en')
  const useOpenAI = process.argv.includes('--openai');
  
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    console.log("Usage: npx ts-node scripts/whisper-transcribe.ts <YOUTUBE_VIDEO_ID> [LANGUAGE] [--openai]");
    console.log("  LANGUAGE: Optional language code (e.g., 'es', 'en')");
    console.log("  --openai: Use OpenAI Whisper API instead of self-hosted");
    process.exit(1);
  }
  
  try {
    // Check for yt-dlp
    const hasYtDlp = await checkYtDlp();
    if (!hasYtDlp) {
      console.error('Error: yt-dlp is not installed.');
      console.error('Install it with: pip install yt-dlp');
      console.error('Or: brew install yt-dlp');
      process.exit(1);
    }
    
    // 1. Download video
    const audioFilePath = await downloadVideo(videoId);
    console.log(`✅ Downloaded to: ${audioFilePath}`);
    
    // 2. Transcribe
    let whisperResponse: WhisperResponse;
    if (useOpenAI) {
      whisperResponse = await transcribeWithOpenAIWhisper(audioFilePath, language);
    } else {
      whisperResponse = await transcribeWithWhisper(audioFilePath, language);
    }
    
    // 3. Convert to our format
    const lyricSegments = convertToLyricSegments(whisperResponse);
    console.log(`✅ Transcribed ${lyricSegments.length} segments`);
    
    // 4. Get metadata
    const metadata = await getVideoMetadata(videoId);
    
    // 5. Save to raw-lyrics format (for compatibility with existing scripts)
    await fs.mkdir(RAW_LYRICS_DIR, { recursive: true });
    const rawLyricsPath = path.join(RAW_LYRICS_DIR, `${videoId}.json`);
    await fs.writeFile(rawLyricsPath, JSON.stringify(lyricSegments, null, 2));
    console.log(`✅ Saved raw lyrics to: ${rawLyricsPath}`);
    
    // 6. Also save with metadata to transcribed-lyrics
    await fs.mkdir(TRANSCRIBED_LYRICS_DIR, { recursive: true });
    const transcribedPath = path.join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
    const transcribedData = {
      videoId,
      ...metadata,
      language: language || 'auto',
      segments: lyricSegments,
      transcribedAt: new Date().toISOString(),
    };
    await fs.writeFile(transcribedPath, JSON.stringify(transcribedData, null, 2));
    console.log(`✅ Saved transcribed data to: ${transcribedPath}`);
    
    // 7. Clean up audio file (optional - comment out if you want to keep it)
    // await fs.unlink(audioFilePath).catch(() => {});
    
    console.log(`\n✅ Successfully transcribed video ${videoId}`);
    console.log(`   You can now run: npx ts-node scripts/process-lyrics-folder.ts`);
    console.log(`   Or manually move ${rawLyricsPath} to data/lyrics-to-analyze/`);
    
  } catch (error) {
    console.error('An error occurred:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    process.exit(1);
  }
}

main();

