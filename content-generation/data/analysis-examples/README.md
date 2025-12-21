# Analysis Examples for Few-Shot Learning

This directory contains example analysis files that are used for few-shot learning in the analysis generation script (`analyze-song.ts`).

## How It Works

The `analyze-song.ts` script automatically loads up to 5 example files from this directory and includes them in the prompt sent to OpenAI. This helps the AI understand:

1. **Format**: The exact JSON structure expected
2. **Quality**: The level of detail and depth in explanations
3. **Style**: How to handle cultural references, slang, and multi-line explanations

## File Format

Each example file should be a JSON file (`.json`) containing the expected analysis response format. The format will match what `analyze-song.ts` expects (to be documented when the script is created).

## Naming Convention

Name your example files descriptively:
- `example-spanish-urban.json`
- `example-reggaeton.json`
- `example-salsa-classic.json`
- `example-romantic-ballad.json`

The script will load them in alphabetical order, so you can prefix with numbers if you want a specific order:
- `01-example-basic.json`
- `02-example-advanced.json`

## How Many Examples Do I Need?

### Few-Shot Learning (Current Approach)
- **1-5 examples**: Good for establishing format and basic quality
- **5-10 examples**: Better for consistency and handling edge cases
- **10+ examples**: Diminishing returns, consider RAG/MCP instead

### When to Switch to RAG/MCP

Consider switching from few-shot learning to RAG (Retrieval-Augmented Generation) or MCP (Model Context Protocol) when:

1. **Token Costs**: Few-shot examples consume tokens on every request. If you have 10+ examples, the cost adds up.

2. **Context Window Limits**: With many examples, you might hit token limits, especially for long songs.

3. **Semantic Search**: You want to dynamically select the most relevant examples based on:
   - Song genre (reggaeton vs. salsa vs. bachata)
   - Song theme (romance vs. party vs. social commentary)
   - Language variety (Mexican Spanish vs. Caribbean Spanish)

4. **Scalability**: As your example library grows (50+ examples), RAG becomes more efficient.

5. **Specialization**: You want different example sets for different analysis types (e.g., cultural analysis vs. linguistic analysis).

## Current Implementation

The `analyze-song.ts` script uses a simple few-shot approach:
- Loads up to 5 examples from this directory
- Includes them directly in the prompt
- Works well for establishing consistency

To add examples, simply create JSON files in this directory following the format expected by `analyze-song.ts`.
