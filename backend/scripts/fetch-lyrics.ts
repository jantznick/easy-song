import { Innertube } from 'youtubei.js';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../data/raw-lyrics');

async function main() {
  const videoId = process.argv[2];
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    process.exit(1);
  }

  try {
    console.log(`Fetching transcript for ${videoId}...`);
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);
    const rawTranscript = await videoInfo.getTranscript();

    const segments = rawTranscript?.transcript?.content?.body?.initial_segments;

    if (!segments || segments.length === 0) {
      console.error('Could not find transcript segments in the response object.');
      return;
    }

    const structuredLyrics = segments
      .map((seg: any) => ({
        text: seg.snippet.text.trim(),
        start_ms: parseInt(seg.start_ms, 10),
        end_ms: parseInt(seg.end_ms, 10),
      }))
      .filter((seg: any) => seg.text !== '[Música]');

    // Ensure the output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    const outputPath = path.join(OUTPUT_DIR, `${videoId}.json`);
    
    await fs.writeFile(outputPath, JSON.stringify(structuredLyrics, null, 2));

    console.log(`✅ Successfully fetched and saved structured lyrics to: ${outputPath}`);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
