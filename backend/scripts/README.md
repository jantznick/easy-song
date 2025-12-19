# Lyrics Processing Scripts

This directory contains scripts for fetching, transcribing, and analyzing song lyrics from YouTube videos.

## Scripts Overview

### 1. `fetch-lyrics.ts` (Original)
Fetches lyrics directly from YouTube captions/subtitles.

**Usage:**
```bash
npx ts-node scripts/fetch-lyrics.ts <YOUTUBE_VIDEO_ID>
```

**Requirements:**
- `YOUTUBE_COOKIE` environment variable set

### 2. `whisper-transcribe.ts` (New)
Downloads YouTube videos and transcribes them using a self-hosted Whisper API or OpenAI Whisper.

**Usage:**
```bash
# Using self-hosted Whisper (default)
npx ts-node scripts/whisper-transcribe.ts <YOUTUBE_VIDEO_ID> [LANGUAGE]

# Using OpenAI Whisper API
npx ts-node scripts/whisper-transcribe.ts <YOUTUBE_VIDEO_ID> [LANGUAGE] --openai
```

**Requirements:**
- `yt-dlp` installed (`pip install yt-dlp` or `brew install yt-dlp`)
- `WHISPER_API_URL` environment variable (defaults to `http://localhost:8000`)
- `OPENAI_API_KEY` (if using `--openai` flag)

**Output:**
- Saves to `data/raw-lyrics/<VIDEO_ID>.json` (compatible with existing scripts)
- Also saves to `data/transcribed-lyrics/<VIDEO_ID>.json` (with metadata)

### 3. `generate-analysis.ts` (Enhanced)
Generates translations and analysis using OpenAI. Now supports few-shot learning with examples.

**Usage:**
```bash
npx ts-node scripts/generate-analysis.ts <YOUTUBE_VIDEO_ID>
```

**Requirements:**
- `OPENAI_API_KEY` environment variable
- Lyrics file in `data/raw-lyrics/<VIDEO_ID>.json`
- Optional: Example files in `data/analysis-examples/` for few-shot learning

### 4. `process-lyrics-folder.ts` (New)
Automatically processes all lyrics files from a folder, generating analysis and organizing output.

**Usage:**
```bash
# Process all files once
npx ts-node scripts/process-lyrics-folder.ts

# Watch folder and process new files automatically
npx ts-node scripts/process-lyrics-folder.ts --watch
```

**Requirements:**
- `OPENAI_API_KEY` environment variable
- Lyrics files in `data/lyrics-to-analyze/` folder

**Workflow:**
1. Place lyrics JSON files in `data/lyrics-to-analyze/`
2. Run the script
3. Processed files are moved to `data/processed-lyrics/`
4. Final analysis saved to `data/songs/`
5. Language statistics tracked in `data/language-stats.json`

## Folder Structure

```
backend/data/
├── raw-lyrics/              # Original lyrics from fetch-lyrics.ts
├── transcribed-lyrics/      # Lyrics from whisper-transcribe.ts (with metadata)
├── lyrics-to-analyze/       # Place lyrics here for batch processing
├── processed-lyrics/        # Moved here after processing
├── lyrics-errors/           # Failed processing attempts
├── songs/                   # Final analyzed songs (used by app)
├── analysis-examples/       # Few-shot learning examples
└── language-stats.json      # Language processing statistics
```

## Environment Variables

Add these to your `.env` file in the `backend` directory:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key

# Optional (for fetch-lyrics.ts)
YOUTUBE_COOKIE=your_youtube_cookie_string

# Optional (for whisper-transcribe.ts)
WHISPER_API_URL=http://localhost:8000  # Your self-hosted Whisper API
```

## Few-Shot Learning Examples

To improve analysis quality, add example analysis files to `data/analysis-examples/`. See `data/analysis-examples/README.md` for details.

**Quick Start:**
1. Create a JSON file with a complete analysis example
2. Place it in `data/analysis-examples/`
3. The scripts will automatically load up to 5 examples

## Language Monitoring

The `process-lyrics-folder.ts` script automatically tracks:
- Languages detected in processed songs
- Count of songs per language
- Last processed timestamp per language

View stats in `data/language-stats.json` or in the console output.

## Workflow Examples

### Workflow 1: Manual Lyrics + Batch Processing
```bash
# 1. Manually create/obtain lyrics file
# Place in: data/lyrics-to-analyze/VIDEO_ID.json

# 2. Process all files
npx ts-node scripts/process-lyrics-folder.ts
```

### Workflow 2: Whisper Transcription
```bash
# 1. Transcribe video
npx ts-node scripts/whisper-transcribe.ts VIDEO_ID es

# 2. Move to analyze folder (or process directly)
mv data/raw-lyrics/VIDEO_ID.json data/lyrics-to-analyze/

# 3. Process
npx ts-node scripts/process-lyrics-folder.ts
```

### Workflow 3: Watch Mode (Automated)
```bash
# Start watch mode
npx ts-node scripts/process-lyrics-folder.ts --watch

# In another terminal, add lyrics files to data/lyrics-to-analyze/
# They will be processed automatically every 30 seconds
```

## Notes

- **Whisper API Format**: The script expects a Whisper API compatible with OpenAI's format. If your self-hosted Whisper uses a different format, you may need to adjust the API call.
- **Language Detection**: Currently uses simple heuristics. Can be enhanced with proper language detection libraries.
- **Error Handling**: Failed files are moved to `data/lyrics-errors/` for review.

