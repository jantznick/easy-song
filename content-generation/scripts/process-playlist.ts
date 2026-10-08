import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isDocker = process.env.DOCKER === 'true' || process.env.NODE_ENV === 'production';
const BASE_DIR = isDocker ? '/app' : path.resolve(__dirname, '..');
const ANALYZED_LYRICS_DIR = path.join(BASE_DIR, 'data', 'analyzed-lyrics');
const SONGS_DIR = path.join(BASE_DIR, 'data', 'songs');
const LOGS_DIR = path.join(BASE_DIR, 'logs');
const DEFAULT_COOKIES_PATH = path.join(BASE_DIR, 'cookies.txt');

interface PlaylistOptions {
  playlist: string;
  language: string;
  skipTranslation: boolean;
  cleanSlate: boolean;
  dryRun: boolean;
  limit?: number;
  cookiesPath: string | null;
}

/**
 * Extract a playlist ID or normalize a playlist URL for yt-dlp.
 */
function normalizePlaylistInput(input: string): string {
  const trimmed = input.trim();

  // Full URL with list= param
  const listMatch = trimmed.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (listMatch) {
    return `https://www.youtube.com/playlist?list=${listMatch[1]}`;
  }

  // Bare playlist ID (PL..., UU..., OL..., RD..., etc.)
  if (/^[a-zA-Z0-9_-]{10,}$/.test(trimmed) && !/^https?:\/\//.test(trimmed)) {
    return `https://www.youtube.com/playlist?list=${trimmed}`;
  }

  // Already a URL
  if (/^https?:\/\//.test(trimmed)) {
    return trimmed;
  }

  throw new Error(`Invalid playlist URL or ID: ${input}`);
}

async function resolveCookiesPath(explicitPath?: string): Promise<string | null> {
  const candidates = [
    explicitPath,
    process.env.YTDLP_COOKIES,
    process.env.COOKIES_FILE,
    DEFAULT_COOKIES_PATH,
  ].filter((p): p is string => Boolean(p && p.trim()));

  for (const candidate of candidates) {
    const resolved = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(BASE_DIR, candidate);
    try {
      await fs.access(resolved);
      return resolved;
    } catch {
      // try next
    }
  }
  return null;
}

async function resolveYtDlp(): Promise<string | null> {
  const candidates = ['yt-dlp', path.join(process.env.HOME || '', '.local', 'bin', 'yt-dlp')];
  for (const candidate of candidates) {
    try {
      await execAsync(`"${candidate}" --version`);
      return candidate;
    } catch {
      // try next
    }
  }
  return null;
}

/**
 * Fetch video IDs from a YouTube playlist via yt-dlp.
 */
async function fetchPlaylistVideoIds(
  playlistUrl: string,
  cookiesPath: string | null,
  ytDlpPath: string
): Promise<string[]> {
  const cookiesArg = cookiesPath ? ` --cookies "${cookiesPath}"` : '';
  // --flat-playlist avoids downloading; --print id emits one ID per line
  const command = `"${ytDlpPath}" --flat-playlist --print id${cookiesArg} "${playlistUrl}"`;

  console.log(`📋 Fetching playlist videos...`);
  const { stdout, stderr } = await execAsync(command, {
    maxBuffer: 20 * 1024 * 1024,
  });

  if (stderr && !stderr.includes('WARNING') && !stderr.includes('Deprecated')) {
    console.warn(`  ⚠️  yt-dlp: ${stderr.trim()}`);
  }

  const ids = stdout
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^[a-zA-Z0-9_-]{11}$/.test(line));

  // Deduplicate while preserving order
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  return unique;
}

async function resolveTsx(): Promise<{ cmd: string; useNpx: boolean }> {
  const serverNodeModules = isDocker
    ? '/app/node_modules'
    : path.resolve(__dirname, '../server/node_modules');
  const contentGenNodeModules = isDocker
    ? '/app/content-generation-node_modules'
    : path.resolve(__dirname, '../node_modules');

  const serverTsx = path.join(serverNodeModules, '.bin', 'tsx');
  const contentGenTsx = path.join(contentGenNodeModules, '.bin', 'tsx');

  try {
    await fs.access(serverTsx);
    return { cmd: serverTsx, useNpx: false };
  } catch {
    // continue
  }
  try {
    await fs.access(contentGenTsx);
    return { cmd: contentGenTsx, useNpx: false };
  } catch {
    return { cmd: 'npx', useNpx: true };
  }
}

async function isAlreadyComplete(
  videoId: string,
  skipTranslation: boolean
): Promise<boolean> {
  if (skipTranslation) {
    return existsSync(path.join(ANALYZED_LYRICS_DIR, `${videoId}.json`));
  }
  return existsSync(path.join(SONGS_DIR, `${videoId}.json`));
}

function runPipelineForVideo(
  videoId: string,
  options: PlaylistOptions,
  tsx: { cmd: string; useNpx: boolean }
): Promise<boolean> {
  const scriptPath = isDocker
    ? '/app/scripts/download-and-transcribe.ts'
    : path.join(__dirname, 'download-and-transcribe.ts');

  const args: string[] = [];
  if (tsx.useNpx) {
    args.push('--yes', 'tsx', scriptPath, videoId);
  } else {
    args.push(scriptPath, videoId);
  }

  args.push(`--lang=${options.language}`);
  if (options.cleanSlate) {
    args.push('--clean-slate');
  }
  if (options.skipTranslation) {
    args.push('--skip-translation');
  }
  if (options.cookiesPath) {
    args.push(`--cookies=${options.cookiesPath}`);
  }

  return new Promise((resolve) => {
    const child = spawn(tsx.useNpx ? 'npx' : tsx.cmd, args, {
      cwd: BASE_DIR,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, DOCKER: isDocker ? 'true' : undefined },
    });

    child.on('close', (code) => resolve(code === 0));
    child.on('error', (error) => {
      console.error(`  ❌ Failed to start pipeline: ${error.message}`);
      resolve(false);
    });
  });
}

async function appendLog(message: string): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
    await fs.appendFile(
      path.join(LOGS_DIR, 'playlist-cron.log'),
      `[${new Date().toISOString()}] ${message}\n`
    );
  } catch {
    // non-fatal
  }
}

function printUsage(): void {
  console.error(`Usage:
  npx tsx scripts/process-playlist.ts <PLAYLIST_URL_OR_ID> [options]

Options:
  --lang=es                 Whisper / source language (default: es)
  --skip-translation        Stop after analysis; do not run multi-language translation
  --clean-slate             Re-process even if outputs already exist
  --cookies=PATH            Netscape cookies.txt for yt-dlp (default: ./cookies.txt if present)
  --limit=N                 Only process the first N videos
  --dry-run                 List playlist video IDs without processing

Environment:
  OPENAI_API_KEY            Required (unless --dry-run)
  YTDLP_COOKIES / COOKIES_FILE   Alternate cookies path

Cron example:
  0 3 * * * cd /path/to/content-generation && npx tsx scripts/process-playlist.ts 'PLAYLIST_ID' --skip-translation --lang=es >> logs/playlist-cron.log 2>&1
`);
}

async function parseArgs(argv: string[]): Promise<PlaylistOptions | null> {
  const positional = argv.find((arg) => !arg.startsWith('--'));
  if (!positional) {
    return null;
  }

  const langFlag = argv.find((arg) => arg.startsWith('--lang='));
  const cookiesFlag = argv.find((arg) => arg.startsWith('--cookies='));
  const limitFlag = argv.find((arg) => arg.startsWith('--limit='));
  const limit = limitFlag ? parseInt(limitFlag.split('=')[1], 10) : undefined;

  return {
    playlist: positional,
    language: langFlag?.split('=')[1] || 'es',
    skipTranslation: argv.includes('--skip-translation'),
    cleanSlate: argv.includes('--clean-slate'),
    dryRun: argv.includes('--dry-run'),
    limit: Number.isFinite(limit) && (limit as number) > 0 ? limit : undefined,
    cookiesPath: await resolveCookiesPath(cookiesFlag?.split('=')[1]),
  };
}

async function main() {
  const options = await parseArgs(process.argv.slice(2));
  if (!options) {
    printUsage();
    process.exit(1);
  }

  const ytDlpPath = await resolveYtDlp();
  if (!ytDlpPath) {
    console.error('❌ Error: yt-dlp is not installed.');
    console.error('   Install it with: pip install yt-dlp  (or brew install yt-dlp)');
    process.exit(1);
  }

  if (!options.dryRun && !process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  let playlistUrl: string;
  try {
    playlistUrl = normalizePlaylistInput(options.playlist);
  } catch (error) {
    console.error(`❌ ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  console.log('🚀 Playlist Content Generation');
  console.log('═'.repeat(50));
  console.log(`📺 Playlist: ${playlistUrl}`);
  console.log(`🌍 Language: ${options.language}`);
  console.log(`🌍 Skip translation: ${options.skipTranslation ? 'Yes' : 'No'}`);
  console.log(`⏭️  Clean slate: ${options.cleanSlate ? 'Yes' : 'No'}`);
  console.log(`🍪 Cookies: ${options.cookiesPath || 'none'}`);
  if (options.limit) console.log(`🔢 Limit: ${options.limit}`);
  if (options.dryRun) console.log(`🧪 Dry run: Yes`);
  console.log('═'.repeat(50));

  let videoIds: string[];
  try {
    videoIds = await fetchPlaylistVideoIds(playlistUrl, options.cookiesPath, ytDlpPath);
  } catch (error) {
    console.error('❌ Failed to fetch playlist:', error instanceof Error ? error.message : error);
    await appendLog(`FAILED fetch playlist: ${error instanceof Error ? error.message : error}`);
    process.exit(1);
  }

  if (options.limit) {
    videoIds = videoIds.slice(0, options.limit);
  }

  console.log(`✅ Found ${videoIds.length} video(s) in playlist`);
  await appendLog(
    `Playlist ${playlistUrl}: ${videoIds.length} video(s); skipTranslation=${options.skipTranslation}`
  );

  if (videoIds.length === 0) {
    console.log('Nothing to process.');
    process.exit(0);
  }

  if (options.dryRun) {
    for (const id of videoIds) {
      const done = await isAlreadyComplete(id, options.skipTranslation);
      console.log(`  ${done ? '✓' : '·'} ${id}  https://www.youtube.com/watch?v=${id}`);
    }
    console.log('\nDry run complete — no videos processed.');
    process.exit(0);
  }

  const tsx = await resolveTsx();
  const succeeded: string[] = [];
  const failed: string[] = [];
  const skipped: string[] = [];

  for (let i = 0; i < videoIds.length; i++) {
    const videoId = videoIds[i];
    console.log(`\n[${i + 1}/${videoIds.length}] ${videoId}`);

    if (!options.cleanSlate && (await isAlreadyComplete(videoId, options.skipTranslation))) {
      console.log(`  ⏭️  Already complete, skipping`);
      skipped.push(videoId);
      continue;
    }

    const ok = await runPipelineForVideo(videoId, options, tsx);
    if (ok) {
      succeeded.push(videoId);
      await appendLog(`OK ${videoId}`);
    } else {
      failed.push(videoId);
      await appendLog(`FAIL ${videoId}`);
      console.error(`  ❌ Pipeline failed for ${videoId} — continuing with next video`);
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log('📊 Playlist run summary');
  console.log(`  ✅ Succeeded: ${succeeded.length}`);
  console.log(`  ⏭️  Skipped:   ${skipped.length}`);
  console.log(`  ❌ Failed:    ${failed.length}`);
  if (failed.length > 0) {
    console.log(`  Failed IDs: ${failed.join(', ')}`);
  }
  console.log('═'.repeat(50));

  await appendLog(
    `Summary succeeded=${succeeded.length} skipped=${skipped.length} failed=${failed.length}`
  );

  process.exit(failed.length > 0 ? 1 : 0);
}

main();
