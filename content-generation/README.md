# Content Generation

This directory contains scripts and data for generating song content from YouTube videos.

## Structure

```
content-generation/
├── scripts/              # TypeScript scripts for processing
│   ├── download-and-transcribe.ts
│   ├── analyze-song.ts      (to be created)
│   ├── translate-song.ts    (to be created)
│   └── utils/
│       ├── llm-client.ts
│       └── section-titles.ts
├── data/                 # Processing data files and examples
│   ├── raw-lyrics/          # Simple transcription segments
│   ├── transcribed-lyrics/  # Transcriptions with metadata
│   ├── analyzed-lyrics/     # Analysis + sections (intermediate)
│   ├── analysis-examples/   # Few-shot examples for analysis
│   └── structure-examples/  # Examples for section identification
└── backend/data/         # Final output (used by app)
    ├── songs/               # Final song files
    └── study/               # Study mode files
└── prompt.txt            # LLM prompt template
```

## Workflow

1. **Download & Transcribe** (`download-and-transcribe.ts`)
   - Downloads YouTube video audio
   - Transcribes with OpenAI Whisper
   - Saves to `transcribed-lyrics/`
   - Automatically calls `analyze-song.ts`

2. **Analyze** (`analyze-song.ts`)
   - Reads from `transcribed-lyrics/`
   - Generates explanations and identifies sections
   - Saves to `analyzed-lyrics/`
   - Automatically calls `translate-song.ts`

3. **Translate** (`translate-song.ts`)
   - Reads from `analyzed-lyrics/`
   - Generates translations in all languages
   - Saves final output to `backend/data/songs/`

## Usage

### Single Video Processing

```bash
cd content-generation
npx ts-node scripts/download-and-transcribe.ts VIDEO_ID [--lang=es] [--skip-existing]
```

This will automatically run the full pipeline: download → transcribe → analyze → translate

### Manual Steps

```bash
# Step 1: Download & Transcribe
npx ts-node scripts/download-and-transcribe.ts VIDEO_ID

# Step 2: Analyze (if not auto-called)
npx ts-node scripts/analyze-song.ts VIDEO_ID

# Step 3: Translate (if not auto-called)
npx ts-node scripts/translate-song.ts VIDEO_ID
```

## Environment Variables

Create a `.env` file in the `content-generation/` directory:

```bash
OPENAI_API_KEY=your_openai_api_key
```

## Examples

### Analysis Examples
Place example analysis files in `data/analysis-examples/` to help the LLM understand the expected format and quality.

### Structure Examples
Place example section structure files in `data/structure-examples/` to help the LLM identify song sections (Intro, Verse, Chorus, etc.).

See the README files in each examples directory for format details.

