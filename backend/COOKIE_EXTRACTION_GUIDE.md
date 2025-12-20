# How to Extract YouTube Cookies for Puppeteer

YouTube may block automated browsers. Using cookies from your real browser session can help avoid this.

## Method 1: Using Browser Extension (Easiest)

### Chrome/Edge:
1. Install the "Get cookies.txt LOCALLY" extension
   - Chrome: https://chrome.google.com/webstore/detail/get-cookiestxt-locally/cclelndahbckbenkjhflpdbgdldlbecc
   - Edge: Similar extension available
2. Go to https://www.youtube.com
3. Click the extension icon
4. Click "Export" → "Export as JSON"
5. Save the file as `data/youtube-cookies.json`

### Firefox:
1. Install "cookies.txt" extension
2. Go to https://www.youtube.com
3. Click the extension → Export as JSON
4. Save as `data/youtube-cookies.json`

## Method 2: Manual Export (Chrome DevTools)

1. Open Chrome and go to https://www.youtube.com
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to **Application** tab (or **Storage** in Firefox)
4. Click **Cookies** → `https://www.youtube.com`
5. Right-click → **Copy all as cURL** or manually copy cookies
6. Convert to JSON format (see format below)

## Method 3: Using Puppeteer to Extract (Advanced)

Run this script while logged into YouTube in your regular browser:

```javascript
// extract-cookies.js
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  // Navigate to YouTube and log in manually
  await page.goto('https://www.youtube.com');
  console.log('Log in to YouTube, then press Enter...');
  await new Promise(resolve => process.stdin.once('data', resolve));
  
  // Get cookies
  const cookies = await page.cookies();
  console.log(JSON.stringify(cookies, null, 2));
  
  await browser.close();
})();
```

## Cookie File Format

The script expects cookies in JSON format. Save as `data/youtube-cookies.json`:

**Option 1: Array format (recommended)**
```json
[
  {
    "name": "VISITOR_INFO1_LIVE",
    "value": "abc123...",
    "domain": ".youtube.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": false,
    "secure": true,
    "sameSite": "None"
  },
  {
    "name": "YSC",
    "value": "xyz789...",
    "domain": ".youtube.com",
    "path": "/",
    "expires": -1,
    "httpOnly": false,
    "secure": true,
    "sameSite": "None"
  }
]
```

**Option 2: Object with cookies array**
```json
{
  "cookies": [
    {
      "name": "VISITOR_INFO1_LIVE",
      "value": "abc123...",
      "domain": ".youtube.com"
    }
  ]
}
```

## Important Cookies

Make sure these cookies are included (if available):
- `VISITOR_INFO1_LIVE` - Visitor tracking
- `YSC` - Session cookie
- `LOGIN_INFO` - Login status (if logged in)
- `PREF` - Preferences
- `__Secure-3PSID` - Secure session (if logged in)
- `__Secure-3PAPISID` - API session (if logged in)

## Notes

- Cookies expire, so you may need to refresh them periodically
- If you're logged into YouTube, the cookies will include your session
- The script will automatically filter cookies to only YouTube domain
- Cookies are loaded from `data/youtube-cookies.json` or `YOUTUBE_COOKIES` environment variable

## Environment Variable Alternative

You can also set cookies via environment variable:

```bash
export YOUTUBE_COOKIES='[{"name":"VISITOR_INFO1_LIVE","value":"...","domain":".youtube.com"}]'
```

## Troubleshooting

- **Still getting blocked?** Make sure cookies are fresh (exported recently)
- **Cookies not working?** Check that domain is `.youtube.com` or `youtube.com`
- **Missing cookies?** Try logging out and back into YouTube, then re-export

