import 'dotenv/config';
import { Innertube } from 'youtubei.js';
import OpenAI from 'openai';
import fs from 'fs/promises';
import path from 'path';

// --- Configuration ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RAW_LYRICS_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const PROMPT_PATH = path.resolve(__dirname, '../prompt.txt');

if (!OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set. Please create a .env file in the 'backend' directory.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

/**
 * Main function to generate the final song analysis.
 */
async function main() {
  const videoId = process.argv[2];
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    console.log("Usage: npx ts-node scripts/generate-analysis.ts <YOUTUBE_VIDEO_ID>");
    process.exit(1);
  }

  try {
    // 1. Read the structured lyrics file
    const rawLyricsPath = path.join(RAW_LYRICS_DIR, `${videoId}.json`);
    const lyricsFileContent = await fs.readFile(rawLyricsPath, 'utf-8');
    const structuredLyrics: LyricSegment[] = JSON.parse(lyricsFileContent);

    // 2. Read the prompt template
    const promptTemplate = await fs.readFile(PROMPT_PATH, 'utf-8');

    // 3. Get video metadata (title and artist)
    console.log(`Fetching metadata for ${videoId}...`);
    const youtube = await Innertube.create();
    const videoInfo = await youtube.getInfo(videoId);
    const title = videoInfo.basic_info.title || 'Unknown Title';
    const artist = videoInfo.basic_info.author || 'Unknown Artist';

    // 4. Format lyrics into a simple text block for the prompt
    const lyricsText = structuredLyrics.map(seg => seg.text).join('\n');

    // 5. Build the final prompt
    let finalPrompt = promptTemplate
      .replace('[Song Title]', title)
      .replace('[Artist]', artist);
    
    finalPrompt = `${finalPrompt}\n\nHere are the lyrics to analyze:\n\n${lyricsText}`;

    // 6. Call OpenAI API
    console.log('Generating analysis with OpenAI...');
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: "You are an expert in music history, linguistics, and cultural studies. Your task is to analyze song lyrics and provide detailed, structured explanations in JSON format as requested." },
        { role: "user", content: finalPrompt }
      ],
      response_format: { type: "json_object" },
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("OpenAI response was empty.");
    }

    const analysisData = JSON.parse(aiResponse);

    // 7. Combine AI analysis with our structured lyrics
    // Create a lookup map from the AI's analysis for robust matching
    const normalizeText = (text: string) => text.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?¿]/g,"").toLowerCase();
    const analysisMap = new Map<string, { english: string, explanation: string | null }>();
    for (const item of analysisData.analysis) {
        analysisMap.set(normalizeText(item.spanish), { english: item.english, explanation: item.explanation });
    }

    // Iterate through our original, timestamped lyrics as the source of truth
    const finalLines = structuredLyrics.map(seg => {
        const analysis = analysisMap.get(normalizeText(seg.text));
        return {
            spanish: seg.text,
            english: analysis ? analysis.english : "...", // Use AI english or a placeholder
            explanation: analysis ? analysis.explanation : null,
            start_ms: seg.start_ms,
            end_ms: seg.end_ms,
        };
    });
    
    // For now, we will put all lines into a single "Main" section.
    // Structuring into verses/choruses can be a future enhancement.
    const finalSongData = {
        videoId: videoId,
        title: title,
        artist: artist,
        sections: [{
            title: "Lyrics",
            lines: finalLines,
        }],
    };


    // 8. Save the final, combined data
    await fs.mkdir(SONGS_DIR, { recursive: true });
    const outputPath = path.join(SONGS_DIR, `${videoId}.json`);
    await fs.writeFile(outputPath, JSON.stringify(finalSongData, null, 2));

    console.log(`✅ Successfully generated and saved final song data to: ${outputPath}`);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

main();
