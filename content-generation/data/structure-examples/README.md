# Structure Examples for Section Identification

This directory contains example files that demonstrate how to identify and structure song sections (Intro, Verse, Chorus, Bridge, etc.) for the analysis step.

## Purpose

These examples help the LLM understand:
1. **Section Types**: Common section names (Intro, Verse, Chorus, Bridge, Outro, etc.)
2. **Section Boundaries**: How to identify where sections start and end using timestamps
3. **Section Explanations**: How to write meaningful explanations for entire sections
4. **Multiple Iterations**: How to handle repeated sections (e.g., multiple Choruses)

## File Format

Each example file should be a JSON file containing the expected structure:

```json
{
  "structuredSections": [
    {
      "title": "Intro",
      "sectionExplanation": "The introduction sets the stage for the song, establishing the mood and theme.",
      "start_ms": 0,
      "end_ms": 15000
    },
    {
      "title": "Verse 1",
      "sectionExplanation": "The first verse introduces the main narrative...",
      "start_ms": 15000,
      "end_ms": 45000
    },
    {
      "title": "Chorus",
      "sectionExplanation": "The chorus presents the main hook and theme...",
      "start_ms": 45000,
      "end_ms": 60000
    },
    {
      "title": "Chorus",
      "sectionExplanation": "The chorus repeats, emphasizing the central theme...",
      "start_ms": 120000,
      "end_ms": 135000
    }
  ]
}
```

## Naming Convention

Name your example files descriptively:
- `example-basic-structure.json`
- `example-repeated-chorus.json`
- `example-complex-structure.json`

The script will load them in alphabetical order for few-shot learning.

## Notes

- Sections can repeat (multiple Choruses, Verses, etc.)
- Each section should have distinct start_ms and end_ms timestamps
- Section explanations should be in English (they will be translated in the translation step)
- Section titles should be standard English names (e.g., "Intro", "Verse 1", "Chorus") - they will be translated later

