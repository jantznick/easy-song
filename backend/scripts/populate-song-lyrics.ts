import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { prisma } from '../src/lib/prisma';

const SONGS_DIR = path.resolve(__dirname, '../data/songs');

interface LyricLine {
  spanish: string;
  english: string | null;
  explanation: string | null;
  start_ms: number;
  end_ms: number;
}

interface SongSection {
  title: string;
  lines: LyricLine[];
}

interface SongData {
  videoId: string;
  title: string;
  artist: string;
  thumbnailUrl?: string;
  sections: SongSection[];
}

/**
 * Extracts plain text lyrics from song data
 */
function extractLyrics(songData: SongData): {
  spanish: string;
  english: string | null;
} {
  const spanishLines: string[] = [];
  const englishLines: string[] = [];

  // Iterate through all sections and lines
  for (const section of songData.sections) {
    for (const line of section.lines) {
      // Extract Spanish lyrics (required)
      if (line.spanish && line.spanish.trim()) {
        spanishLines.push(line.spanish.trim());
      }

      // Extract English lyrics (optional)
      if (line.english && line.english.trim()) {
        englishLines.push(line.english.trim());
      }
    }
  }

  // Join all lines with newlines
  const spanishText = spanishLines.join('\n');
  const englishText = englishLines.length > 0 ? englishLines.join('\n') : null;

  return {
    spanish: spanishText,
    english: englishText,
  };
}

/**
 * Main function to populate lyrics in Song table
 */
async function main() {
  try {
    console.log('🎵 Starting lyrics population...\n');

    // Read all JSON files from songs directory
    const files = await fs.readdir(SONGS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} song file(s)\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(SONGS_DIR, file);
      const videoId = path.basename(file, '.json');

      try {
        // Read and parse JSON file
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const songData: SongData = JSON.parse(fileContent);

        // Extract lyrics
        const { spanish, english } = extractLyrics(songData);

        if (!spanish || spanish.trim().length === 0) {
          console.log(`⚠️  Skipping ${videoId}: No Spanish lyrics found`);
          skippedCount++;
          continue;
        }

        // Check if song already exists
        const existingSong = await prisma.song.findUnique({
          where: { videoId },
        });

        const songFilePath = `songs/${videoId}.json`;
        const studyFilePath = `study/${videoId}.json`;

        // Check if study file exists
        const studyPath = path.resolve(__dirname, '../data/study', `${videoId}.json`);
        let studyFileExists = false;
        try {
          await fs.access(studyPath);
          studyFileExists = true;
        } catch {
          // Study file doesn't exist, that's okay
        }

        const song = await prisma.song.upsert({
          where: { videoId },
          create: {
            videoId: songData.videoId,
            title: songData.title,
            artist: songData.artist,
            thumbnailUrl: songData.thumbnailUrl || null,
            songFilePath,
            studyFilePath: studyFileExists ? studyFilePath : null,
            lyricsTextSpanish: spanish,
            lyricsTextEnglish: english,
          },
          update: {
            title: songData.title,
            artist: songData.artist,
            thumbnailUrl: songData.thumbnailUrl || null,
            lyricsTextSpanish: spanish,
            lyricsTextEnglish: english,
          },
        });

        const englishStatus = english ? `English: ${english.split('\n').length} lines` : 'No English translation';
        const action = existingSong ? 'Updated' : 'Created';
        console.log(`✅ ${action} ${videoId}: Spanish: ${spanish.split('\n').length} lines, ${englishStatus}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error processing ${videoId}:`, error instanceof Error ? error.message : error);
        errorCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (successCount > 0) {
      console.log('\n💡 Next step: Create full-text search indexes:');
      console.log('   Run this SQL in your database:');
      console.log('   CREATE INDEX IF NOT EXISTS songs_lyrics_spanish_fts_idx ON "Song" USING gin(to_tsvector(\'spanish\', "lyricsTextSpanish"));');
      if (successCount > 0) {
        console.log('   CREATE INDEX IF NOT EXISTS songs_lyrics_english_fts_idx ON "Song" USING gin(to_tsvector(\'english\', "lyricsTextEnglish"));');
      }
    }
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
