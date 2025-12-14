import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { config } from './config';
import { sessionMiddleware } from './lib/session';
import { i18nMiddleware, t } from './middleware/i18n';
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
 */
app.get('/api/songs', async (req, res) => {
  try {
    const format = req.query.format as string | undefined;
    const files = await fs.readdir(SONGS_DIR);
    const songs = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const filePath = path.join(SONGS_DIR, file);
          const fileContent = await fs.readFile(filePath, 'utf-8');
          const songData = JSON.parse(fileContent);
          // Return a summary object for the list view
          return {
            videoId: songData.videoId,
            title: songData.title,
            artist: songData.artist,
            thumbnailUrl: songData.thumbnailUrl,
            // Include genre if available in future
            genre: songData.genre || null,
          };
        })
    );

    // If format=sections, organize songs into sections
    if (format === 'sections') {
      // Genre mapping for songs (dummy data for now)
      const genreMap: Record<string, string> = {
        'Bad Bunny': 'Reggaeton',
        'Enrique Iglesias': 'Latin Pop',
        'marcanthonyVEVO': 'Salsa',
        'EnriqueIglesiasVEVO': 'Latin Pop',
      };

      // Assign genres to songs
      const songsWithGenres = songs.map(song => ({
        ...song,
        genre: song.genre || genreMap[song.artist] || 'Latin',
      }));

      // Group songs by genre
      const genreMap2 = new Map<string, typeof songs>();
      
      songsWithGenres.forEach(song => {
        const genre = song.genre || 'Latin';
        if (!genreMap2.has(genre)) {
          genreMap2.set(genre, []);
        }
        genreMap2.get(genre)!.push(song);
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
      const sortedGenres = Array.from(genreMap2.entries()).sort((a, b) => 
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
 */
app.get('/api/songs/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const filePath = path.join(SONGS_DIR, `${videoId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const songData = JSON.parse(fileContent);
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
 */
app.get('/api/songs/:videoId/study', async (req, res) => {
  const { videoId } = req.params;
  const filePath = path.join(STUDY_DIR, `${videoId}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const studyData = JSON.parse(fileContent);
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
