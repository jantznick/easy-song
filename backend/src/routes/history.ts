import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { SongMode } from '@prisma/client';

const router = Router();

const DEFAULT_PAGE_SIZE = 20;

/**
 * POST /api/history
 * Add song to history
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { song, artist, mode, videoId } = req.body;

    if (!song || typeof song !== 'string') {
      return res.status(400).json({ error: 'song is required and must be a string' });
    }
    if (!artist || typeof artist !== 'string') {
      return res.status(400).json({ error: 'artist is required and must be a string' });
    }
    if (!mode || !['Play Mode', 'Study Mode'].includes(mode)) {
      return res.status(400).json({ error: 'mode must be "Play Mode" or "Study Mode"' });
    }
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: 'videoId is required and must be a string' });
    }

    // Convert mode string to enum
    const songMode = mode === 'Play Mode' ? SongMode.PLAY_MODE : SongMode.STUDY_MODE;

    const historyEntry = await prisma.songHistory.create({
      data: {
        userId: req.userId!,
        song: song.trim(),
        artist: artist.trim(),
        mode: songMode,
        videoId: videoId.trim(),
        playedAt: new Date(),
      },
    });

    res.status(201).json({
      id: historyEntry.id,
      song: historyEntry.song,
      artist: historyEntry.artist,
      mode: historyEntry.mode === SongMode.PLAY_MODE ? 'Play Mode' : 'Study Mode',
      videoId: historyEntry.videoId,
      date: historyEntry.playedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: historyEntry.playedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    });
  } catch (error) {
    console.error('Error adding to history:', error);
    res.status(500).json({ error: 'Failed to add to history' });
  }
});

/**
 * GET /api/history
 * Get paginated song history
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;

    if (page < 1) {
      return res.status(400).json({ error: 'page must be >= 1' });
    }

    // Get total count first to calculate max pages
    const totalCount = await prisma.songHistory.count({
      where: { userId: req.userId! },
    });

    const maxPage = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
    if (page > maxPage) {
      return res.status(400).json({ 
        error: `Page ${page} is out of range. Maximum page is ${maxPage}`,
        maxPage,
      });
    }

    const skip = (page - 1) * pageSize;

    // Fetch items for the validated page
    const items = await prisma.songHistory.findMany({
      where: { userId: req.userId! },
      orderBy: { playedAt: 'desc' },
      skip,
      take: pageSize,
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      song: item.song,
      artist: item.artist,
      mode: item.mode === SongMode.PLAY_MODE ? 'Play Mode' : 'Study Mode',
      videoId: item.videoId,
      date: item.playedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: item.playedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }));

    res.json({
      items: formattedItems,
      totalCount,
      page,
      pageSize,
      hasMore: skip + items.length < totalCount,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * DELETE /api/history
 * Clear all history for user
 */
router.delete('/', requireAuth, async (req: Request, res: Response) => {
  try {
    await prisma.songHistory.deleteMany({
      where: { userId: req.userId! },
    });

    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

/**
 * DELETE /api/history/:id
 * Delete specific history entry
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const historyEntry = await prisma.songHistory.findUnique({
      where: { id },
    });

    if (!historyEntry) {
      return res.status(404).json({ error: 'History entry not found' });
    }

    if (historyEntry.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this entry' });
    }

    await prisma.songHistory.delete({
      where: { id },
    });

    res.json({ success: true, message: 'History entry deleted' });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: 'Failed to delete history entry' });
  }
});

export default router;

