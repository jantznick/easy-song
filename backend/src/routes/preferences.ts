import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * GET /api/user/preferences
 * Get user preferences
 */
router.get('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    let preferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId! },
    });

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: { userId: req.userId! },
      });
    }

    res.json({
      playback: preferences.playback,
      display: preferences.display,
      language: preferences.language,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

/**
 * PUT /api/user/preferences
 * Update user preferences (supports partial updates)
 */
router.put('/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const { playback, display, language } = req.body;

    // Get current preferences
    let currentPreferences = await prisma.userPreferences.findUnique({
      where: { userId: req.userId! },
    });

    if (!currentPreferences) {
      currentPreferences = await prisma.userPreferences.create({
        data: { userId: req.userId! },
      });
    }

    // Merge updates
    const updatedPreferences = {
      playback: playback !== undefined ? { ...currentPreferences.playback as object, ...playback } : currentPreferences.playback,
      display: display !== undefined ? { ...currentPreferences.display as object, ...display } : currentPreferences.display,
      language: language !== undefined ? { ...currentPreferences.language as object, ...language } : currentPreferences.language,
    };

    // Validate preferences structure
    if (updatedPreferences.playback) {
      const playbackPrefs = updatedPreferences.playback as any;
      if (playbackPrefs.autoplay !== undefined && typeof playbackPrefs.autoplay !== 'boolean') {
        return res.status(400).json({ error: 'playback.autoplay must be a boolean' });
      }
      if (playbackPrefs.autoscroll !== undefined && typeof playbackPrefs.autoscroll !== 'boolean') {
        return res.status(400).json({ error: 'playback.autoscroll must be a boolean' });
      }
      if (playbackPrefs.loop !== undefined && typeof playbackPrefs.loop !== 'boolean') {
        return res.status(400).json({ error: 'playback.loop must be a boolean' });
      }
    }

    if (updatedPreferences.display) {
      const displayPrefs = updatedPreferences.display as any;
      if (displayPrefs.fontSize !== undefined && !['small', 'medium', 'large'].includes(displayPrefs.fontSize)) {
        return res.status(400).json({ error: 'display.fontSize must be one of: small, medium, large' });
      }
      if (displayPrefs.defaultTranslation !== undefined && typeof displayPrefs.defaultTranslation !== 'boolean') {
        return res.status(400).json({ error: 'display.defaultTranslation must be a boolean' });
      }
      if (displayPrefs.theme !== undefined && !['light', 'dark', 'system'].includes(displayPrefs.theme)) {
        return res.status(400).json({ error: 'display.theme must be one of: light, dark, system' });
      }
    }

    if (updatedPreferences.language) {
      const languagePrefs = updatedPreferences.language as any;
      if (languagePrefs.learning !== undefined && typeof languagePrefs.learning !== 'string') {
        return res.status(400).json({ error: 'language.learning must be a string' });
      }
      if (languagePrefs.interface !== undefined && typeof languagePrefs.interface !== 'string') {
        return res.status(400).json({ error: 'language.interface must be a string' });
      }
    }

    // Update preferences
    const updated = await prisma.userPreferences.update({
      where: { userId: req.userId! },
      data: updatedPreferences,
    });

    res.json({
      playback: updated.playback,
      display: updated.display,
      language: updated.language,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;

