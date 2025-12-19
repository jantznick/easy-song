# Full Pipeline Workflow

## Overview

This document describes the complete workflow for processing YouTube videos into fully i18n'd song files.

## Workflow Steps

### Input
- **File**: `data/toDownload.json` with format: `{ "videoIds": ["VIDEO_ID_1", "VIDEO_ID_2", ...] }`
- **OR**: Single video ID as command argument

### Step 1: Download Videos
- **Tool**: `yt-dlp`
- **Input**: YouTube video ID
- **Output**: Audio file (WAV format) in `data/downloads/{videoId}/`
- **Note**: Downloads audio only (faster, smaller)

### Step 2: Whisper Transcription
- **Tool**: Self-hosted Whisper API or OpenAI Whisper
- **Input**: Audio file
- **Output**: `data/transcriptions/{videoId}.json` with:
  ```json
  [
    {
      "text": "Spanish lyric line",
      "start_ms": 0,
      "end_ms": 2000
    }
  ]
  ```
- **✅ YES, Whisper provides timestamps!** (start_ms and end_ms)

### Step 3: AI Analysis
- **Tool**: OpenAI or Ollama
- **Input**: Transcription file (single language - Spanish)
- **Output**: `data/analyzed/{videoId}.json` with:
  ```json
  {
    "analysis": [
      {
        "spanish": "Original text",
        "english": "English translation",
        "explanation": "Explanation in English"
      }
    ],
    "sections": [
      {
        "title": "Chorus",
        "sectionExplanation": "Explanation of section",
        "lines": ["line1", "line2"]
      }
    ]
  }
  ```

### Step 4: Translate to All Languages
- **Tool**: OpenAI/Ollama translation
- **Input**: Analysis file + transcription
- **Output**: 
  - `data/songs/{videoId}.json` - Full song with all languages
  - `data/study/{videoId}.json` - Study mode with all languages (if sections identified)

## Usage

### Process from File

```bash
# 1. Create input file
echo '{"videoIds": ["KU5V5WZVcVE", "NUsoVlDFqZg"]}' > backend/data/toDownload.json

# 2. Run pipeline
cd backend
npx ts-node scripts/full-pipeline.ts
```

### Process Single Video

```bash
npx ts-node scripts/full-pipeline.ts VIDEO_ID
```

### Skip Download (Use Existing Transcription)

If you already have transcription files:

```bash
npx ts-node scripts/full-pipeline.ts --skip-download
```

Or for a single video:
```bash
npx ts-node scripts/full-pipeline.ts VIDEO_ID --skip-download
```

## Alternative: Start from Downloaded Lyrics

If you download lyrics files directly (skipping steps 1-2):

1. **Place files** in `data/transcriptions/` with format:
   ```json
   [
     {
       "text": "Spanish text",
       "start_ms": 0,
       "end_ms": 2000
     }
   ]
   ```

2. **Run pipeline** with `--skip-download`:
   ```bash
   npx ts-node scripts/full-pipeline.ts --skip-download
   ```

## Output Structure

### `data/songs/{videoId}.json`
```json
{
  "videoId": "KU5V5WZVcVE",
  "title": "Song Title",
  "artist": "Artist Name",
  "sections": [{
    "title": {
      "en": "Lyrics",
      "es": "Letra",
      "fr": "Paroles",
      ...
    },
    "lines": [{
      "es": "Spanish text",
      "en": "English text",
      "explanation": {
        "en": "Explanation in English",
        "es": "Explicación en español",
        "fr": "Explication en français",
        ...
      },
      "start_ms": 0,
      "end_ms": 2000
    }]
  }]
}
```

### `data/study/{videoId}.json`
```json
{
  "videoId": "KU5V5WZVcVE",
  "title": "Song Title",
  "artist": "Artist Name",
  "structuredSections": [{
    "title": {
      "en": "Chorus",
      "es": "Coro",
      ...
    },
    "sectionExplanation": {
      "en": "Section explanation",
      "es": "Explicación de sección",
      ...
    },
    "lines": [{
      "es": "Spanish text",
      "en": "English text",
      "explanation": {
        "en": "Line explanation",
        "es": "Explicación de línea",
        ...
      },
      "start_ms": 0,
      "end_ms": 2000
    }]
  }]
}
```

## Environment Variables

```bash
# LLM Provider
LLM_PROVIDER=openai  # or 'ollama'
OPENAI_API_KEY=your_key
OLLAMA_MODEL=llama3.2:3b

# Whisper
WHISPER_API_URL=http://localhost:8000

# Pipeline
PIPELINE_INPUT_FILE=../data/toDownload.json  # Optional, defaults to this
```

## Feedback on Your Approach

### ✅ **Excellent Points**

1. **Whisper Timestamps**: Yes! Whisper provides timestamps in the `segments` array with `start` and `end` times (in seconds, we convert to milliseconds).

2. **Single Language Input**: Smart to analyze in original language first, then translate. This preserves context and cultural nuances.

3. **Batch Translation**: Translating explanations after analysis is efficient and maintains consistency.

4. **Flexible Input**: Supporting both downloaded videos and pre-downloaded lyrics files is great for different workflows.

### 💡 **Suggestions & Improvements**

1. **Language Detection**: 
   - Currently assumes Spanish (`'es'`). Consider detecting language from transcription or metadata.
   - Could use Whisper's language detection or a simple language detection library.

2. **Translation Quality**:
   - Current approach translates explanations from English. Consider:
     - Generating explanations directly in target languages (better quality, more API calls)
     - Hybrid: Generate in English + Spanish, translate others
   - For critical content, consider using specialized translation models or services.

3. **Error Handling**:
   - Add retry logic for API calls
   - Save intermediate results so you can resume from any step
   - Handle partial failures gracefully

4. **Performance**:
   - Batch translation requests where possible
   - Cache translations for common explanations
   - Process multiple videos in parallel (with rate limiting)

5. **Section Identification**:
   - Current AI might not always identify sections correctly
   - Consider a two-pass approach: analyze structure first, then content
   - Or use a separate prompt specifically for section identification

6. **Cost Optimization**:
   - For explanations, consider:
     - Only translate unique explanations (many lines share explanations)
     - Use cheaper models for translation vs. analysis
     - Cache common translations

### 🔧 **Implementation Notes**

1. **Whisper Timestamps**: ✅ Confirmed - Whisper's `verbose_json` format includes `segments` with `start` and `end` times.

2. **File Structure**: The pipeline creates intermediate files at each step, so you can:
   - Resume from any step if it fails
   - Re-run translation without re-analyzing
   - Debug individual steps

3. **Translation Strategy**: Currently translates all explanations. Could optimize by:
   - Detecting duplicate explanations
   - Translating once per unique explanation
   - Reusing translations across lines

## Example Workflow

```bash
# 1. Prepare input
cat > backend/data/toDownload.json << EOF
{
  "videoIds": [
    "KU5V5WZVcVE",
    "NUsoVlDFqZg"
  ]
}
EOF

# 2. Run full pipeline
cd backend
npx ts-node scripts/full-pipeline.ts

# Output:
# - data/downloads/{videoId}/ - Audio files
# - data/transcriptions/{videoId}.json - Transcriptions with timestamps
# - data/analyzed/{videoId}.json - AI analysis
# - data/songs/{videoId}.json - Final song file (i18n)
# - data/study/{videoId}.json - Final study file (i18n, if sections found)
```

## Next Steps

1. **Test with one video** to verify the workflow
2. **Review output quality** - check translations and explanations
3. **Optimize translation** - consider batch translation or caching
4. **Add language detection** - don't assume Spanish
5. **Add error recovery** - resume from last successful step
6. **Monitor costs** - track API usage per video

## Questions?

- See `scripts/full-pipeline.ts` for implementation
- See `scripts/utils/translations.ts` for translation logic
- See `DATA_STRUCTURE_I18N_PROPOSAL.md` for data structure details

