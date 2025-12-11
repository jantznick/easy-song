import fs from 'fs/promises';
import path from 'path';

/**
 * Generates a songs-list.json file containing summaries of all songs.
 * This file is used for static hosting (S3, Cloudflare R2, etc.) where
 * we can't dynamically list directory contents.
 */
async function main() {
  const SONGS_DIR = path.resolve(__dirname, '../data/songs');
  const OUTPUT_FILE = path.resolve(__dirname, '../data/songs-list.json');

  try {
    // Read all JSON files in the songs directory
    const files = await fs.readdir(SONGS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} song files`);

    // Read each file and extract summary information
    const songs = await Promise.all(
      jsonFiles.map(async file => {
        const filePath = path.join(SONGS_DIR, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const songData = JSON.parse(fileContent);
        
        // Return a summary object for the list view
        return {
          videoId: songData.videoId,
          title: songData.title,
          artist: songData.artist,
          thumbnailUrl: songData.thumbnailUrl,
        };
      })
    );

    // Write the songs list to the output file
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(songs, null, 2), 'utf-8');
    
    console.log(`✅ Successfully generated ${OUTPUT_FILE}`);
    console.log(`   Contains ${songs.length} songs`);
  } catch (error) {
    console.error('Error generating songs list:', error);
    process.exit(1);
  }
}

main();
