import { Innertube } from 'youtubei.js';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../data/raw-lyrics');

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

async function main() {
  const videoId = process.argv[2];
  if (!videoId) {
    console.error("Please provide a YouTube video ID as an argument.");
    process.exit(1);
  }

  // Get cookie from environment variable
  const cookie = process.env.YOUTUBE_COOKIE;
  if (!cookie) {
    console.error("Error: YOUTUBE_COOKIE environment variable is not set.");
    console.error("Please set it with: export YOUTUBE_COOKIE='your_cookie_string'");
    process.exit(1);
  }

  try {
    console.log(`Fetching transcript info for ${videoId}...`);
    
    // Create Innertube instance with authentication
    const youtube = await Innertube.create({
      cookie: cookie
    });
    
    console.log('Fetching video info...');
    const videoInfo = await youtube.getInfo(videoId);
    
    // Try accessing captions directly first (more reliable than transcript endpoint)
    console.log('\n=== CHECKING CAPTIONS DIRECTLY ===');
    const captions = videoInfo.captions;
    console.log(`Has captions object: ${!!captions}`);
    
    if (captions) {
      console.log('Caption tracks available:', captions.caption_tracks?.length || 0);
      
      if (captions.caption_tracks && captions.caption_tracks.length > 0) {
        console.log('\n=== CAPTION TRACKS INFO ===');
        captions.caption_tracks.forEach((track: any, index: number) => {
          console.log(`\nTrack ${index + 1}:`);
          console.log(`  Language: ${track.language?.language_code || 'N/A'} (${track.language?.language_name || 'N/A'})`);
          console.log(`  Kind: ${track.kind || 'N/A'}`);
          console.log(`  Base URL: ${track.base_url || 'N/A'}`);
          // Log all track properties to see if pot/potc are available
          console.log(`  All properties:`, Object.keys(track));
          // Check for any URL-related methods
          if (typeof track.getUrl === 'function') {
            console.log(`  Has getUrl method`);
          }
          if (typeof track.url === 'string') {
            console.log(`  Has url property: ${track.url}`);
          }
          // Log the full track object structure (first level only) - but only for Spanish tracks
          if (index < 5) { // Only log first 5 to avoid too much output
            try {
              const trackStr = JSON.stringify(track, (key, value) => {
                // Skip functions and circular refs
                if (typeof value === 'function') return '[Function]';
                if (value && typeof value === 'object' && value.constructor && value.constructor.name !== 'Object' && value.constructor.name !== 'Array') {
                  return `[${value.constructor.name}]`;
                }
                return value;
              }, 2);
              console.log(`  Track object (first 2000 chars):`, trackStr.substring(0, 2000));
            } catch (e) {
              console.log(`  Could not stringify track object: ${e}`);
            }
          }
        });
        
        // Helper function to parse language from URL
        const parseLanguageFromUrl = (url: string) => {
          try {
            const urlObj = new URL(url);
            const lang = urlObj.searchParams.get('lang') || '';
            const name = urlObj.searchParams.get('name') || '';
            return { lang, name };
          } catch {
            return { lang: '', name: '' };
          }
        };
        
        // Find Spanish tracks by parsing URL parameters
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
        
        console.log(`\n=== SPANISH TRACKS FOUND: ${spanishTracks.length} ===`);
        
        if (spanishTracks.length === 0) {
          throw new Error('No Spanish caption tracks found. Please ensure the video has Spanish captions.');
        }
        
        // Try generic 'es' first (might have better URL), then es-ES, then first available
        const selectedTrack = spanishTracks.find(({ lang }) => lang === 'es') || 
                             spanishTracks.find(({ lang }) => lang === 'es-ES') || 
                             spanishTracks[0];
        
        console.log(`\n✅ Selected Spanish track:`);
        console.log(`  Language Code: ${selectedTrack.lang}`);
        console.log(`  Language Name: ${selectedTrack.name.replace(/\+/g, ' ').replace(/%20/g, ' ')}`);
        
        // Check if pot/potc are already in the base_url or track object
        const baseUrlObj = new URL(selectedTrack.track.base_url);
        const existingPot = baseUrlObj.searchParams.get('pot');
        const existingPotc = baseUrlObj.searchParams.get('potc');
        console.log(`  Existing pot: ${existingPot || 'none'}`);
        console.log(`  Existing potc: ${existingPotc || 'none'}`);
        
        // Fetch the caption data directly
        console.log('\n=== FETCHING CAPTION DATA ===');
        let captionUrl = selectedTrack.track.base_url;
        
        // Try XML format first (srv3) - might work without pot token
        const urlObj = new URL(captionUrl);
        
        // Try srv3 (XML) format first - it might not require the pot token
        urlObj.searchParams.set('fmt', 'srv3');
        let testUrl = urlObj.toString();
        
        console.log(`Trying XML format first: ${testUrl}`);
        
        // Test if XML format works
        let testResponse = await fetch(testUrl, {
          headers: {
            'Cookie': cookie,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        let responseText = await testResponse.text();
        console.log(`XML format response: ${testResponse.status}, length: ${responseText.length}`);
        
        // If XML doesn't work, try JSON3 with minimal params
        if (responseText.length === 0 || !testResponse.ok) {
          console.log('XML format failed, trying JSON3 format...');
          urlObj.searchParams.set('fmt', 'json3');
          testUrl = urlObj.toString();
          testResponse = await fetch(testUrl, {
            headers: {
              'Cookie': cookie,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          responseText = await testResponse.text();
          console.log(`JSON3 format response: ${testResponse.status}, length: ${responseText.length}`);
        }
        
        captionUrl = testUrl;
        
        if (!testResponse.ok) {
          const errorText = await testResponse.text();
          console.error(`Error response body: ${errorText.substring(0, 500)}`);
          throw new Error(`Failed to fetch captions: ${testResponse.status} ${testResponse.statusText}`);
        }
        
        if (responseText.length === 0) {
          throw new Error('Received empty response from caption URL. The URL may be expired or require the pot (proof-of-token) parameter.');
        }
        
        // Log first 500 chars to debug
        console.log(`First 500 chars of response: ${responseText.substring(0, 500)}`);
        
        // Parse based on format
        console.log('\n=== PARSING CAPTION DATA ===');
        
        let textSegments: Array<{ start: number; dur: number; text: string }> = [];
        
        if (captionUrl.includes('fmt=srv3') || responseText.trim().startsWith('<?xml') || responseText.trim().startsWith('<transcript')) {
          // Parse XML format
          console.log('Parsing XML format...');
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
          // Parse JSON3 format
          console.log('Parsing JSON3 format...');
          const jsonData = JSON.parse(responseText);
          
          // JSON3 format has events array with segs array inside
          if (jsonData.events && Array.isArray(jsonData.events)) {
            for (const event of jsonData.events) {
              if (event.segs && Array.isArray(event.segs)) {
                // Combine all segments in this event into one text
                const text = event.segs
                  .map((seg: any) => seg.utf8 || '')
                  .join('')
                  .trim();
                
                if (text && event.tStartMs !== undefined && event.dDurationMs !== undefined) {
                  textSegments.push({
                    start: event.tStartMs / 1000, // Convert ms to seconds
                    dur: event.dDurationMs / 1000, // Convert ms to seconds
                    text: text
                  });
                }
              }
            }
          }
        }
        
        console.log(`Found ${textSegments.length} text segments`);
        
        if (textSegments.length === 0) {
          throw new Error('Could not find any text segments in the caption XML');
        }
        
        // Convert to structured format
        const structuredLyrics: LyricSegment[] = textSegments
          .map((seg) => ({
            text: seg.text,
            start_ms: Math.round(seg.start * 1000),
            end_ms: Math.round((seg.start + seg.dur) * 1000)
          }))
          .filter((seg) => seg.text && seg.text !== '[Música]' && seg.text !== '[Music]');
        
        console.log(`✅ Parsed ${structuredLyrics.length} lyric segments`);
        
        // Save to file
        await fs.mkdir(OUTPUT_DIR, { recursive: true });
        const outputPath = path.join(OUTPUT_DIR, `${videoId}.json`);
        await fs.writeFile(outputPath, JSON.stringify(structuredLyrics, null, 2));
        
        console.log(`\n✅ Successfully saved Spanish lyrics to: ${outputPath}`);
        console.log(`   Total segments: ${structuredLyrics.length}`);
        console.log(`   First segment: "${structuredLyrics[0]?.text}" (${structuredLyrics[0]?.start_ms}ms - ${structuredLyrics[0]?.end_ms}ms)`);
        console.log(`   Last segment: "${structuredLyrics[structuredLyrics.length - 1]?.text}" (${structuredLyrics[structuredLyrics.length - 1]?.start_ms}ms - ${structuredLyrics[structuredLyrics.length - 1]?.end_ms}ms)`);
      }
    }

  } catch (error) {
    console.error('An error occurred:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

main();

