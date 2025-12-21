import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

// --- Configuration ---
const TRANSCRIBED_LYRICS_DIR = path.resolve(__dirname, '../data/transcribed-lyrics');
const ANALYZED_LYRICS_DIR = path.resolve(__dirname, '../data/analyzed-lyrics');

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
      // File doesn't exist, create dummy analysis
      console.log(`  📝 Creating analysis file...`);
      
      // Read transcribed-lyrics to get metadata
      const transcribedPath = path.join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
      let metadata = {
        videoId,
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        thumbnailUrl: '',
        originalLanguage: 'es',
      };
      
      try {
        const transcribedContent = await fs.readFile(transcribedPath, 'utf-8');
        const transcribedData = JSON.parse(transcribedContent);
        metadata = {
          videoId: transcribedData.videoId || videoId,
          title: transcribedData.title || 'Unknown Title',
          artist: transcribedData.artist || 'Unknown Artist',
          thumbnailUrl: transcribedData.thumbnailUrl || '',
          originalLanguage: transcribedData.language || 'es',
        };
      } catch (e) {
        console.warn(`  ⚠️  Could not read transcribed-lyrics, using defaults`);
      }
      
      // Create dummy analyzed-lyrics file
      await fs.mkdir(ANALYZED_LYRICS_DIR, { recursive: true });
      const analyzedData = {
        ...metadata,
        lyrics: [
          {
            text: "Dummy lyric line",
            start_ms: 0,
            end_ms: 2000,
            explanation: "This is a dummy explanation for testing."
          }
        ],
        structuredSections: [
          {
            title: "Intro",
            sectionExplanation: "This is a dummy section explanation for testing.",
            start_ms: 0,
            end_ms: 2000
          }
        ]
      };
      
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

