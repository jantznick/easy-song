import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { Innertube } from 'youtubei.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OUTPUT_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const WHISPER_API_URL = process.env.WHISPER_API_URL || 'http://localhost:8000';

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

/**
 * Try to fetch YouTube transcripts first (fastest, free, usually best quality)
 */
async function fetchYouTubeTranscripts(videoId: string): Promise<LyricSegment[] | null> {
  const cookie = process.env.YOUTUBE_COOKIE;
  if (!cookie) {
    console.log('  ⚠️  YOUTUBE_COOKIE not set, skipping YouTube transcript fetch');
    return null;
  }

  try {
    console.log('  📺 Trying YouTube transcripts...');
    
    const youtube = await Innertube.create({ cookie });
    const videoInfo = await youtube.getInfo(videoId);
    const captions = videoInfo.captions;
    
    if (!captions || !captions.caption_tracks || captions.caption_tracks.length === 0) {
      console.log('  ❌ No YouTube transcripts available');
      return null;
    }
    
    // Find Spanish tracks
    const parseLanguageFromUrl = (url: string) => {
      try {
        const urlObj = new URL(url);
        return {
          lang: urlObj.searchParams.get('lang') || '',
          name: urlObj.searchParams.get('name') || '',
        };
      } catch {
        return { lang: '', name: '' };
      }
    };
    
    const spanishTracks = captions.caption_tracks
      .map((track: any) => {
        const urlInfo = parseLanguageFromUrl(track.base_url || '');
        return { track, ...urlInfo };
      })
      .filter(({ lang, name }) => {
        const lowerLang = lang.toLowerCase();
        const lowerName = name.toLowerCase().replace(/\+/g, ' ').replace(/%20/g, ' ');
        return lowerLang.startsWith('es') || 
               lowerName.includes('spanish') || 
               lowerName.includes('español') ||
               lowerName === 'es';
      });
    
    if (spanishTracks.length === 0) {
      console.log('  ❌ No Spanish transcripts found');
      return null;
    }
    
    const selectedTrack = spanishTracks.find(({ lang }) => lang === 'es') || 
                         spanishTracks.find(({ lang }) => lang === 'es-ES') || 
                         spanishTracks[0];
    
    // Fetch caption data
    const urlObj = new URL(selectedTrack.track.base_url);
    urlObj.searchParams.set('fmt', 'srv3'); // Try XML first
    
    let response = await fetch(urlObj.toString(), {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    let responseText = await response.text();
    
    // Try JSON3 if XML fails
    if (responseText.length === 0 || !response.ok) {
      urlObj.searchParams.set('fmt', 'json3');
      response = await fetch(urlObj.toString(), {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      responseText = await response.text();
    }
    
    if (!response.ok || responseText.length === 0) {
      console.log('  ❌ Failed to fetch transcript data');
      return null;
    }
    
    // Parse based on format
    let textSegments: Array<{ start: number; dur: number; text: string }> = [];
    
    if (responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<transcript')) {
      // Parse XML
      const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
      let match;
      while ((match = textRegex.exec(responseText)) !== null) {
        textSegments.push({
          start: parseFloat(match[1]),
          dur: parseFloat(match[2]),
          text: match[3].trim()
        });
      }
    } else {
      // Parse JSON3
      const jsonData = JSON.parse(responseText);
      if (jsonData.events && Array.isArray(jsonData.events)) {
        for (const event of jsonData.events) {
          if (event.segs && Array.isArray(event.segs)) {
            const text = event.segs
              .map((seg: any) => seg.utf8 || '')
              .join('')
              .trim();
            
            if (text && event.tStartMs !== undefined && event.dDurationMs !== undefined) {
              textSegments.push({
                start: event.tStartMs / 1000,
                dur: event.dDurationMs / 1000,
                text: text
              });
            }
          }
        }
      }
    }
    
    if (textSegments.length === 0) {
      console.log('  ❌ No text segments found in transcript');
      return null;
    }
    
    const structuredLyrics: LyricSegment[] = textSegments
      .map((seg) => ({
        text: seg.text,
        start_ms: Math.round(seg.start * 1000),
        end_ms: Math.round((seg.start + seg.dur) * 1000)
      }))
      .filter((seg) => seg.text && seg.text !== '[Música]' && seg.text !== '[Music]');
    
    console.log(`  ✅ YouTube transcripts found: ${structuredLyrics.length} segments`);
    return structuredLyrics;
    
  } catch (error) {
    console.log(`  ⚠️  YouTube transcript fetch failed:`, error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Fall back to Whisper transcription
 */
async function transcribeWithWhisper(videoId: string, language?: string): Promise<LyricSegment[]> {
  console.log('  🎤 Falling back to Whisper transcription...');
  
  // Check if yt-dlp is available
  try {
    await execAsync('which yt-dlp');
  } catch {
    throw new Error('yt-dlp is not installed. Install with: brew install yt-dlp');
  }
  
  // Download video
  const DOWNLOADS_DIR = path.resolve(__dirname, '../data/downloads');
  const outputDir = path.join(DOWNLOADS_DIR, videoId);
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `${videoId}.%(ext)s`);
  
  console.log('  📥 Downloading video...');
  const downloadCommand = `yt-dlp -x --audio-format wav -o "${outputPath}" "https://www.youtube.com/watch?v=${videoId}"`;
  await execAsync(downloadCommand);
  
  // Find downloaded file
  const files = await fs.readdir(outputDir);
  const audioFile = files.find(f => f.endsWith('.wav') || f.endsWith('.m4a') || f.endsWith('.mp3'));
  if (!audioFile) {
    throw new Error('Downloaded audio file not found');
  }
  const audioFilePath = path.join(outputDir, audioFile);
  
  // Transcribe with Whisper
  console.log('  🎤 Transcribing with Whisper...');
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
  
  if (!result.segments || result.segments.length === 0) {
    throw new Error('No transcription segments found');
  }
  
  const segments: LyricSegment[] = result.segments.map((seg: any) => ({
    text: seg.text.trim(),
    start_ms: Math.round(seg.start * 1000),
    end_ms: Math.round(seg.end * 1000),
  })).filter((seg: LyricSegment) => seg.text.length > 0);
  
  console.log(`  ✅ Whisper transcription complete: ${segments.length} segments`);
  return segments;
}

/**
 * Main function: Try YouTube first, fall back to Whisper
 */
async function main() {
  const videoId = process.argv[2];
  const forceWhisper = process.argv.includes('--whisper');
  const language = process.argv.find(arg => arg.startsWith('--lang='))?.split('=')[1] || 'es';
  
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    console.log("Usage: npx ts-node scripts/fetch-or-transcribe.ts <YOUTUBE_VIDEO_ID> [--whisper] [--lang=es]");
    console.log("  --whisper: Skip YouTube and use Whisper directly");
    console.log("  --lang=es: Language code for Whisper (default: es)");
    process.exit(1);
  }
  
  console.log(`\n🎵 Fetching lyrics for ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    let segments: LyricSegment[];
    let source: string;
    
    if (forceWhisper) {
      segments = await transcribeWithWhisper(videoId, language);
      source = 'Whisper';
    } else {
      // Try YouTube first
      const youtubeSegments = await fetchYouTubeTranscripts(videoId);
      
      if (youtubeSegments && youtubeSegments.length > 0) {
        segments = youtubeSegments;
        source = 'YouTube';
      } else {
        // Fall back to Whisper
        segments = await transcribeWithWhisper(videoId, language);
        source = 'Whisper';
      }
    }
    
    // Save to file
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(segments, null, 2));
    
    console.log(`\n✅ Successfully saved lyrics (source: ${source})`);
    console.log(`   File: ${outputPath}`);
    console.log(`   Segments: ${segments.length}`);
    console.log(`   Duration: ${segments[segments.length - 1]?.end_ms / 1000}s`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  }
}

main();

