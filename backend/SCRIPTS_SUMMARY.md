# Lyrics Processing Scripts - Summary

## What Was Created

I've created and enhanced several scripts to help you process lyrics more flexibly:

### New Scripts

1. **`process-lyrics-folder.ts`** - Batch processing with folder watching
2. **`whisper-transcribe.ts`** - Video download + Whisper transcription

### Enhanced Scripts

3. **`generate-analysis.ts`** - Now supports few-shot learning with examples

## Installation Requirements

### For Whisper Transcription Script

You'll need to install `yt-dlp`:

```bash
# macOS
brew install yt-dlp

# Or using pip
pip install yt-dlp
```

### Optional: Form-Data Package (for older Node.js)

If you're using Node.js < 18, you may need:

```bash
cd backend
npm install form-data
```

## Environment Variables

Add to `backend/.env`:

```bash
# LLM Provider (openai or ollama)
LLM_PROVIDER=ollama  # or 'openai'

# For OpenAI
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4-turbo  # Optional, defaults to gpt-4-turbo

# For Ollama (local LLM)
OLLAMA_BASE_URL=http://localhost:11434/v1  # Optional, defaults to localhost
OLLAMA_MODEL=llama3.2:3b  # Optional, defaults to llama3.2:3b

# System resource thresholds (for Ollama)
MIN_FREE_MEMORY_MB=1024        # Minimum free RAM in MB
MAX_MEMORY_USAGE_PERCENT=85    # Max memory usage %

# Optional: For self-hosted Whisper
WHISPER_API_URL=http://localhost:8000

# Optional: For original fetch-lyrics script
YOUTUBE_COOKIE=your_cookie_here

# Optional: For scheduled processing
MAX_SONGS_PER_RUN=3  # Max songs to process per scheduled run
```

## Quick Start Guide

### Option 1: Manual Lyrics + Batch Processing

1. **Place your lyrics files** in `backend/data/lyrics-to-analyze/`
   - Format: `VIDEO_ID.json`
   - Structure: Array of `{ text, start_ms, end_ms }` objects

2. **Run the processor:**
   ```bash
   cd backend
   npx ts-node scripts/process-lyrics-folder.ts
   ```

3. **Results:**
   - Processed files → `data/processed-lyrics/`
   - Final analysis → `data/songs/VIDEO_ID.json`
   - Language stats → `data/language-stats.json`

### Option 2: Whisper Transcription

1. **Transcribe a video:**
   ```bash
   cd backend
   npx ts-node scripts/whisper-transcribe.ts VIDEO_ID es
   ```
   (Replace `es` with language code, or omit for auto-detect)

2. **Move to analyze folder:**
   ```bash
   mv data/raw-lyrics/VIDEO_ID.json data/lyrics-to-analyze/
   ```

3. **Process:**
   ```bash
   npx ts-node scripts/process-lyrics-folder.ts
   ```

### Option 3: Watch Mode (Automated)

```bash
cd backend
npx ts-node scripts/process-lyrics-folder.ts --watch
```

This will check for new files every 30 seconds and process them automatically.

## Few-Shot Learning Examples

### Where to Put Examples

Place example JSON files in: `backend/data/analysis-examples/`

### Example File Format

See `backend/data/analysis-examples/example-1.json` for a complete example.

Each file should contain:
```json
{
  "analysis": [
    {
      "spanish": "Spanish lyric line",
      "english": "English translation",
      "explanation": "Detailed explanation or null"
    }
  ]
}
```

### How Many Examples?

- **1-5 examples**: Good for establishing format
- **5-10 examples**: Better consistency
- **10+ examples**: Consider switching to RAG/MCP

The scripts automatically load up to 5 examples. See `backend/data/analysis-examples/README.md` for detailed guidance on when to switch to RAG/MCP.

## Language Monitoring

The `process-lyrics-folder.ts` script automatically:
- Detects language from lyrics (simple heuristic)
- Tracks statistics in `data/language-stats.json`
- Displays stats in console output

**Current language detection** uses simple pattern matching for Spanish. You can enhance this by:
- Adding more language patterns
- Using a proper language detection library (e.g., `franc`, `langdetect`)

## Folder Structure

```
backend/data/
├── raw-lyrics/              # From fetch-lyrics.ts
├── transcribed-lyrics/      # From whisper-transcribe.ts
├── lyrics-to-analyze/       # ⭐ Place files here for processing
├── processed-lyrics/        # Moved after processing
├── lyrics-errors/           # Failed attempts
├── songs/                   # Final output (used by app)
├── analysis-examples/       # Few-shot learning examples
└── language-stats.json      # Language statistics
```

## Script Details

### `process-lyrics-folder.ts`

**Features:**
- Processes all JSON files in `lyrics-to-analyze/` folder
- Fetches video metadata automatically
- Supports few-shot learning
- Tracks language statistics
- Watch mode for continuous processing
- Error handling with error folder
- **NEW:** Supports Ollama (local LLM) and OpenAI
- **NEW:** System resource monitoring for Ollama

**Usage:**
```bash
# Basic
npx ts-node scripts/process-lyrics-folder.ts

# Watch mode
npx ts-node scripts/process-lyrics-folder.ts --watch

# Wait for system resources (Ollama)
npx ts-node scripts/process-lyrics-folder.ts --wait-for-resources

# Skip resource check (not recommended)
npx ts-node scripts/process-lyrics-folder.ts --skip-resource-check
```

### `scheduled-processor.ts` (New)

**Features:**
- Runs analysis on a schedule
- Checks system resources before processing
- Limits number of songs per run
- Can run as daemon or one-time (for cron)

**Usage:**
```bash
# One-time run (good for cron)
npx ts-node scripts/scheduled-processor.ts

# Daemon mode (checks every hour)
npx ts-node scripts/scheduled-processor.ts --daemon

# Custom interval (30 minutes)
npx ts-node scripts/scheduled-processor.ts --daemon --interval=30
```

### `whisper-transcribe.ts`

**Features:**
- Downloads video audio using yt-dlp
- Transcribes with self-hosted Whisper or OpenAI
- Saves in compatible format
- Includes metadata

**Usage:**
```bash
# Self-hosted Whisper
npx ts-node scripts/whisper-transcribe.ts VIDEO_ID [LANGUAGE]

# OpenAI Whisper
npx ts-node scripts/whisper-transcribe.ts VIDEO_ID [LANGUAGE] --openai
```

**Whisper API Compatibility:**
The script expects a Whisper API compatible with OpenAI's format:
- Endpoint: `POST /v1/audio/transcriptions`
- Accepts: `audio_file` (multipart/form-data)
- Returns: JSON with `segments` array

If your Whisper API uses a different format, adjust the `transcribeWithWhisper` function.

### `generate-analysis.ts` (Enhanced)

**New Features:**
- Loads examples from `analysis-examples/` folder
- Includes examples in prompt for few-shot learning
- Better error handling
- **NEW:** Supports Ollama (local LLM) and OpenAI
- **NEW:** System resource monitoring for Ollama

**Usage:**
```bash
npx ts-node scripts/generate-analysis.ts VIDEO_ID
```

## Ollama (Local LLM) Support

All analysis scripts now support running on Ollama locally, which is great for:
- **Cost savings:** No API costs
- **Privacy:** Data stays local
- **Batch processing:** Run overnight when machine is idle

### Quick Setup

1. **Install Ollama:**
   ```bash
   brew install ollama
   ```

2. **Pull a model:**
   ```bash
   ollama pull llama3.2:3b  # Small model for low RAM
   ```

3. **Configure:**
   ```bash
   # In backend/.env
   LLM_PROVIDER=ollama
   OLLAMA_MODEL=llama3.2:3b
   ```

4. **Test:**
   ```bash
   npx ts-node scripts/generate-analysis.ts VIDEO_ID
   ```

See `OLLAMA_SETUP.md` for detailed setup, scheduling, and troubleshooting.

## Next Steps

1. **Install yt-dlp** if you want to use Whisper transcription
2. **Set up environment variables** in `.env`
3. **Add example files** to `data/analysis-examples/` for better results
4. **Test with a single file** in `lyrics-to-analyze/`
5. **Set up watch mode** if you want continuous processing

## Questions?

- See `backend/scripts/README.md` for detailed script documentation
- See `backend/data/analysis-examples/README.md` for few-shot learning guide
- Check `data/language-stats.json` for processing statistics

