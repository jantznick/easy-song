import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFile, access, readdir } from 'fs/promises';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// Paths - server is in content-generation/server/, so go up two levels to content-generation/
// In Docker, use /app as base, otherwise use relative paths
const CONTENT_GEN_DIR = process.env.CONTENT_GEN_DIR || join(__dirname, '..', '..');
const DATA_DIR = process.env.DATA_DIR || join(CONTENT_GEN_DIR, 'data');
const RAW_LYRICS_DIR = join(DATA_DIR, 'raw-lyrics');
const TRANSCRIBED_LYRICS_DIR = join(DATA_DIR, 'transcribed-lyrics');
const ANALYZED_LYRICS_DIR = join(DATA_DIR, 'analyzed-lyrics');
const SONGS_DIR = join(DATA_DIR, 'songs');
const SCRIPTS_DIR = process.env.SCRIPTS_DIR || join(CONTENT_GEN_DIR, 'scripts');
const SCRIPT_PATH = join(SCRIPTS_DIR, 'download-and-transcribe.ts');
const LOGS_DIR = process.env.LOGS_DIR || join(CONTENT_GEN_DIR, 'logs');

app.use(cors());
app.use(express.json());

// Extract video ID from URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get all songs with metadata
async function getSongsWithMetadata() {
  const songs: Array<{ videoId: string; title?: string; artist?: string; url: string }> = [];
  
  // Check all directories for songs
  const dirs = [
    { path: SONGS_DIR, type: 'final' },
    { path: TRANSCRIBED_LYRICS_DIR, type: 'transcribed' },
    { path: RAW_LYRICS_DIR, type: 'raw' },
  ];
  
  const videoIds = new Set<string>();
  
  for (const dir of dirs) {
    try {
      if (existsSync(dir.path)) {
        const files = await readdir(dir.path);
        for (const file of files) {
          if (file.endsWith('.json')) {
            const videoId = file.replace('.json', '');
            videoIds.add(videoId);
          }
        }
      }
    } catch (error) {
      console.error(`Error reading ${dir.path}:`, error);
    }
  }
  
  // Get metadata for each song
  for (const videoId of videoIds) {
    const songPath = join(SONGS_DIR, `${videoId}.json`);
    const transcribedPath = join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
    const rawPath = join(RAW_LYRICS_DIR, `${videoId}.json`);
    
    let metadata: { title?: string; artist?: string } = {};
    
    // Try to get metadata from final song file first, then transcribed, then raw
    for (const path of [songPath, transcribedPath, rawPath]) {
      if (existsSync(path)) {
        try {
          const content = await readFile(path, 'utf-8');
          const data = JSON.parse(content);
          if (data.title) metadata.title = data.title;
          if (data.artist) metadata.artist = data.artist;
          break;
        } catch (error) {
          // Continue to next file
        }
      }
    }
    
    songs.push({
      videoId,
      ...metadata,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  
  return songs.sort((a, b) => a.videoId.localeCompare(b.videoId));
}

// Check which files exist for a video ID
async function getFileStatus(videoId: string) {
  return {
    raw: existsSync(join(RAW_LYRICS_DIR, `${videoId}.json`)),
    transcribed: existsSync(join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`)),
    analyzed: existsSync(join(ANALYZED_LYRICS_DIR, `${videoId}.json`)),
    translated: existsSync(join(SONGS_DIR, `${videoId}.json`)),
  };
}

// API Routes
app.get('/api/songs', async (req, res) => {
  try {
    const songs = await getSongsWithMetadata();
    // Add file status for each song
    const songsWithStatus = await Promise.all(
      songs.map(async (song) => {
        const status = await getFileStatus(song.videoId);
        return { ...song, fileStatus: status };
      })
    );
    res.json({ songs: songsWithStatus });
  } catch (error) {
    console.error('Error fetching songs:', error);
    res.status(500).json({ error: 'Failed to fetch songs' });
  }
});

app.get('/api/song/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    const fileStatus = await getFileStatus(videoId);
    
    // Try to get final song file first
    const songPath = join(SONGS_DIR, `${videoId}.json`);
    if (existsSync(songPath)) {
      const content = await readFile(songPath, 'utf-8');
      return res.json({
        type: 'translated',
        data: JSON.parse(content),
        fileStatus,
      });
    }
    
    // Try analyzed
    const analyzedPath = join(ANALYZED_LYRICS_DIR, `${videoId}.json`);
    if (existsSync(analyzedPath)) {
      const content = await readFile(analyzedPath, 'utf-8');
      return res.json({
        type: 'analyzed',
        data: JSON.parse(content),
        fileStatus,
      });
    }
    
    // Try transcribed
    const transcribedPath = join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`);
    if (existsSync(transcribedPath)) {
      const content = await readFile(transcribedPath, 'utf-8');
      return res.json({
        type: 'transcribed',
        data: JSON.parse(content),
        fileStatus,
      });
    }
    
    // Try raw
    const rawPath = join(RAW_LYRICS_DIR, `${videoId}.json`);
    if (existsSync(rawPath)) {
      const content = await readFile(rawPath, 'utf-8');
      return res.json({
        type: 'raw',
        data: JSON.parse(content),
        fileStatus,
      });
    }
    
    res.status(404).json({ error: 'Song not found' });
  } catch (error) {
    console.error('Error fetching song:', error);
    res.status(500).json({ error: 'Failed to fetch song' });
  }
});

// Get specific file type
app.get('/api/song/:videoId/:fileType', async (req, res) => {
  try {
    const { videoId, fileType } = req.params;
    
    const fileMap: Record<string, string> = {
      raw: join(RAW_LYRICS_DIR, `${videoId}.json`),
      transcribed: join(TRANSCRIBED_LYRICS_DIR, `${videoId}.json`),
      analyzed: join(ANALYZED_LYRICS_DIR, `${videoId}.json`),
      translated: join(SONGS_DIR, `${videoId}.json`),
    };
    
    const filePath = fileMap[fileType];
    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file type' });
    }
    
    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = await readFile(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (error) {
    console.error('Error fetching file:', error);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

app.post('/api/process', async (req, res) => {
  try {
    const { urls } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, error: 'No URLs provided' });
    }
    
    // Extract video IDs
    const videoIds: string[] = [];
    const invalidUrls: string[] = [];
    
    for (const url of urls) {
      const trimmed = url.trim();
      if (!trimmed) continue;
      const videoId = extractVideoId(trimmed);
      if (videoId) {
        videoIds.push(videoId);
      } else {
        invalidUrls.push(trimmed);
      }
    }
    
    if (videoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid YouTube video IDs found',
        invalidUrls,
      });
    }
    
    // Check existing videos
    const existing = {
      raw: [] as string[],
      transcribed: [] as string[],
      analyzed: [] as string[],
      translated: [] as string[],
    };
    
    for (const videoId of videoIds) {
      const status = await getFileStatus(videoId);
      if (status.translated) existing.translated.push(videoId);
      else if (status.analyzed) existing.analyzed.push(videoId);
      else if (status.transcribed) existing.transcribed.push(videoId);
      else if (status.raw) existing.raw.push(videoId);
    }
    
    const newVideoIds = videoIds.filter(
      id => !existing.translated.includes(id) &&
            !existing.analyzed.includes(id) &&
            !existing.transcribed.includes(id) &&
            !existing.raw.includes(id)
    );
    
    if (newVideoIds.length === 0) {
      return res.json({
        success: true,
        message: 'All videos already exist',
        videoIds,
        invalidUrls,
        existing,
        skipped: true,
      });
    }
    
    // Process new videos
    const processPids: number[] = [];
    const logFile = join(LOGS_DIR, 'process.log');
    
    // Ensure logs directory exists
    const { promises: fsPromises } = await import('fs');
    if (!existsSync(LOGS_DIR)) {
      await fsPromises.mkdir(LOGS_DIR, { recursive: true });
    }
    
    // Find Node executable (try nvm first, or use 'node' in Docker)
    let nodeCmd = 'node';
    if (process.env.NODE_PATH) {
      // In Docker or when NODE_PATH is set, use node directly
      nodeCmd = 'node';
    } else {
      // Try to find Node via nvm
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const nvmNodePath = join(homeDir, '.nvm', 'versions', 'node', 'v20.19.6', 'bin', 'node');
      if (existsSync(nvmNodePath)) {
        nodeCmd = nvmNodePath;
      }
    }
    
    for (const videoId of newVideoIds) {
      // In Docker, we need to ensure ts-node is available
      // The scripts directory is mounted, so we can use ts-node from node_modules
      const cmd = [
        nodeCmd,
        '-r',
        'ts-node/register',
        SCRIPT_PATH,
        videoId,
      ];
      
      // Add NODE_PATH if in Docker to help find modules
      // In Docker, content-generation node_modules are mounted at /app/content-generation-node_modules
      const spawnEnv: NodeJS.ProcessEnv = { ...process.env };
      const contentGenNodeModules = process.env.DOCKER ? '/app/content-generation-node_modules' : join(CONTENT_GEN_DIR, 'node_modules');
      if (process.env.NODE_PATH) {
        spawnEnv.NODE_PATH = `${contentGenNodeModules}:${process.env.NODE_PATH}`;
      } else {
        spawnEnv.NODE_PATH = contentGenNodeModules;
      }
      
      const childProcess = spawn(cmd[0], cmd.slice(1), {
        cwd: CONTENT_GEN_DIR,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: spawnEnv,
      });
      
      if (childProcess.pid) {
        processPids.push(childProcess.pid);
      }
      
      // Log output
      childProcess.stdout?.on('data', (data: Buffer) => {
        fsPromises.appendFile(logFile, data.toString()).catch(console.error);
      });
      
      childProcess.stderr?.on('data', (data: Buffer) => {
        fsPromises.appendFile(logFile, data.toString()).catch(console.error);
      });
    }
    
    res.json({
      success: true,
      message: `Processing ${newVideoIds.length} new video(s) in background`,
      videoIds,
      newVideoIds,
      invalidUrls,
      existing,
      processIds: processPids,
      logFile,
    });
  } catch (error) {
    console.error('Error processing videos:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Helper function to run a script
async function runScript(scriptName: string, videoId: string, logFile: string): Promise<number | null> {
  const { promises: fsPromises } = await import('fs');
  
  // Ensure logs directory exists
  if (!existsSync(LOGS_DIR)) {
    await fsPromises.mkdir(LOGS_DIR, { recursive: true });
  }
  
  // Find Node executable
  let nodeCmd = 'node';
  if (process.env.NODE_PATH) {
    nodeCmd = 'node';
  } else {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const nvmNodePath = join(homeDir, '.nvm', 'versions', 'node', 'v20.19.6', 'bin', 'node');
    if (existsSync(nvmNodePath)) {
      nodeCmd = nvmNodePath;
    }
  }
  
  const scriptPath = join(SCRIPTS_DIR, `${scriptName}.ts`);
  if (!existsSync(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }
  
  const cmd = [
    nodeCmd,
    '-r',
    'ts-node/register',
    scriptPath,
    videoId,
  ];
  
  // Add NODE_PATH
  const spawnEnv: NodeJS.ProcessEnv = { ...process.env };
  if (process.env.NODE_PATH) {
    spawnEnv.NODE_PATH = `${join(CONTENT_GEN_DIR, 'node_modules')}:${process.env.NODE_PATH}`;
  } else {
    spawnEnv.NODE_PATH = join(CONTENT_GEN_DIR, 'node_modules');
  }
  
  const childProcess = spawn(cmd[0], cmd.slice(1), {
    cwd: CONTENT_GEN_DIR,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: spawnEnv,
  });
  
  // Log output
  childProcess.stdout?.on('data', (data: Buffer) => {
    fsPromises.appendFile(logFile, data.toString()).catch(console.error);
  });
  
  childProcess.stderr?.on('data', (data: Buffer) => {
    fsPromises.appendFile(logFile, data.toString()).catch(console.error);
  });
  
  return childProcess.pid || null;
}

// Trigger analyze for a specific video
app.post('/api/analyze/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Check if analyzed already exists
    const status = await getFileStatus(videoId);
    if (status.analyzed) {
      return res.json({
        success: true,
        message: 'Song already analyzed',
        videoId,
        alreadyExists: true,
      });
    }
    
    // Check if transcribed exists (required for analysis)
    if (!status.transcribed) {
      return res.status(400).json({
        success: false,
        error: 'Transcribed lyrics required for analysis. Please transcribe first.',
        videoId,
      });
    }
    
    const logFile = join(LOGS_DIR, 'process.log');
    const { promises: fsPromises } = await import('fs');
    if (!existsSync(LOGS_DIR)) {
      await fsPromises.mkdir(LOGS_DIR, { recursive: true });
    }
    
    // Add log entry
    const timestamp = new Date().toISOString();
    await fsPromises.appendFile(
      logFile,
      `\n[${timestamp}] Starting analysis for video: ${videoId}\n`
    );
    
    const pid = await runScript('analyze-song', videoId, logFile);
    
    // Note: analyze-song.ts automatically calls translate-song.ts at the end
    // So we don't need to manually trigger it here
    
    res.json({
      success: true,
      message: 'Analysis started (translation will follow automatically)',
      videoId,
      processId: pid,
      logFile,
    });
  } catch (error) {
    console.error('Error starting analysis:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Trigger translate for a specific video
app.post('/api/translate/:videoId', async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Check if translated already exists
    const status = await getFileStatus(videoId);
    if (status.translated) {
      return res.json({
        success: true,
        message: 'Song already translated',
        videoId,
        alreadyExists: true,
      });
    }
    
    // Check if analyzed exists (required for translation)
    if (!status.analyzed) {
      return res.status(400).json({
        success: false,
        error: 'Analyzed lyrics required for translation. Please analyze first.',
        videoId,
      });
    }
    
    const logFile = join(LOGS_DIR, 'process.log');
    const { promises: fsPromises } = await import('fs');
    if (!existsSync(LOGS_DIR)) {
      await fsPromises.mkdir(LOGS_DIR, { recursive: true });
    }
    
    // Add log entry
    const timestamp = new Date().toISOString();
    await fsPromises.appendFile(
      logFile,
      `\n[${timestamp}] Starting translation for video: ${videoId}\n`
    );
    
    const pid = await runScript('translate-song', videoId, logFile);
    
    res.json({
      success: true,
      message: 'Translation started',
      videoId,
      processId: pid,
      logFile,
    });
  } catch (error) {
    console.error('Error starting translation:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get process logs (tail)
app.get('/api/logs', async (req, res) => {
  try {
    const lines = parseInt(req.query.lines as string || '100', 10);
    const logFile = join(LOGS_DIR, 'process.log');
    
    if (!existsSync(logFile)) {
      return res.json({
        logs: 'No log file found yet. Logs will appear here once processing starts.',
        lines: 0,
      });
    }
    
    // Read the file and get the last N lines
    const content = await readFile(logFile, 'utf-8');
    const allLines = content.split('\n');
    const lastLines = allLines.slice(-lines);
    
    res.json({
      logs: lastLines.join('\n'),
      lines: lastLines.length,
      totalLines: allLines.length,
    });
  } catch (error) {
    console.error('Error reading logs:', error);
    res.status(500).json({
      error: 'Failed to read logs',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendDist = join(CONTENT_GEN_DIR, 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res) => {
      res.sendFile(join(frontendDist, 'index.html'));
    });
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}/`);
  console.log(`📁 Data directory: ${DATA_DIR}`);
  console.log(`📝 Process logs: ${join(LOGS_DIR, 'process.log')}`);
});

