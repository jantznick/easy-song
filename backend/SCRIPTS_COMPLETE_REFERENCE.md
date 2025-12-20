# Complete Scripts Reference

This document provides a comprehensive reference for all scripts in the `backend/scripts/` directory, including their functions, inputs, outputs, and basic flow.

---

## Table of Contents

1. [Main Scripts](#main-scripts)
   - [fetch-lyrics.ts](#fetch-lyricsts)
   - [fetch-lyrics-puppeteer.ts](#fetch-lyrics-puppeteerts)
   - [fetch-or-transcribe.ts](#fetch-or-transcribets)
   - [whisper-transcribe.ts](#whisper-transcribets)
   - [generate-analysis.ts](#generate-analysists)
   - [process-lyrics-folder.ts](#process-lyrics-folderts)
   - [full-pipeline.ts](#full-pipelinets)
   - [scheduled-processor.ts](#scheduled-processorts)
   - [migrate-to-i18n.ts](#migrate-to-i18nts)
   - [generate-songs-list.ts](#generate-songs-listts)
   - [populate-song-lyrics.ts](#populate-song-lyricsts)

2. [Utility Modules](#utility-modules)
   - [utils/llm-client.ts](#utilsllm-clientts)
   - [utils/system-resources.ts](#utilssystem-resourcests)
   - [utils/translations.ts](#utilstranslationsts)
   - [utils/section-titles.ts](#utilssection-titlests)
   - [utils/data-migration.ts](#utilsdata-migrationts)

---

## Main Scripts

### fetch-lyrics.ts

**Purpose**: Fetches Spanish lyrics/transcripts directly from YouTube captions.

**Usage**:
```bash
npx ts-node scripts/fetch-lyrics.ts <YOUTUBE_VIDEO_ID>
```

**Inputs**:
- Command line: `videoId` (YouTube video ID)
- Environment: `YOUTUBE_COOKIE` (required - YouTube authentication cookie)

**Outputs**:
- File: `data/raw-lyrics/{videoId}.json`
- Format: Array of `{ text: string, start_ms: number, end_ms: number }`

**Functions**:
- `main()` - Entry point
  - Validates inputs
  - Creates YouTube client with cookie
  - Fetches video info and captions
  - Finds Spanish caption tracks
  - Downloads and parses caption data (XML or JSON3 format)
  - Converts to structured format with timestamps
  - Saves to file

**Flow**:
1. Validate video ID and cookie
2. Create authenticated YouTube client
3. Fetch video info and captions
4. Find Spanish caption tracks (by language code/name)
5. Select best track (prefer 'es', then 'es-ES', then first available)
6. Fetch caption data (try XML format first, fallback to JSON3)
7. Parse caption segments with timestamps
8. Filter out music markers ([Música], [Music])
9. Convert to structured format
10. Save to `data/raw-lyrics/{videoId}.json`

**Dependencies**: `youtubei.js`, `fs/promises`, `path`

---

### fetch-lyrics-puppeteer.ts

**Purpose**: Fetches lyrics by intercepting YouTube's timedtext network requests using browser automation. More reliable than API-based methods and doesn't require cookies.

**Usage**:
```bash
npx ts-node scripts/fetch-lyrics-puppeteer.ts <YOUTUBE_VIDEO_ID> [LANGUAGE_CODE] [--show-browser]
```

**Inputs**:
- Command line: `videoId` (required), `LANGUAGE_CODE` (optional, default: 'es'), `--show-browser` (optional, show browser window)
- No environment variables required

**Outputs**:
- File: `data/raw-lyrics/{videoId}.json`
- Format: Array of `{ text: string, start_ms: number, end_ms: number }`

**Functions**:
- `delay(ms: number): Promise<void>` - Helper function to wait (replaces deprecated waitForTimeout)
- `enableCaptions(page: Page, languageCode: string): Promise<void>` - Enables captions and selects language
  - Waits for video player
  - Finds and clicks captions button
  - Opens settings menu
  - Selects requested language (prefers Spanish)
  - Handles various YouTube UI selectors
  
- `interceptTimedText(page: Page, videoId: string, languageCode: string): Promise<LyricSegment[]>` - Intercepts network requests
  - Sets up request/response interception
  - Navigates to YouTube video
  - Enables captions
  - Waits for timedtext API call
  - Filters by language and auto-generated status
  - Prefers non-auto-generated captions in requested language
  
- `parseTimedTextData(data: any, url: string): LyricSegment[]` - Parses caption data
  - Handles JSON3 format (events array)
  - Handles XML format (text elements)
  - Filters out music markers
  - Converts to structured format with timestamps
  
- `main()` - Entry point
  - Launches Puppeteer browser
  - Sets up page
  - Intercepts timedtext requests
  - Saves result to file

**Flow**:
1. Launch Puppeteer browser (headless by default)
2. Create new page and set user agent
3. Set up network request interception
4. Navigate to YouTube video URL
5. Wait for video player to load
6. Enable captions (click CC button)
7. Open captions settings menu
8. Select Spanish language (or requested language)
9. Wait for timedtext network request
10. Filter requests by:
    - Language preference (requested language first)
    - Auto-generated status (prefer non-auto-generated)
11. Extract caption data from response
12. Parse JSON3 or XML format
13. Convert to structured format with timestamps
14. Filter out music markers
15. Save to `data/raw-lyrics/{videoId}.json`

**Features**:
- No cookie required (uses browser session)
- Automatically selects language
- Prefers non-auto-generated captions
- Intercepts actual network requests YouTube makes
- Handles both JSON3 and XML formats
- Shows browser window with `--show-browser` flag

**Dependencies**: `puppeteer`, `fs/promises`, `path`

---

### fetch-or-transcribe.ts

**Purpose**: Hybrid script that tries YouTube transcripts first, falls back to Whisper if unavailable.

**Usage**:
```bash
npx ts-node scripts/fetch-or-transcribe.ts <YOUTUBE_VIDEO_ID> [--whisper] [--lang=es]
```

**Inputs**:
- Command line: `videoId` (required), `--whisper` (optional, skip YouTube), `--lang=es` (optional, Whisper language)
- Environment: `YOUTUBE_COOKIE` (optional), `WHISPER_API_URL` (default: `http://localhost:8000`)

**Outputs**:
- File: `data/raw-lyrics/{videoId}.json`
- Format: Array of `{ text: string, start_ms: number, end_ms: number }`

**Functions**:
- `fetchYouTubeTranscripts(videoId: string): Promise<LyricSegment[] | null>`
  - Tries to fetch YouTube transcripts
  - Returns null if unavailable or fails
  - Same logic as `fetch-lyrics.ts`
  
- `transcribeWithWhisper(videoId: string, language?: string): Promise<LyricSegment[]>`
  - Downloads video using yt-dlp
  - Transcribes with Whisper API
  - Returns structured segments
  
- `main()` - Entry point
  - Tries YouTube first (unless `--whisper` flag)
  - Falls back to Whisper if YouTube fails
  - Saves result to file

**Flow**:
1. Parse command line arguments
2. If `--whisper` flag: Skip to Whisper
3. Otherwise: Try `fetchYouTubeTranscripts()`
4. If YouTube succeeds: Use result
5. If YouTube fails: Call `transcribeWithWhisper()`
6. Save segments to `data/raw-lyrics/{videoId}.json`

**Dependencies**: `youtubei.js`, `fs/promises`, `path`, `child_process`, `util`

---

### whisper-transcribe.ts

**Purpose**: Downloads YouTube videos and transcribes them using Whisper (self-hosted or OpenAI).

**Usage**:
```bash
npx ts-node scripts/whisper-transcribe.ts <YOUTUBE_VIDEO_ID> [LANGUAGE] [--openai]
```

**Inputs**:
- Command line: `videoId` (required), `LANGUAGE` (optional, e.g., 'es', 'en'), `--openai` (optional, use OpenAI API)
- Environment: `WHISPER_API_URL` (default: `http://localhost:8000`), `OPENAI_API_KEY` (if using `--openai`)

**Outputs**:
- File: `data/raw-lyrics/{videoId}.json` (compatible format)
- File: `data/transcribed-lyrics/{videoId}.json` (with metadata)
- Audio file: `data/youtube-videos/{videoId}/{videoId}.wav` (downloaded audio)

**Functions**:
- `checkYtDlp(): Promise<boolean>` - Checks if yt-dlp is installed
- `downloadVideo(videoId: string): Promise<string>` - Downloads video audio using yt-dlp
- `transcribeWithWhisper(audioFilePath: string, language?: string): Promise<WhisperResponse>` - Transcribes with self-hosted Whisper
- `transcribeWithOpenAIWhisper(audioFilePath: string, language?: string): Promise<WhisperResponse>` - Transcribes with OpenAI Whisper API
- `convertToLyricSegments(whisperResponse: WhisperResponse): Array<{text, start_ms, end_ms}>` - Converts Whisper response to our format
- `getVideoMetadata(videoId: string)` - Fetches video title, artist, thumbnail
- `main()` - Entry point

**Flow**:
1. Validate inputs and check for yt-dlp
2. Download video audio (WAV format)
3. Transcribe with Whisper (self-hosted or OpenAI)
4. Convert segments to our format (with timestamps)
5. Get video metadata
6. Save to `data/raw-lyrics/{videoId}.json` (compatible format)
7. Save to `data/transcribed-lyrics/{videoId}.json` (with metadata)

**Dependencies**: `fs/promises`, `path`, `child_process`, `util`, `youtubei.js`

---

### generate-analysis.ts

**Purpose**: Generates translations and analysis for a single song using AI (OpenAI or Ollama).

**Usage**:
```bash
npx ts-node scripts/generate-analysis.ts <YOUTUBE_VIDEO_ID>
```

**Inputs**:
- Command line: `videoId` (required)
- Files: `data/raw-lyrics/{videoId}.json` (must exist)
- Files: `prompt.txt` (prompt template)
- Files: `data/analysis-examples/*.json` (optional, for few-shot learning)
- Environment: `OPENAI_API_KEY` or `LLM_PROVIDER=ollama`, `OLLAMA_BASE_URL`, `OLLAMA_MODEL`

**Outputs**:
- File: `data/songs/{videoId}.json`
- Format: Complete song data with i18n structure

**Functions**:
- `loadAnalysisExamples(): Promise<string>` - Loads example files for few-shot learning
  - Reads up to 5 example JSON files from `data/analysis-examples/`
  - Formats them as string for prompt
  - Returns empty string if no examples
  
- `main()` - Entry point
  - Reads lyrics file
  - Loads prompt template
  - Fetches video metadata
  - Loads examples
  - Builds final prompt
  - Checks system resources (if Ollama)
  - Calls LLM API
  - Combines analysis with original lyrics
  - Converts to i18n format
  - Saves final song data

**Flow**:
1. Read `data/raw-lyrics/{videoId}.json`
2. Read `prompt.txt` template
3. Fetch video metadata (title, artist, thumbnail)
4. Load analysis examples (if available)
5. Build final prompt with lyrics and examples
6. Check system resources (if using Ollama)
7. Call LLM API (OpenAI or Ollama)
8. Parse AI response
9. Create lookup map from AI analysis
10. Match AI analysis to original lyrics (normalized text matching)
11. Build final lines with i18n format:
    - `es`: Original Spanish text
    - `en`: English translation
    - `explanation`: i18n object `{ en: "..." }`
    - `start_ms`, `end_ms`: Timestamps
12. Build song data structure
13. Save to `data/songs/{videoId}.json`

**Dependencies**: `youtubei.js`, `fs/promises`, `path`, `utils/llm-client`, `utils/system-resources`, `utils/section-titles`

---

### process-lyrics-folder.ts

**Purpose**: Batch processes all lyrics files from a folder, generating analysis and organizing output.

**Usage**:
```bash
npx ts-node scripts/process-lyrics-folder.ts [--watch] [--wait-for-resources] [--skip-resource-check]
```

**Inputs**:
- Files: `data/lyrics-to-analyze/*.json` (lyrics files to process)
- Files: `prompt.txt` (prompt template)
- Files: `data/analysis-examples/*.json` (optional)
- Environment: LLM configuration (same as `generate-analysis.ts`)
- Environment: `MIN_FREE_MEMORY_MB`, `MAX_MEMORY_USAGE_PERCENT` (for Ollama)

**Outputs**:
- Files: `data/songs/{videoId}.json` (final analyzed songs)
- Files: `data/processed-lyrics/{videoId}.json` (moved after processing)
- Files: `data/lyrics-errors/{videoId}.json` (failed processing attempts)
- File: `data/language-stats.json` (language statistics)

**Functions**:
- `loadLanguageStats(): Promise<LanguageStats>` - Loads language statistics from file
- `updateLanguageStats(language: string)` - Updates language statistics
- `loadAnalysisExamples(): Promise<string>` - Same as in `generate-analysis.ts`
- `detectLanguage(text: string): string` - Simple language detection (heuristic)
- `processLyricsFile(filePath: string)` - Processes a single lyrics file
  - Reads lyrics file
  - Detects language
  - Fetches video metadata
  - Loads examples
  - Calls LLM API
  - Combines analysis
  - Saves to `data/songs/`
  - Moves file to `data/processed-lyrics/`
  - Updates language stats
  - On error: moves to `data/lyrics-errors/`
  
- `main()` - Entry point
  - Checks system resources (if Ollama)
  - Processes all files in `data/lyrics-to-analyze/`
  - Optionally watches folder for new files (--watch mode)
  - Displays language statistics

**Flow**:
1. Check system resources (if using Ollama)
2. Read all JSON files from `data/lyrics-to-analyze/`
3. For each file:
   - Call `processLyricsFile()`
   - Save to `data/songs/`
   - Move to `data/processed-lyrics/`
   - Update language stats
4. Display language statistics
5. If `--watch`: Poll folder every 30 seconds

**Dependencies**: `fs/promises`, `path`, `youtubei.js`, `utils/llm-client`, `utils/system-resources`, `utils/section-titles`

---

### full-pipeline.ts

**Purpose**: Complete end-to-end pipeline from YouTube video ID to final i18n'd song files.

**Usage**:
```bash
# From input file
npx ts-node scripts/full-pipeline.ts

# Single video
npx ts-node scripts/full-pipeline.ts <VIDEO_ID>

# Skip download (use existing transcription)
npx ts-node scripts/full-pipeline.ts --skip-download
```

**Inputs**:
- File: `data/toDownload.json` (format: `{ "videoIds": ["ID1", "ID2", ...] }`) OR command line video ID
- Environment: `PIPELINE_INPUT_FILE` (optional, defaults to `data/toDownload.json`)
- Environment: `WHISPER_API_URL`, LLM configuration, translation configuration

**Outputs**:
- Files: `data/downloads/{videoId}/{videoId}.wav` (downloaded audio)
- Files: `data/transcriptions/{videoId}.json` (transcriptions with timestamps)
- Files: `data/analyzed/{videoId}.json` (AI analysis)
- Files: `data/songs/{videoId}.json` (final song file, i18n)
- Files: `data/study/{videoId}.json` (final study file, i18n, if sections identified)

**Functions**:
- `downloadVideo(videoId: string): Promise<string>` - Downloads video audio using yt-dlp
- `transcribeWithWhisper(audioFilePath: string, language?: string): Promise<TranscriptionSegment[]>` - Transcribes with Whisper API
- `analyzeLyrics(segments: TranscriptionSegment[], videoId: string): Promise<{analysis, title, artist, thumbnailUrl}>` - Analyzes lyrics with AI
  - Fetches video metadata
  - Loads prompt template and examples
  - Calls LLM API
  - Returns analysis and metadata
  
- `translateToAllLanguages(...): Promise<{songs, study}>` - Translates to all supported languages
  - Creates analysis map
  - Translates unique explanations
  - Builds final lines with i18n
  - Builds songs file
  - Builds study file (if sections identified)
  - Translates section explanations
  
- `processVideo(videoId: string, skipDownload: boolean): Promise<void>` - Processes a single video
  - Downloads video (or uses existing transcription)
  - Transcribes with Whisper
  - Analyzes with AI
  - Translates to all languages
  - Saves final files
  
- `main()` - Entry point
  - Reads input file or uses command line video ID
  - Processes all videos
  - Handles errors

**Flow**:
1. Read input file or get video ID from command line
2. For each video:
   - **Step 1**: Download video audio (or skip if transcription exists)
   - **Step 2**: Transcribe with Whisper (saves to `data/transcriptions/`)
   - **Step 3**: Analyze lyrics with AI (saves to `data/analyzed/`)
   - **Step 4**: Translate to all languages:
     - Translate unique explanations
     - Build final lines with i18n format
     - Build songs file
     - Build study file (if sections found)
     - Translate section explanations
   - Save final files to `data/songs/` and `data/study/`

**Dependencies**: `fs/promises`, `path`, `child_process`, `util`, `youtubei.js`, `utils/llm-client`, `utils/translations`, `utils/section-titles`

---

### scheduled-processor.ts

**Purpose**: Runs analysis on a schedule (for cron or daemon mode).

**Usage**:
```bash
# One-time run (for cron)
npx ts-node scripts/scheduled-processor.ts

# Daemon mode (continuous)
npx ts-node scripts/scheduled-processor.ts --daemon

# Custom interval
npx ts-node scripts/scheduled-processor.ts --daemon --interval=30
```

**Inputs**:
- Environment: `MAX_SONGS_PER_RUN` (default: 3)
- Environment: `MIN_FREE_MEMORY_MB`, `MAX_MEMORY_USAGE_PERCENT`
- Environment: LLM configuration

**Outputs**:
- Console logs (can be redirected to file for cron)

**Functions**:
- `processBatch()` - Processes a batch of songs
  - Checks system resources
  - Waits for resources if needed
  - Runs `process-lyrics-folder.ts` as subprocess
  - Logs results
  
- `main()` - Entry point
  - One-time mode: Runs `processBatch()` once
  - Daemon mode: Runs `processBatch()` immediately, then on schedule

**Flow**:
1. Check system resources
2. Wait for resources if insufficient (up to 30 minutes)
3. Run `process-lyrics-folder.ts` as subprocess
4. Log results
5. If daemon mode: Schedule next run

**Dependencies**: `child_process`, `util`, `utils/system-resources`, `utils/llm-client`

---

### migrate-to-i18n.ts

**Purpose**: Migrates existing song files from old format to new i18n format.

**Usage**:
```bash
npx ts-node scripts/migrate-to-i18n.ts [--no-backup] [--songs-only] [--study-only]
```

**Inputs**:
- Files: `data/songs/*.json` (old format)
- Files: `data/study/*.json` (old format)

**Outputs**:
- Files: `data/songs/*.json` (new i18n format)
- Files: `data/study/*.json` (new i18n format)
- Files: `data/songs/*.json.backup` (backups, unless `--no-backup`)

**Functions**:
- `main()` - Entry point
  - Calls `migrateDirectory()` for songs and/or study directories
  - Handles command line flags

**Flow**:
1. Parse command line flags
2. Migrate `data/songs/` directory (unless `--study-only`)
3. Migrate `data/study/` directory (unless `--songs-only`)
4. Create backups (unless `--no-backup`)

**Dependencies**: `path`, `utils/data-migration`

---

### generate-songs-list.ts

**Purpose**: Generates a summary list of all songs for static hosting.

**Usage**:
```bash
npx ts-node scripts/generate-songs-list.ts
```

**Inputs**:
- Files: `data/songs/*.json` (all song files)

**Outputs**:
- File: `data/songs-list.json`
- Format: Array of `{ videoId, title, artist, thumbnailUrl }`

**Functions**:
- `main()` - Entry point
  - Reads all JSON files from `data/songs/`
  - Extracts summary info (videoId, title, artist, thumbnailUrl)
  - Writes to `data/songs-list.json`

**Flow**:
1. Read all JSON files from `data/songs/`
2. Extract summary fields from each file
3. Write array to `data/songs-list.json`

**Dependencies**: `fs/promises`, `path`

---

### populate-song-lyrics.ts

**Purpose**: Populates lyrics text in database from song JSON files.

**Usage**:
```bash
npx ts-node scripts/populate-song-lyrics.ts
```

**Inputs**:
- Files: `data/songs/*.json` (song files)
- Files: `data/study/*.json` (optional, for study file path)
- Database: Prisma connection

**Outputs**:
- Database: Updates/creates Song records with lyrics text

**Functions**:
- `extractLyrics(songData: SongData): {spanish: string, english: string | null}` - Extracts plain text from structured data
  - Iterates through all sections and lines
  - Collects Spanish and English text
  - Joins with newlines
  
- `main()` - Entry point
  - Reads all song files
  - Extracts lyrics
  - Upserts Song records in database
  - Updates lyrics text fields

**Flow**:
1. Read all JSON files from `data/songs/`
2. For each file:
   - Extract plain text lyrics (Spanish and English)
   - Check if study file exists
   - Upsert Song record in database
   - Update lyrics text fields
3. Display summary

**Dependencies**: `fs/promises`, `path`, `prisma`

---

## Utility Modules

### utils/llm-client.ts

**Purpose**: Unified LLM client for OpenAI and Ollama.

**Exports**:
- `LLMProvider` type: `'openai' | 'ollama'`
- `LLMConfig` interface: `{ provider, apiKey?, baseURL?, model }`
- `LLMResponse` interface: `{ content, model?, usage? }`

**Functions**:
- `createLLMClient(config: LLMConfig): OpenAI` - Creates OpenAI client (works for both providers)
  - If Ollama: Uses OpenAI-compatible API at `baseURL`
  - If OpenAI: Uses standard OpenAI API
  
- `callLLM(client, model, messages, options?): Promise<LLMResponse>` - Calls LLM API
  - Sends messages to API
  - Returns response with content and usage stats
  
- `getLLMConfigFromEnv(): LLMConfig` - Gets configuration from environment variables
  - Reads `LLM_PROVIDER` (default: 'openai')
  - Reads `OPENAI_API_KEY` (for OpenAI)
  - Reads `OLLAMA_BASE_URL` (default: 'http://localhost:11434/v1')
  - Reads `OLLAMA_MODEL` (default: 'llama3.2:3b')
  - Reads `OPENAI_MODEL` (default: 'gpt-4-turbo')

**Dependencies**: `openai`

---

### utils/system-resources.ts

**Purpose**: System resource monitoring for Ollama (prevents overloading low-RAM systems).

**Exports**:
- `SystemResources` interface: `{ freeMemoryMB, totalMemoryMB, memoryUsagePercent, cpuCount, loadAverage, canRunLLM }`

**Functions**:
- `checkSystemResources(minFreeMemoryMB?, maxMemoryUsagePercent?): Promise<SystemResources>` - Checks current system resources
  - Calculates free/total memory
  - Calculates memory usage percentage
  - Gets CPU count and load average
  - Determines if LLM can run safely
  
- `formatSystemResources(resources: SystemResources): string` - Formats resources for display
  
- `waitForResources(checkIntervalMs?, maxWaitTimeMs?, minFreeMemoryMB?, maxMemoryUsagePercent?): Promise<boolean>` - Waits until resources are available
  - Polls system resources at intervals
  - Returns true when resources available
  - Times out after max wait time

**Dependencies**: `os`

---

### utils/translations.ts

**Purpose**: Translation utilities for converting text to multiple languages.

**Exports**:
- `SUPPORTED_LANGUAGES`: `['en', 'es', 'zh', 'fr', 'de', 'it']`
- `SupportedLanguage` type

**Functions**:
- `translateText(text: string, sourceLanguage?, targetLanguages?): Promise<Record<string, string>>` - Translates text to multiple languages
  - Uses LLM (OpenAI or Ollama) for translation
  - Returns object with language codes as keys
  - Falls back to original text if translation fails
  
- `translateBatch(texts: string[], sourceLanguage?, targetLanguages?): Promise<Record<string, string>[]>` - Translates multiple texts
  - Currently translates one by one (could be optimized)

**Dependencies**: `openai`, `utils/llm-client`

---

### utils/section-titles.ts

**Purpose**: Standard section title translations (Intro, Verse, Chorus, etc.).

**Exports**:
- `STANDARD_SECTION_TITLES`: Record of standard titles with translations
- `getSectionTitleI18n(title: string): Record<string, string>` - Gets i18n object for title
  - Returns standard translation if available
  - Returns English-only object for custom titles
  
- `convertTitleToI18n(title: string): Record<string, string>` - Alias for `getSectionTitleI18n()`

**Dependencies**: None

---

### utils/data-migration.ts

**Purpose**: Utilities for migrating old data format to new i18n format.

**Exports**:
- `convertLine(oldLine: OldLine): NewLine` - Converts single line
  - `spanish` → `es`
  - `english` → `en`
  - `explanation` → `{ en: "..." }` (i18n object)
  
- `convertSection(oldSection: OldSection): NewSection` - Converts section
  - `title` → i18n object
  - `sectionExplanation` → i18n object (English only initially)
  - Converts all lines
  
- `convertSongFile(oldData: any): any` - Converts entire song file
  - Converts all sections
  - Converts structuredSections (for study mode)
  - Preserves metadata
  
- `migrateFile(filePath: string, backup?: boolean): Promise<void>` - Migrates single file
  - Checks if already migrated
  - Creates backup
  - Converts and saves
  
- `migrateDirectory(dirPath: string, backup?: boolean): Promise<void>` - Migrates all files in directory
  - Finds all JSON files
  - Migrates each file

**Dependencies**: `fs/promises`, `path`, `utils/section-titles`

---

## Data Flow Summary

### Typical Workflow

1. **Fetch Lyrics** (`fetch-lyrics.ts` or `fetch-or-transcribe.ts`)
   - Input: YouTube video ID
   - Output: `data/raw-lyrics/{videoId}.json`

2. **Generate Analysis** (`generate-analysis.ts` or `process-lyrics-folder.ts`)
   - Input: `data/raw-lyrics/{videoId}.json`
   - Output: `data/songs/{videoId}.json`

3. **Populate Database** (`populate-song-lyrics.ts`)
   - Input: `data/songs/{videoId}.json`
   - Output: Database records

### Full Pipeline Workflow

1. **Download & Transcribe** (`full-pipeline.ts`)
   - Input: Video ID or list
   - Output: `data/transcriptions/{videoId}.json`

2. **Analyze** (`full-pipeline.ts`)
   - Input: Transcription
   - Output: `data/analyzed/{videoId}.json`

3. **Translate** (`full-pipeline.ts`)
   - Input: Analysis
   - Output: `data/songs/{videoId}.json` (i18n), `data/study/{videoId}.json` (i18n)

---

## Environment Variables Reference

### Required
- `OPENAI_API_KEY` - OpenAI API key (if using OpenAI)
- `YOUTUBE_COOKIE` - YouTube authentication cookie (for `fetch-lyrics.ts`)

### Optional
- `LLM_PROVIDER` - `'openai'` or `'ollama'` (default: `'openai'`)
- `OLLAMA_BASE_URL` - Ollama API URL (default: `http://localhost:11434/v1`)
- `OLLAMA_MODEL` - Ollama model name (default: `llama3.2:3b`)
- `OPENAI_MODEL` - OpenAI model name (default: `gpt-4-turbo`)
- `WHISPER_API_URL` - Whisper API URL (default: `http://localhost:8000`)
- `MIN_FREE_MEMORY_MB` - Minimum free RAM for Ollama (default: `1024`)
- `MAX_MEMORY_USAGE_PERCENT` - Max memory usage % (default: `85`)
- `MAX_SONGS_PER_RUN` - Max songs per scheduled run (default: `3`)
- `PIPELINE_INPUT_FILE` - Input file for full pipeline (default: `data/toDownload.json`)

---

## File Structure

```
backend/
├── scripts/
│   ├── fetch-lyrics.ts
│   ├── fetch-lyrics-puppeteer.ts
│   ├── fetch-or-transcribe.ts
│   ├── whisper-transcribe.ts
│   ├── generate-analysis.ts
│   ├── process-lyrics-folder.ts
│   ├── full-pipeline.ts
│   ├── scheduled-processor.ts
│   ├── migrate-to-i18n.ts
│   ├── generate-songs-list.ts
│   ├── populate-song-lyrics.ts
│   └── utils/
│       ├── llm-client.ts
│       ├── system-resources.ts
│       ├── translations.ts
│       ├── section-titles.ts
│       └── data-migration.ts
└── data/
    ├── raw-lyrics/          # From fetch-lyrics.ts, whisper-transcribe.ts
    ├── lyrics-to-analyze/   # Input for process-lyrics-folder.ts
    ├── processed-lyrics/    # Moved after processing
    ├── lyrics-errors/       # Failed processing attempts
    ├── songs/               # Final song files (i18n)
    ├── study/               # Final study files (i18n)
    ├── downloads/           # Downloaded video audio
    ├── transcriptions/      # Whisper transcriptions
    ├── analyzed/            # AI analysis results
    ├── analysis-examples/   # Few-shot learning examples
    └── language-stats.json  # Language processing statistics
```

---

## Common Patterns

### Error Handling
- Most scripts log errors and continue (for batch processing)
- Failed files are moved to error directories
- System resource checks prevent crashes on low-RAM systems

### i18n Format
- All new scripts output i18n format:
  - `es`/`en` instead of `spanish`/`english`
  - `explanation: { en: "...", es: "...", ... }` instead of `explanation: "..."`
  - `title: { en: "...", es: "...", ... }` instead of `title: "..."`

### LLM Integration
- All scripts use `utils/llm-client.ts` for unified LLM access
- Supports both OpenAI and Ollama
- Automatic system resource checking for Ollama

### Timestamps
- All lyrics include `start_ms` and `end_ms` timestamps
- Timestamps are in milliseconds
- Used for karaoke/play-along features

---

## Notes

- Scripts are designed to be run independently or as part of a pipeline
- Intermediate files are saved so you can resume from any step
- Most scripts support both single-file and batch processing
- All scripts use TypeScript and require `ts-node` to run

