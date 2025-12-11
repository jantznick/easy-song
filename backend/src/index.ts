import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3001; // Use port 3001 for the backend

const SONGS_DIR = path.resolve(__dirname, '../data/songs');
const STUDY_DIR = path.resolve(__dirname, '../data/study');

// Middleware
app.use(cors()); // Allow requests from our frontend
app.use(express.json());

// --- API Endpoints ---

/**
 * Endpoint to get a list of all available songs.
 * This reads the directory and returns a summary of each song.
 */
app.get('/api/songs', async (req, res) => {
  try {
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
          };
        })
    );
    res.json(songs);
  } catch (error) {
    console.error('Error fetching songs list:', error);
    res.status(500).json({ error: 'Failed to fetch songs list.' });
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
    res.status(404).json({ error: 'Song not found.' });
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
    res.status(404).json({ error: 'Study data not found.' });
  }
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Backend server is running at http://localhost:${PORT}`);
  console.log(`   Also accessible on your local network at http://<your-ip>:${PORT}`);
});
