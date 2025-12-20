import 'dotenv/config';
import puppeteer, { Browser, Page } from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const OUTPUT_DIR = path.resolve(__dirname, '../data/raw-lyrics');
const COOKIE_FILE = path.resolve(__dirname, '../data/youtube-cookies.json');

/**
 * Helper function to wait (replaces deprecated waitForTimeout)
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface LyricSegment {
  text: string;
  start_ms: number;
  end_ms: number;
}

/**
 * Load cookies from file or environment variable
 */
async function loadCookies(): Promise<any[] | null> {
  // Try to load from file first
  try {
    const cookieData = await fs.readFile(COOKIE_FILE, 'utf-8');
    const cookies = JSON.parse(cookieData);
    
    // Handle both array format and object with cookies array
    if (Array.isArray(cookies)) {
      return cookies;
    } else if (cookies.cookies && Array.isArray(cookies.cookies)) {
      return cookies.cookies;
    }
    
    console.log('  📋 Loaded cookies from file');
    return cookies;
  } catch (error) {
    // File doesn't exist or invalid, that's okay
  }
  
  // Try environment variable (Netscape format or JSON)
  const cookieEnv = process.env.YOUTUBE_COOKIES;
  if (cookieEnv) {
    try {
      const cookies = JSON.parse(cookieEnv);
      if (Array.isArray(cookies)) {
        console.log('  📋 Loaded cookies from environment variable');
        return cookies;
      }
    } catch (e) {
      // Not JSON, might be Netscape format - skip for now
    }
  }
  
  return null;
}

/**
 * Try to enable captions (just to trigger the timedtext request)
 */
async function enableCaptions(page: Page, languageCode: string = 'es'): Promise<void> {
  // Wait for the video player to be ready
  await page.waitForSelector('video', { timeout: 10000 });
  
  // Hover over video to show controls
  try {
    const video = await page.$('video');
    if (video) {
      await video.hover();
      await delay(1000);
    }
  } catch (e) {
    // Ignore
  }
  
  await delay(2000);
  
  // Try to find and click captions button directly
  try {
    const captionSelectors = [
      'button[aria-label*="Subtitles"]',
      'button[aria-label*="Captions"]',
      '.ytp-subtitles-button',
    ];
    
    for (const selector of captionSelectors) {
      try {
        const btn = await page.$(selector);
        if (btn) {
          await btn.click();
          await delay(1500);
          return;
        }
      } catch (e) {
        // Continue
      }
    }
  } catch (e) {
    // Ignore - we'll rely on URL modification instead
  }
}

/**
 * Intercept timedtext network requests and modify URL to get Spanish captions
 */
async function interceptTimedText(
  page: Page,
  videoId: string,
  languageCode: string = 'es'
): Promise<LyricSegment[]> {
  let timedTextUrl: string | null = null;
  let originalUrl: string | null = null;
  
  // Set up request interception
  await page.setRequestInterception(true);
  
  page.on('request', (request) => {
    // Let all requests continue
    request.continue();
  });
  
  page.on('response', async (response) => {
    const url = response.url();
    
    // Check if this is a timedtext API call
    if (url.includes('/api/timedtext') && url.includes(`v=${videoId}`)) {
      // Store the original URL so we can modify it
      if (!originalUrl) {
        originalUrl = url;
        timedTextUrl = url;
        const urlObj = new URL(url);
        const lang = urlObj.searchParams.get('lang') || '';
        console.log(`  ✅ Intercepted timedtext request (lang: ${lang || 'unknown'})`);
      }
    }
  });
  
  // Navigate to the video with realistic settings
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  // Try to navigate with realistic wait conditions
  try {
    await page.goto(videoUrl, { 
      waitUntil: 'domcontentloaded', 
      timeout: 60000,
      referer: 'https://www.youtube.com/',
    });
    
    // Wait a bit for page to fully load
    await delay(3000);
    
    // Check if video is blocked/unavailable
    const isBlocked = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      return bodyText.includes('unavailable') || 
             bodyText.includes('no longer available') ||
             bodyText.includes('This video is not available');
    });
    
    if (isBlocked) {
      throw new Error('Video appears to be blocked or unavailable');
    }
  } catch (error) {
    // If navigation fails, try with a longer timeout
    console.log('  ⚠️  Initial navigation failed, retrying...');
    await page.goto(videoUrl, { 
      waitUntil: 'networkidle0', 
      timeout: 90000,
      referer: 'https://www.youtube.com/',
    });
    await delay(3000);
  }
  
  // Try to enable captions to trigger the request
  try {
    await enableCaptions(page, languageCode);
  } catch (e) {
    // Continue even if caption UI interaction fails
  }
  
  // Try to play the video to trigger caption loading
  try {
    await page.evaluate(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        video.play().catch(() => {});
        if (video.duration > 0) {
          video.currentTime = Math.min(1, video.duration / 10);
        }
      }
    });
    await delay(1000);
  } catch (e) {
    // Ignore
  }
  
  // Wait for timedtext URL to be captured (with timeout)
  const maxWait = 20000; // 20 seconds
  const startTime = Date.now();
  const checkInterval = 500;
  
  while (!originalUrl && (Date.now() - startTime) < maxWait) {
    await delay(checkInterval);
    
    // Try clicking captions button if we haven't gotten URL yet
    if (!originalUrl && (Date.now() - startTime) > 5000) {
      try {
        const captionBtn = await page.$('.ytp-subtitles-button, button[aria-label*="Subtitles"]');
        if (captionBtn) {
          await captionBtn.click();
          await delay(1000);
        }
      } catch (e) {
        // Ignore
      }
    }
  }
  
  if (!originalUrl) {
    throw new Error('Timed out waiting for timedtext request. Captions may not be available for this video.');
  }
  
  // Modify the URL to request Spanish captions
  const modifiedUrl = modifyTimedTextUrl(originalUrl, languageCode);
  console.log('\n  📋 Full Spanish URL:');
  console.log(`  ${modifiedUrl}\n`);
  
  // Fetch the Spanish captions directly
  let timedTextData: any = null;
  
  try {
    const response = await fetch(modifiedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('json') || modifiedUrl.includes('fmt=json3')) {
      timedTextData = await response.json();
    } else {
      const text = await response.text();
      timedTextData = { xml: text };
    }
    
    // Verify language in URL
    const urlObj = new URL(modifiedUrl);
    const lang = urlObj.searchParams.get('lang') || '';
    const isAuto = modifiedUrl.indexOf('caps=asr') !== -1;
    
    console.log(`  ✅ Fetched captions (lang: ${lang}, auto: ${isAuto ? 'Yes' : 'No'})`);
    
  } catch (error) {
    console.error(`  ❌ Error fetching modified URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    throw new Error(`Failed to fetch Spanish captions: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  if (!timedTextData) {
    throw new Error('No caption data received from modified URL');
  }
  
  // Parse the data
  return parseTimedTextData(timedTextData, modifiedUrl);
}

/**
 * Modify timedtext URL to request a different language
 * Preserves all important parameters like pot, potc, signature, etc.
 */
function modifyTimedTextUrl(url: string, targetLanguage: string): string {
  const urlObj = new URL(url);
  
  // Simply replace the lang parameter - keep everything else the same
  // This preserves pot, potc, signature, and all other important parameters
  urlObj.searchParams.set('lang', targetLanguage);
  
  // Update the 'name' parameter if it exists (language name)
  const nameParam = urlObj.searchParams.get('name');
  if (nameParam) {
    const languageNames: Record<string, string> = {
      'es': 'Spanish',
      'en': 'English',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'zh': 'Chinese',
    };
    
    const targetName = languageNames[targetLanguage] || targetLanguage;
    // Try to preserve the format, but replace the language name
    if (nameParam.includes('English')) {
      urlObj.searchParams.set('name', nameParam.replace(/English[^,]*/i, targetName));
    } else if (nameParam.includes('United States') || nameParam.includes('US')) {
      // Replace "English - United States" with just "Spanish"
      urlObj.searchParams.set('name', targetName);
    } else {
      urlObj.searchParams.set('name', targetName);
    }
  }
  
  // Keep caps=asr if it's there - don't remove it
  // The pot/potc parameters are tied to the specific request and should work with any language
  
  return urlObj.toString();
}

/**
 * Parse timedtext data (JSON3 or XML format)
 */
function parseTimedTextData(data: any, url: string): LyricSegment[] {
  console.log('  📝 Parsing timedtext data...');
  
  const segments: LyricSegment[] = [];
  
  // Check if it's JSON3 format
  if (data.events && Array.isArray(data.events)) {
    console.log('  📋 Parsing JSON3 format...');
    
    for (const event of data.events) {
      if (event.segs && Array.isArray(event.segs)) {
        // Combine all segments in this event
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
  // Check if it's XML format
  else if (data.xml || (typeof data === 'string' && data.includes('<?xml'))) {
    console.log('  📋 Parsing XML format...');
    const xmlText = data.xml || data;
    
    // Parse XML
    const textRegex = /<text start="([\d.]+)" dur="([\d.]+)"[^>]*>([^<]*)<\/text>/g;
    let match;
    
    while ((match = textRegex.exec(xmlText)) !== null) {
      const start = parseFloat(match[1]);
      const dur = parseFloat(match[2]);
      const text = match[3].trim();
      
      if (text) {
        segments.push({
          text: text,
          start_ms: Math.round(start * 1000),
          end_ms: Math.round((start + dur) * 1000),
        });
      }
    }
  } else {
    throw new Error('Unknown timedtext format');
  }
  
  // Filter out music markers
  const filteredSegments = segments.filter(
    seg => seg.text && 
    seg.text !== '[Música]' && 
    seg.text !== '[Music]' &&
    seg.text.length > 0
  );
  
  console.log(`  ✅ Parsed ${filteredSegments.length} segments (from ${segments.length} total)`);
  
  return filteredSegments;
}

/**
 * Process a single video
 */
async function processVideo(videoId: string, languageCode: string, browser: Browser, cookies: any[] | null): Promise<boolean> {
  try {
    const page = await browser.newPage();
    
    // Set realistic user agent (latest Chrome)
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    // Set viewport to match common screen size
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Set cookies before navigating (if available)
    if (cookies && cookies.length > 0) {
      try {
        // Filter cookies to only YouTube domain and ensure they have required fields
        const youtubeCookies = cookies
          .filter((cookie: any) => {
            const domain = cookie.domain || '';
            return domain.includes('youtube.com') || domain.includes('.youtube.com') || !domain;
          })
          .map((cookie: any) => {
            // Ensure cookie has required fields for Puppeteer
            return {
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain || '.youtube.com',
              path: cookie.path || '/',
              expires: cookie.expires || cookie.expirationDate || -1,
              httpOnly: cookie.httpOnly || false,
              secure: cookie.secure !== false, // Default to true for YouTube
              sameSite: cookie.sameSite || 'None',
            };
          });
        
        if (youtubeCookies.length > 0) {
          await page.setCookie(...youtubeCookies);
          console.log(`  🍪 Set ${youtubeCookies.length} cookies`);
        }
      } catch (error) {
        console.log('  ⚠️  Warning: Could not set cookies:', error instanceof Error ? error.message : error);
      }
    }
    
    // Remove webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Override plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Override languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      // Override permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission } as PermissionStatus) :
          originalQuery(parameters)
      );
    });
    
    // Set extra headers to look more like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });
    
    // Intercept and get timedtext data
    const segments = await interceptTimedText(page, videoId, languageCode);
    
    await page.close();
    
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
  // Parse arguments more carefully
  // Args can be: [VIDEO_ID] [LANGUAGE_CODE] or just [LANGUAGE_CODE] when reading from file
  const args = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  const headless = !process.argv.includes('--show-browser');
  
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
    const toDownloadPath = path.resolve(__dirname, '../data/toDownload.json');
    
    try {
      const fileContent = await fs.readFile(toDownloadPath, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // Support both { "songs": [...] } and { "videoIds": [...] } formats
      videoIds = data.songs || data.videoIds || [];
      
      if (!Array.isArray(videoIds) || videoIds.length === 0) {
        throw new Error('Invalid format: expected array of video IDs');
      }
      
      console.log(`\n📄 Found ${videoIds.length} video(s) in ${toDownloadPath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error("❌ Error: No video ID provided and toDownload.json not found.");
        console.log("\nUsage:");
        console.log("  Single video: npx ts-node scripts/fetch-lyrics-puppeteer.ts <YOUTUBE_VIDEO_ID> [LANGUAGE_CODE]");
        console.log("  Batch from file: npx ts-node scripts/fetch-lyrics-puppeteer.ts [LANGUAGE_CODE]");
        console.log("\nFile format (data/toDownload.json):");
        console.log('  { "songs": ["VIDEO_ID_1", "VIDEO_ID_2", ...] }');
        process.exit(1);
      } else {
        console.error("❌ Error reading toDownload.json:", error);
        process.exit(1);
      }
    }
  }
  
  console.log(`\n🎵 Processing ${videoIds.length} video(s) using Puppeteer`);
  console.log(`   Language: ${languageCode}`);
  console.log('─'.repeat(50));
  
  let browser: Browser | null = null;
  let successCount = 0;
  let failCount = 0;
  
  try {
    // Launch browser once for all videos with stealth settings
    browser = await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
    });
    
    // Load cookies once
    const cookies = await loadCookies();
    if (cookies) {
      console.log(`  🍪 Using ${cookies.length} cookies for authentication`);
    } else {
      console.log('  ⚠️  No cookies found - videos may be blocked');
      console.log('  💡 Tip: Export cookies from your browser to data/youtube-cookies.json');
    }
    
    // Process each video
    for (let i = 0; i < videoIds.length; i++) {
      const videoId = videoIds[i];
      console.log(`\n[${i + 1}/${videoIds.length}] Processing: ${videoId}`);
      
      const success = await processVideo(videoId, languageCode, browser, cookies);
      
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay between videos to avoid rate limiting
      if (i < videoIds.length - 1) {
        await delay(2000);
      }
    }
    
    // Summary
    console.log('\n' + '─'.repeat(50));
    console.log(`✅ Successfully processed: ${successCount}`);
    if (failCount > 0) {
      console.log(`❌ Failed: ${failCount}`);
    }
    console.log(`📊 Total: ${videoIds.length}`);
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

main();


