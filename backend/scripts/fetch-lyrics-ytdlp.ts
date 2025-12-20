import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const OUTPUT_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const TO_DOWNLOAD_FILE = path.resolve(__dirname, '../data/toDownload.json');

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
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
 * Download transcript for a single video using yt-dlp
 */
async function downloadTranscript(videoId: string, languageCode: string = 'es'): Promise<LyricSegment[]> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Create temp directory for subtitle files
  const tempDir = path.join(__dirname, '../data/temp-subs');
  await fs.mkdir(tempDir, { recursive: true });
  
  console.log(`  📥 Downloading transcript for ${videoId}...`);
  
  try {
    // Try to download Spanish subtitles first (non-auto-generated)
    // yt-dlp will try manual subs first, then auto-generated if manual not available
    const command = `yt-dlp --write-subs --write-auto-subs --sub-lang ${languageCode} --sub-format json3 --skip-download --no-warnings -o "${tempDir}/${videoId}.%(ext)s" "${videoUrl}"`;
    
    const { stdout, stderr } = await execAsync(command, {
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    
    // Find the downloaded subtitle file
    const files = await fs.readdir(tempDir);
    const subFile = files.find(f => f.startsWith(videoId) && (f.endsWith('.json') || f.endsWith('.json3')));
    
    if (!subFile) {
      // Try to find any subtitle file
      const anySubFile = files.find(f => f.startsWith(videoId) && (f.endsWith('.vtt') || f.endsWith('.srt')));
      if (anySubFile) {
        throw new Error(`Found ${anySubFile} but expected JSON format. Try installing yt-dlp with better subtitle support.`);
      }
      throw new Error('No subtitle file found. Captions may not be available for this video.');
    }
    
    const subFilePath = path.join(tempDir, subFile);
    const subContent = await fs.readFile(subFilePath, 'utf-8');
    
    // Parse JSON3 format
    const subData = JSON.parse(subContent);
    
    // Convert to our format
    const segments: LyricSegment[] = [];
    
    if (subData.events && Array.isArray(subData.events)) {
      for (const event of subData.events) {
        if (event.segs && Array.isArray(event.segs)) {
          const text = event.segs
            .map((seg: any) => seg.utf8 || '')
            .join('')
            .trim();
          
          if (text && event.tStartMs !== undefined && event.dDurationMs !== undefined) {
            segments.push({
              text: text,
              start_ms: event.tStartMs,
              end_ms: event.tStartMs + event.dDurationMs,
            });
          }
        }
      }
    }
    
    // Clean up temp file
    await fs.unlink(subFilePath).catch(() => {});
    
    // Filter out music markers
    const filteredSegments = segments.filter(
      seg => seg.text && 
      seg.text !== '[Música]' && 
      seg.text !== '[Music]' &&
      seg.text.length > 0
    );
    
    console.log(`  ✅ Downloaded ${filteredSegments.length} segments`);
    
    return filteredSegments;
    
  } catch (error) {
    // Clean up temp files on error
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.startsWith(videoId)) {
          await fs.unlink(path.join(tempDir, file)).catch(() => {});
        }
      }
    } catch {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

/**
 * Process a single video
 */
async function processVideo(videoId: string, languageCode: string): Promise<boolean> {
  try {
    const segments = await downloadTranscript(videoId, languageCode);
    
    if (segments.length === 0) {
      throw new Error('No caption segments found');
    }
    
    // Save to file
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(segments, null, 2));
    
    console.log(`  ✅ Saved: ${outputPath} (${segments.length} segments)`);
    return true;
    
  } catch (error) {
    console.error(`  ❌ Error processing ${videoId}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  // Check if yt-dlp is installed
  const hasYtDlp = await checkYtDlp();
  if (!hasYtDlp) {
    console.error('❌ Error: yt-dlp is not installed.');
    console.log('\nInstall it with:');
    console.log('  brew install yt-dlp  (macOS)');
    console.log('  pip install yt-dlp  (Python)');
    console.log('  Or download from: https://github.com/yt-dlp/yt-dlp');
    process.exit(1);
  }
  
  // Parse arguments more carefully
  // Args can be: [VIDEO_ID] [LANGUAGE_CODE] or just [LANGUAGE_CODE] when reading from file
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  
  let videoIds: string[] = [];
  let languageCode = 'es'; // Default to Spanish
  
  // Check if first arg looks like a video ID (11 characters, alphanumeric)
  const firstArg = args[0];
  const looksLikeVideoId = firstArg && firstArg.length === 11 && /^[a-zA-Z0-9_-]+$/.test(firstArg);
  
  if (looksLikeVideoId) {
    // First arg is a video ID
    videoIds = [firstArg];
    // Second arg (if present) is language code
    if (args[1]) {
      languageCode = args[1];
    }
  } else {
    // No video ID provided, read from file
    // First arg (if present) is language code
    if (firstArg) {
      languageCode = firstArg;
    }
    // Try to read from toDownload.json
    try {
      const fileContent = await fs.readFile(TO_DOWNLOAD_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Support both { "songs": [...] } and { "videoIds": [...] } formats
      videoIds = data.songs || data.videoIds || [];
      
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        throw new Error('Invalid format: expected array of video IDs');
      }
      
      console.log(`\n📄 Found ${videoIds.length} video(s) in ${TO_DOWNLOAD_FILE}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error("❌ Error: No video ID provided and toDownload.json not found.");
        console.log("\nUsage:");
        console.log("  Single video: npx ts-node scripts/fetch-lyrics-ytdlp.ts <YOUTUBE_VIDEO_ID> [LANGUAGE_CODE]");
        console.log("  Batch from file: npx ts-node scripts/fetch-lyrics-ytdlp.ts [LANGUAGE_CODE]");
        console.log("\nFile format (data/toDownload.json):");
        console.log('  { "songs": ["VIDEO_ID_1", "VIDEO_ID_2", ...] }');
        process.exit(1);
      } else {
        console.error("❌ Error reading toDownload.json:", error);
        process.exit(1);
      }
    }
  }
  
  console.log(`\n🎵 Processing ${videoIds.length} video(s) using yt-dlp`);
  console.log(`   Language: ${languageCode}`);
  console.log('─'.repeat(50));
  
  let successCount = 0;
  let failCount = 0;
  
  // Process each video
  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    console.log(`\n[${i + 1}/${videoIds.length}] Processing: ${videoId}`);
    
    const success = await processVideo(videoId, languageCode);
    
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between videos to avoid rate limiting
    if (i < videoIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log(`✅ Successfully processed: ${successCount}`);
  if (failCount > 0) {
    console.log(`❌ Failed: ${failCount}`);
  }
  console.log(`📊 Total: ${videoIds.length}`);
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

