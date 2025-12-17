import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { t } from '../middleware/i18n';
import { SongMode, SubscriptionTier } from '@prisma/client';

const router = Router();

const DEFAULT_PAGE_SIZE = 20;
const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Find a song by videoId. Throws error if not found.
 */
async function findSong(videoId: string) {
  const song = await prisma.song.findUnique({
    where: { videoId },
  });

  if (!song) {
    throw new Error(`Song with videoId ${videoId} not found in database`);
  }

  return song;
}

/**
 * Find recent history entry for the same song/mode within the deduplication window.
 * Returns the full entry with song relation if found, null otherwise.
 */
async function findRecentHistoryEntry(
  userId: string,
  songId: string,
  mode: SongMode
) {
  const thresholdDate = new Date(Date.now() - DEDUPLICATION_WINDOW_MS);

  const recentEntry = await prisma.songHistory.findFirst({
    where: {
      userId,
      songId,
      mode,
      playedAt: {
        gte: thresholdDate, // Greater than or equal to threshold (within window)
      },
    },
    include: {
      song: true,
    },
    orderBy: {
      playedAt: 'desc', // Get the most recent one
    },
  });

  return recentEntry;
}

/**
 * POST /api/history
 * Add song to history with deduplication (10-minute window)
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { song, artist, mode, videoId } = req.body;

    // Validation
    if (!videoId || typeof videoId !== 'string') {
      return res.status(400).json({ error: t('errors.history.videoIdRequired') });
    }
    if (!mode || !['Play Mode', 'Study Mode'].includes(mode)) {
      return res.status(400).json({ error: t('errors.history.modeInvalid') });
    }

    // Convert mode string to enum
    const songMode = mode === 'Play Mode' ? SongMode.PLAY_MODE : SongMode.STUDY_MODE;

    // Find song in database (must exist)
    let songRecord;
    try {
      songRecord = await findSong(videoId.trim());
    } catch (error) {
      console.error(`Song not found: ${videoId}`, error);
      return res.status(404).json({ error: t('errors.history.songNotFound') });
    }

    // Check for recent entry within deduplication window
    const recentEntry = await findRecentHistoryEntry(
      req.userId!,
      songRecord.id,
      songMode
    );

    // If recent entry exists, return it instead of creating a new one
    if (recentEntry) {
      return res.status(200).json({
        id: recentEntry.id,
        song: recentEntry.song.title,
        artist: recentEntry.song.artist,
        mode: recentEntry.mode === SongMode.PLAY_MODE ? 'Play Mode' : 'Study Mode',
        videoId: recentEntry.song.videoId,
        date: recentEntry.playedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: recentEntry.playedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      });
    }

    // No recent entry found, create new history entry
    const historyEntry = await prisma.songHistory.create({
      data: {
        userId: req.userId!,
        songId: songRecord.id,
        mode: songMode,
        playedAt: new Date(),
      },
      include: {
        song: true,
      },
    });

    res.status(201).json({
      id: historyEntry.id,
      song: historyEntry.song.title,
      artist: historyEntry.song.artist,
      mode: historyEntry.mode === SongMode.PLAY_MODE ? 'Play Mode' : 'Study Mode',
      videoId: historyEntry.song.videoId,
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
 * View limits based on subscription tier:
 * - FREE: 5 songs max
 * - PREMIUM: 10 songs max
 * - PREMIUM_PLUS: all songs (unlimited)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;

    if (page < 1) {
      return res.status(400).json({ error: t('errors.history.pageInvalid') });
    }

    // Get user's subscription tier from request (attached by requireAuth middleware)
    if (!req.user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get total count (all history entries, regardless of tier)
    const totalCount = await prisma.songHistory.count({
      where: { userId: req.userId! },
    });

    // Get mode-specific counts (all history entries, regardless of tier)
    const playModeCount = await prisma.songHistory.count({
      where: { 
        userId: req.userId!,
        mode: SongMode.PLAY_MODE,
      },
    });

    const studyModeCount = await prisma.songHistory.count({
      where: { 
        userId: req.userId!,
        mode: SongMode.STUDY_MODE,
      },
    });

    const todayStudyModeCount = await prisma.songHistory.count({
      where: { 
        userId: req.userId!,
        mode: SongMode.STUDY_MODE,
        playedAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    // Determine view limit based on subscription tier
    let viewLimit: number | null = null; // null means no limit
    if (req.user.subscriptionTier === SubscriptionTier.FREE) {
      viewLimit = 5;
    } else if (req.user.subscriptionTier === SubscriptionTier.PREMIUM) {
      viewLimit = 10;
    }
    // PREMIUM_PLUS: viewLimit remains null (unlimited)

    // Calculate effective total count (what user can actually see)
    const effectiveTotalCount = viewLimit !== null ? Math.min(totalCount, viewLimit) : totalCount;

    // Calculate max page based on effective total
    const maxPage = effectiveTotalCount === 0 ? 1 : Math.ceil(effectiveTotalCount / pageSize);
    if (page > maxPage) {
      return res.status(400).json({ 
        error: t('errors.history.pageOutOfRange', { page, maxPage }),
        maxPage,
      });
    }

    const skip = (page - 1) * pageSize;

    // Fetch items for the validated page (include song relation)
    // Apply view limit based on subscription tier
    const queryLimit = viewLimit !== null ? Math.min(pageSize, viewLimit - skip) : pageSize;
    
    const items = await prisma.songHistory.findMany({
      where: { userId: req.userId! },
      include: {
        song: true,
      },
      orderBy: { playedAt: 'desc' },
      skip,
      take: queryLimit > 0 ? queryLimit : 0, // Don't query if limit is 0 or negative
    });

    const formattedItems = items.map(item => ({
      id: item.id,
      song: item.song.title,
      artist: item.song.artist,
      mode: item.mode === SongMode.PLAY_MODE ? 'Play Mode' : 'Study Mode',
      videoId: item.song.videoId,
      date: item.playedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: item.playedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    }));

    res.json({
      items: formattedItems,
      totalCount, // Always return full count (so UI can show "Viewing 10 of 50 songs")
      playModeCount, // Total count of Play Mode entries
      studyModeCount, // Total count of Study Mode entries
      todayStudyModeCount, // Total count of Study Mode entries today
      page,
      pageSize,
      hasMore: skip + items.length < effectiveTotalCount,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: t('errors.history.failedToFetch') });
  }
});

// DELETE endpoints removed for now - can be added later if needed

export default router;

