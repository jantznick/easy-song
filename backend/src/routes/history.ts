import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { t } from '../middleware/i18n';
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
      return res.status(400).json({ error: t('errors.history.songRequired') });
    }
    if (!artist || typeof artist !== 'string') {
      return res.status(400).json({ error: t('errors.history.artistRequired') });
    }
    if (!mode || !['Play Mode', 'Study Mode'].includes(mode)) {
      return res.status(400).json({ error: t('errors.history.modeInvalid') });
    }
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: t('errors.history.videoIdRequired') });
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
    res.status(500).json({ error: t('errors.history.failedToAdd') });
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
      return res.status(400).json({ error: t('errors.history.pageInvalid') });
    }

    // Get total count first to calculate max pages
    const totalCount = await prisma.songHistory.count({
      where: { userId: req.userId! },
    });

    const maxPage = totalCount === 0 ? 1 : Math.ceil(totalCount / pageSize);
    if (page > maxPage) {
      return res.status(400).json({ 
        error: t('errors.history.pageOutOfRange', { page, maxPage }),
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
    res.status(500).json({ error: t('errors.history.failedToFetch') });
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

    res.json({ success: true, message: t('success.historyCleared') });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: t('errors.history.failedToClear') });
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
      return res.status(404).json({ error: t('errors.history.entryNotFound') });
    }

    if (historyEntry.userId !== req.userId) {
      return res.status(403).json({ error: t('errors.history.notAuthorized') });
    }

    await prisma.songHistory.delete({
      where: { id },
    });

    res.json({ success: true, message: t('success.historyEntryDeleted') });
  } catch (error) {
    console.error('Error deleting history entry:', error);
    res.status(500).json({ error: t('errors.history.failedToDelete') });
  }
});

export default router;

