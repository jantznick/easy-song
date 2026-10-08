# Content Generation

This directory contains scripts and data for generating song content from YouTube videos.

## Structure

```
content-generation/
├── scripts/              # TypeScript scripts for processing
│   ├── download-and-transcribe.ts
│   ├── analyze-song.ts
│   ├── translate-song.ts
│   ├── process-playlist.ts   # Cron-friendly playlist runner
│   └── utils/
│       ├── llm-client.ts
│       └── section-titles.ts
├── data/                 # Processing data files and examples
│   ├── raw-lyrics/          # Simple transcription segments
│   ├── transcribed-lyrics/  # Transcriptions with metadata
│   ├── analyzed-lyrics/     # Analysis + sections (intermediate)
│   ├── analysis-examples/   # Few-shot examples for analysis
│   └── structure-examples/  # Examples for section identification
├── cookies.txt           # Optional Netscape cookies for yt-dlp (gitignored)
└── backend/data/         # Final output (used by app)
    ├── songs/               # Final song files
    └── study/               # Study mode files
```

## Workflow

1. **Download & Transcribe** (`download-and-transcribe.ts`)
   - Downloads YouTube video audio (via yt-dlp)
   - Transcribes with OpenAI Whisper
   - Saves to `transcribed-lyrics/`
   - Automatically calls `analyze-song.ts`

2. **Analyze** (`analyze-song.ts`)
   - Reads from `transcribed-lyrics/`
   - Generates explanations and identifies sections
   - Saves to `analyzed-lyrics/`
   - Automatically calls `translate-song.ts` (unless `--skip-translation`)

3. **Translate** (`translate-song.ts`)
   - Reads from `analyzed-lyrics/`
   - Generates translations in all languages
   - Saves final output to `data/songs/`

## Usage

### Single Video Processing

```bash
cd content-generation
npm install
npx tsx scripts/download-and-transcribe.ts VIDEO_ID [--lang=es] [--clean-slate] [--skip-translation] [--cookies=cookies.txt]
```

Or via npm script:

```bash
npm run process:video -- VIDEO_ID --lang=es --skip-translation
```

This runs the full pipeline: download → transcribe → analyze → translate  
(Use `--skip-translation` to stop after analysis when you only need one language.)

### Playlist / Cron Job

Fetch every video in a YouTube playlist and run the pipeline against each one:

```bash
npm run process:playlist -- 'https://www.youtube.com/playlist?list=PLxxxx' \
  --lang=es \
  --skip-translation \
  --cookies=cookies.txt
```

A bare playlist ID also works:

```bash
npm run process:playlist -- PLxxxx --lang=es --skip-translation
```

**Useful flags:**

| Flag | Description |
|------|-------------|
| `--skip-translation` | Stop after analysis; skip multi-language translation |
| `--lang=es` | Whisper / source language (default: `es`) |
| `--cookies=PATH` | Netscape `cookies.txt` for yt-dlp (also auto-detects `./cookies.txt`) |
| `--clean-slate` | Re-process even if outputs already exist |
| `--limit=N` | Only process the first N videos |
| `--dry-run` | List playlist video IDs without processing |

Videos already complete are skipped by default:
- with `--skip-translation`: skips if `analyzed-lyrics/<id>.json` exists
- otherwise: skips if `data/songs/<id>.json` exists

**Cron example** (daily at 3am):

```cron
0 3 * * * cd /path/to/content-generation && /usr/bin/npx tsx scripts/process-playlist.ts 'PLxxxx' --skip-translation --lang=es >> logs/playlist-cron.log 2>&1
```

Run logs are also appended to `logs/playlist-cron.log`.

### Manual Steps

```bash
# Step 1: Download & Transcribe
npx tsx scripts/download-and-transcribe.ts VIDEO_ID --skip-translation

# Step 2: Analyze (if not auto-called)
npx tsx scripts/analyze-song.ts VIDEO_ID --skip-translation

# Step 3: Translate (if not auto-called)
npx tsx scripts/translate-song.ts VIDEO_ID
```

## YouTube cookies

yt-dlp often needs browser cookies for age-restricted or bot-challenged videos.

1. Export a Netscape-format `cookies.txt` (e.g. with a browser extension or `yt-dlp --cookies-from-browser chrome`).
2. Place it at `content-generation/cookies.txt`, **or** pass `--cookies=/path/to/cookies.txt`, **or** set `YTDLP_COOKIES` / `COOKIES_FILE`.

`cookies.txt` is gitignored — do not commit it.

## Environment Variables

Create a `.env` file in the `content-generation/` directory:

```bash
OPENAI_API_KEY=your_openai_api_key
# Optional:
# YTDLP_COOKIES=/path/to/cookies.txt
```

## Examples

### Analysis Examples
Place example analysis files in `data/analysis-examples/` to help the LLM understand the expected format and quality.

### Structure Examples
Place example section structure files in `data/structure-examples/` to help the LLM identify song sections (Intro, Verse, Chorus, etc.).

See the README files in each examples directory for format details.
