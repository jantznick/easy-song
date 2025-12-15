import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { config } from './config';
import { sessionMiddleware } from './lib/session';
import { i18nMiddleware, t } from './middleware/i18n';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import preferencesRoutes from './routes/preferences';
import historyRoutes from './routes/history';

const app = express();
const PORT = config.port;

const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const STUDY_DIR = path.resolve(__dirname, '../data/study');

// CORS configuration - allow credentials for session cookies
app.use(cors({
  origin: [
    config.frontendUrl,
    config.mobileUrl,
    'http://localhost:5173',
    'http://localhost:8081',
    'exp://localhost:8081',
  ],
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(sessionMiddleware);
app.use(i18nMiddleware); // Language detection middleware (must be before routes)

// --- API Routes ---

// Authentication routes
app.use('/api/auth', authRoutes);

// User routes
app.use('/api/user', userRoutes);
app.use('/api/user', preferencesRoutes);

// History routes
app.use('/api/history', historyRoutes);

// --- Song Data Endpoints (existing) ---

/**
 * Endpoint to get a list of all available songs.
 * Supports two formats:
 * - Default: Returns a flat array of songs (backward compatible)
 * - format=sections: Returns songs organized by sections/genres
 * 
 * Now uses database instead of reading files for better performance.
 */
app.get('/api/songs', async (req, res) => {
  try {
    const format = req.query.format as string | undefined;
    console.log(`[API] GET /api/songs${format ? `?format=${format}` : ''} - Fetching songs from database`);
    
    // Fetch songs from database
    const dbSongs = await prisma.song.findMany({
      orderBy: { title: 'asc' },
    });
    
    console.log(`[API] Found ${dbSongs.length} songs in database`);

    // Transform to API response format
    const songs = dbSongs.map(song => ({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnailUrl: song.thumbnailUrl || undefined,
      genre: song.genre || null,
    }));

    // If format=sections, organize songs into sections
    if (format === 'sections') {
      // Use genre from database, fallback to 'Latin' if not set
      const songsWithGenres = songs.map(song => ({
        ...song,
        genre: song.genre || 'Latin',
      }));

      // Group songs by genre
      const genreMap = new Map<string, typeof songs>();
      
      songsWithGenres.forEach(song => {
        const genre = song.genre || 'Latin';
        if (!genreMap.has(genre)) {
          genreMap.set(genre, []);
        }
        genreMap.get(genre)!.push(song);
      });

      // Create sections
      const sections: Array<{
        id: string;
        title: string;
        songs: typeof songs;
      }> = [];

      // Add "All Songs" section first
      sections.push({
        id: 'all',
        title: 'All Songs',
        songs: songsWithGenres,
      });

      // Add genre sections (sorted alphabetically)
      const sortedGenres = Array.from(genreMap.entries()).sort((a, b) => 
        a[0].localeCompare(b[0])
      );

      sortedGenres.forEach(([genre, genreSongs]) => {
        if (genreSongs.length > 0) {
          sections.push({
            id: `genre-${genre.toLowerCase().replace(/\s+/g, '-')}`,
            title: genre,
            songs: genreSongs,
          });
        }
      });

      // Future: Add "Popular" section based on play counts
      // Future: Add "Recently Added" section

      res.json({ sections });
    } else {
      // Default: return flat array (backward compatible)
      res.json(songs);
    }
  } catch (error) {
    console.error('Error fetching songs list:', error);
    res.status(500).json({ error: t('errors.songs.failedToFetchList') });
  }
});

/**
 * Endpoint to get the full data for a single song by its videoId.
 * Uses database to verify song exists, then reads full structured data from file.
 */
app.get('/api/songs/:videoId', async (req, res) => {
  const { videoId } = req.params;
  console.log(`[API] GET /api/songs/${videoId} - Fetching song data`);

  try {
    // First, check if song exists in database
    const song = await prisma.song.findUnique({
      where: { videoId },
    });

    if (!song) {
      console.log(`[API] Song ${videoId} not found in database`);
      return res.status(404).json({ error: t('errors.songs.songNotFound') });
    }

    console.log(`[API] Song ${videoId} found in database, reading from file: ${song.songFilePath}`);
    // Read full structured data from file (has timestamps, full lyrics structure)
    const filePath = path.resolve(__dirname, '../data', song.songFilePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const songData = JSON.parse(fileContent);
    
    console.log(`[API] Successfully loaded song ${videoId}`);
    res.json(songData);
  } catch (error) {
    // If the file doesn't exist, it will throw an error.
    console.error(`Error fetching song ${videoId}:`, error);
    res.status(404).json({ error: t('errors.songs.songNotFound') });
  }
});

/**
 * Endpoint to get the study data for a single song by its videoId.
 * Returns structured sections for Study mode.
 * Uses database to check if study file exists, then reads from file.
 */
app.get('/api/songs/:videoId/study', async (req, res) => {
  const { videoId } = req.params;
  console.log(`[API] GET /api/songs/${videoId}/study - Fetching study data`);

  try {
    // First, check if song exists in database
    const song = await prisma.song.findUnique({
      where: { videoId },
    });

    if (!song) {
      console.log(`[API] Song ${videoId} not found in database`);
      return res.status(404).json({ error: t('errors.songs.songNotFound') });
    }

    // Check if study file path exists
    if (!song.studyFilePath) {
      console.log(`[API] Study file not found for song ${videoId}`);
      return res.status(404).json({ error: t('errors.songs.studyDataNotFound') });
    }

    console.log(`[API] Study file found for ${videoId}, reading from: ${song.studyFilePath}`);
    // Read study data from file
    const filePath = path.resolve(__dirname, '../data', song.studyFilePath);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const studyData = JSON.parse(fileContent);
    
    console.log(`[API] Successfully loaded study data for ${videoId}`);
    res.json(studyData);
  } catch (error) {
    // If the file doesn't exist, return 404
    console.error(`Error fetching study data for ${videoId}:`, error);
    res.status(404).json({ error: t('errors.songs.studyDataNotFound') });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server is running at http://localhost:${PORT}`);
  console.log(`   Also accessible on your local network at http://<your-ip>:${PORT}`);
  console.log(`   Environment: ${config.nodeEnv}`);
});
