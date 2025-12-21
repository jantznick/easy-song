import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const ANALYZED_LYRICS_DIR = path.resolve(__dirname, '../data/analyzed-lyrics');
const FINAL_SONGS_DIR = path.resolve(__dirname, '../data/songs');

/**
 * Process a single video: translate lyrics
 */
async function translateVideo(videoId: string, skipExisting: boolean = true): Promise<boolean> {
  console.log(`\n🌍 Translating: ${videoId}`);
  console.log('─'.repeat(50));
  
  try {
    const finalPath = path.join(FINAL_SONGS_DIR, `${videoId}.json`);
    
    // Check if final output already exists
    if (skipExisting) {
      try {
        await fs.access(finalPath);
        console.log(`  ⏭️  Final song file already exists, skipping translation...`);
        return true;
      } catch {
        // File doesn't exist, continue
      }
    }
      // File doesn't exist, create dummy translation
      console.log(`  📝 Creating translation file...`);
      
      // Read analyzed-lyrics to get metadata
      const analyzedPath = path.join(ANALYZED_LYRICS_DIR, `${videoId}.json`);
      let metadata = {
        videoId,
        title: 'Unknown Title',
        artist: 'Unknown Artist',
        thumbnailUrl: '',
        originalLanguage: 'es',
      };
      
      try {
        const analyzedContent = await fs.readFile(analyzedPath, 'utf-8');
        const analyzedData = JSON.parse(analyzedContent);
        metadata = {
          videoId: analyzedData.videoId || videoId,
          title: analyzedData.title || 'Unknown Title',
          artist: analyzedData.artist || 'Unknown Artist',
          thumbnailUrl: analyzedData.thumbnailUrl || '',
          originalLanguage: analyzedData.originalLanguage || 'es',
        };
      } catch (e) {
        console.warn(`  ⚠️  Could not read analyzed-lyrics, using defaults`);
      }
      
      // Create dummy final song file
      await fs.mkdir(FINAL_SONGS_DIR, { recursive: true });
      const finalData = {
        ...metadata,
        transcribedAt: new Date().toISOString(),
        lyrics: [
          {
            text: "Dummy lyric line",
            start_ms: 0,
            end_ms: 2000,
            translations: {
              en: "Dummy English translation",
              es: "Dummy lyric line",
              fr: "Traduction française factice",
              de: "Dummy deutsche Übersetzung",
              zh: "虚拟中文翻译",
              it: "Traduzione italiana dummy"
            },
            explanations: {
              en: "This is a dummy explanation for testing.",
              es: "Esta es una explicación ficticia para pruebas.",
              fr: "Ceci est une explication factice pour les tests.",
              de: "Dies ist eine Dummy-Erklärung zum Testen.",
              zh: "这是用于测试的虚拟说明。",
              it: "Questa è una spiegazione fittizia per i test."
            }
          }
        ],
        structuredSections: [
          {
            title: {
              en: "Intro",
              es: "Introducción",
              fr: "Introduction",
              de: "Einleitung",
              zh: "介绍",
              it: "Introduzione"
            },
            sectionExplanation: {
              en: "This is a dummy section explanation for testing.",
              es: "Esta es una explicación de sección ficticia para pruebas.",
              fr: "Ceci est une explication de section factice pour les tests.",
              de: "Dies ist eine Dummy-Abschnittserklärung zum Testen.",
              zh: "这是用于测试的虚拟部分说明。",
              it: "Questa è una spiegazione di sezione fittizia per i test."
            },
            start_ms: 0,
            end_ms: 2000
          }
        ]
      };
      
      await fs.writeFile(finalPath, JSON.stringify(finalData, null, 2));
      console.log(`  💾 Saved final song file: ${finalPath}`);
      console.log(`  ✅ Translation complete!`);
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
    console.error('   Usage: npx ts-node scripts/translate-song.ts <VIDEO_ID> [--clean-slate]');
    process.exit(1);
  }
  
  const success = await translateVideo(videoId, skipExisting);
  process.exit(success ? 0 : 1);
}

main();

