import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validatePassword, PASSWORD_REQUIREMENTS } from '../config/password';
import { t } from '../middleware/i18n';

const router = Router();

/**
 * GET /api/user/password-requirements
 * Get password requirements (public endpoint)
 */
router.get('/password-requirements', (req: Request, res: Response) => {
  res.json({
    requirements: PASSWORD_REQUIREMENTS,
    description: {
      minLength: `At least ${PASSWORD_REQUIREMENTS.minLength} characters`,
      maxLength: `No more than ${PASSWORD_REQUIREMENTS.maxLength} characters`,
      uppercase: PASSWORD_REQUIREMENTS.requireUppercase ? 'One uppercase letter' : null,
      lowercase: PASSWORD_REQUIREMENTS.requireLowercase ? 'One lowercase letter' : null,
      numbers: PASSWORD_REQUIREMENTS.requireNumbers ? 'One number' : null,
      specialChars: PASSWORD_REQUIREMENTS.requireSpecialChars ? `One special character (${PASSWORD_REQUIREMENTS.specialChars})` : null,
    },
  });
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, email, avatar } = req.body;

    const updateData: {
      name?: string;
      email?: string;
      avatar?: string | null;
      emailVerified?: boolean
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: t('errors.user.nameInvalid') });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: t('errors.user.emailInvalid') });
      }
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: t('errors.user.emailInUse') });
      }
      updateData.email = email.toLowerCase();
      // If email changed, mark as unverified
      updateData.emailVerified = false;
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        return res.status(400).json({ error: t('errors.user.avatarInvalid') });
      }
      updateData.avatar = avatar || null;
    }

    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: t('errors.user.failedToUpdateProfile') });
  }
});

/**
 * POST /api/user/change-password
 * Change user password (or set password if none exists)
 */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: t('errors.user.newPasswordRequired') });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: t('errors.auth.passwordRequirementsNotMet'),
        errors: passwordValidation.errors,
      });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: t('errors.user.notFound') });
    }

    // If user has a password, require and verify current password
    if (user.passwordHash) {
      if (!currentPassword || typeof currentPassword !== 'string') {
        return res.status(400).json({ error: t('errors.user.currentPasswordRequired') });
      }

      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: t('errors.user.currentPasswordIncorrect') });
      }
    }
    // If no password exists (e.g., magic link user), skip current password verification

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash: newPasswordHash },
    });

    const message = user.passwordHash 
      ? t('errors.user.passwordChanged') 
      : t('errors.user.passwordSet');

    res.json({ success: true, message });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: t('errors.user.failedToChangePassword') });
  }
});

/**
 * GET /api/user/:id
 * Get user profile by ID (requires authentication)
 * Note: This route must come after specific routes like /profile and /change-password
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: t('errors.user.notFound') });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: t('errors.user.notFound') });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: t('errors.user.failedToFetchProfile') });
  }
});

export default router;

