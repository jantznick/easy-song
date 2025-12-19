# Ollama Setup & Usage Guide

## Overview

The lyrics analysis scripts now support both OpenAI and Ollama (local LLM). This allows you to:
- Run analysis locally without API costs
- Process songs on a schedule when your machine is idle
- Use system resource monitoring to avoid overloading your machine

## Is It Worth It?

### ✅ **Yes, if:**
- Your machine is mostly idle (especially at night)
- You want to process a few songs per day (not hundreds)
- You're okay with slower processing (local LLMs are slower than GPT-4)
- You want to save on API costs
- You have at least 4-8GB RAM available

### ❌ **No, if:**
- You need fast processing (OpenAI is much faster)
- You're processing many songs at once
- Your machine is actively used during processing times
- You need the highest quality analysis (GPT-4 is generally better)

### 💡 **Hybrid Approach (Recommended):**
- Use Ollama for batch processing at night (3-5 songs)
- Use OpenAI for urgent/high-priority songs
- Monitor system resources to avoid conflicts

## Setup

### 1. Install Ollama

```bash
# macOS
brew install ollama

# Or download from https://ollama.ai
```

### 2. Pull a Model

For low-RAM systems, use a small model:

```bash
# Small model (3B parameters, ~2GB RAM)
ollama pull llama3.2:3b

# Medium model (7B parameters, ~4GB RAM) - better quality
ollama pull llama3.2:1b  # Even smaller
# or
ollama pull mistral:7b

# Large model (13B+ parameters, 8GB+ RAM) - best quality
ollama pull llama3.1:8b
```

**Recommendation for low-RAM systems:** Start with `llama3.2:3b` or `llama3.2:1b`. You can always upgrade later.

### 3. Test Ollama

```bash
# Start Ollama (if not running as service)
ollama serve

# In another terminal, test it
ollama run llama3.2:3b "Translate this to English: Hola mundo"
```

### 4. Configure Environment

Add to `backend/.env`:

```bash
# Use Ollama instead of OpenAI
LLM_PROVIDER=ollama

# Optional: Custom Ollama URL (default: http://localhost:11434/v1)
OLLAMA_BASE_URL=http://localhost:11434/v1

# Optional: Model name (default: llama3.2:3b)
OLLAMA_MODEL=llama3.2:3b

# System resource thresholds
MIN_FREE_MEMORY_MB=1024        # Minimum free RAM in MB (default: 1GB)
MAX_MEMORY_USAGE_PERCENT=85    # Max memory usage % (default: 85%)
```

### 5. Test the Scripts

```bash
cd backend

# Test with a single song
npx ts-node scripts/generate-analysis.ts VIDEO_ID

# Or process folder
npx ts-node scripts/process-lyrics-folder.ts
```

## Usage

### Basic Usage

```bash
# Process all files in lyrics-to-analyze folder
npx ts-node scripts/process-lyrics-folder.ts
```

### With Resource Checking

```bash
# Check resources and wait if needed
npx ts-node scripts/process-lyrics-folder.ts --wait-for-resources

# Skip resource check (not recommended)
npx ts-node scripts/process-lyrics-folder.ts --skip-resource-check
```

### Scheduled Processing

#### Option 1: Cron (Recommended for Nightly)

Add to your crontab (`crontab -e`):

```bash
# Run every night at 2 AM
0 2 * * * cd /path/to/easy-song/backend && npx ts-node scripts/scheduled-processor.ts >> logs/scheduled-processor.log 2>&1
```

#### Option 2: Daemon Mode

Run as a long-running service:

```bash
# Check every hour
npx ts-node scripts/scheduled-processor.ts --daemon

# Custom interval (30 minutes)
npx ts-node scripts/scheduled-processor.ts --daemon --interval=30
```

#### Option 3: Systemd Service (Linux)

Create `/etc/systemd/system/lyrics-processor.service`:

```ini
[Unit]
Description=Lyrics Analysis Processor
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/easy-song/backend
Environment="LLM_PROVIDER=ollama"
Environment="OLLAMA_MODEL=llama3.2:3b"
ExecStart=/usr/bin/npx ts-node scripts/scheduled-processor.ts --daemon --interval=60
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable lyrics-processor
sudo systemctl start lyrics-processor
```

## Performance Tips

### For Low-RAM Systems

1. **Use smaller models:**
   - `llama3.2:1b` or `llama3.2:3b` instead of 7B+ models

2. **Process fewer songs:**
   - Set `MAX_SONGS_PER_RUN=3` in `.env`
   - Process during off-hours

3. **Adjust resource thresholds:**
   ```bash
   MIN_FREE_MEMORY_MB=512        # Lower threshold
   MAX_MEMORY_USAGE_PERCENT=90   # Allow higher usage
   ```

4. **Close other applications** during processing

5. **Use swap space** if available (slower but allows processing)

### Model Quality vs Speed

| Model | RAM | Speed | Quality |
|-------|-----|-------|---------|
| llama3.2:1b | ~1GB | Fast | Basic |
| llama3.2:3b | ~2GB | Medium | Good |
| llama3.2:7b | ~4GB | Slow | Better |
| llama3.1:8b | ~5GB | Slow | Best |

**Recommendation:** Start with `llama3.2:3b` and upgrade if quality is insufficient.

## Monitoring

### Check System Resources

The scripts automatically check:
- Free memory
- Memory usage percentage
- CPU load

You'll see output like:
```
System Resources:
  Memory: 2048MB free / 8192MB total (75% used)
  CPUs: 4
  Load Average: 0.5, 0.6, 0.7
  Can Run LLM: ✅ Yes
```

### View Language Stats

```bash
cat backend/data/language-stats.json
```

### Check Processing Logs

If using cron or daemon mode, check logs:
```bash
tail -f logs/scheduled-processor.log
```

## Troubleshooting

### "Connection refused" to Ollama

Make sure Ollama is running:
```bash
ollama serve
```

Or check if it's running as a service:
```bash
# macOS
brew services list | grep ollama

# Linux
systemctl status ollama
```

### Out of Memory Errors

1. Use a smaller model
2. Increase `MIN_FREE_MEMORY_MB` threshold
3. Process fewer songs at once
4. Close other applications

### Slow Processing

- This is normal! Local LLMs are much slower than GPT-4
- Expect 2-5 minutes per song (vs 10-30 seconds with GPT-4)
- Process during off-hours when speed doesn't matter

### Poor Quality Results

1. Try a larger model (if RAM allows)
2. Add more examples to `data/analysis-examples/`
3. Use OpenAI for high-priority songs
4. Fine-tune the prompt in `prompt.txt`

## Switching Between Providers

### Use Ollama
```bash
export LLM_PROVIDER=ollama
npx ts-node scripts/process-lyrics-folder.ts
```

### Use OpenAI
```bash
export LLM_PROVIDER=openai
# Make sure OPENAI_API_KEY is set
npx ts-node scripts/process-lyrics-folder.ts
```

Or set in `.env` file:
```bash
LLM_PROVIDER=ollama  # or 'openai'
```

## Cost Comparison

### OpenAI (GPT-4 Turbo)
- ~$0.01-0.03 per song (depending on length)
- 100 songs = $1-3

### Ollama (Local)
- $0 per song (just electricity)
- 100 songs = ~$0.10-0.50 in electricity (depending on your rates)

**Savings:** ~$1-3 per 100 songs, but much slower.

## Recommendations

1. **Start small:** Test with 1-2 songs using `llama3.2:3b`
2. **Monitor resources:** Watch memory usage during first runs
3. **Schedule wisely:** Run at night or when machine is idle
4. **Hybrid approach:** Use Ollama for batch, OpenAI for urgent
5. **Quality check:** Review first few results to ensure quality is acceptable

## Next Steps

1. Install Ollama and pull a model
2. Test with a single song
3. Set up nightly cron job
4. Monitor for a week
5. Adjust model/thresholds based on results

