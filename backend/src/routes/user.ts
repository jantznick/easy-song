import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { validatePassword } from '../config/password';

const router = Router();

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
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
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, email, avatar } = req.body;

    const updateData: { name?: string; email?: string; avatar?: string | null; emailVerified?: boolean } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name must be a non-empty string' });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (typeof email !== 'string' || !email.includes('@')) {
        return res.status(400).json({ error: 'Valid email is required' });
      }
      // Check if email is already taken by another user
      const existingUser = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser && existingUser.id !== req.userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      updateData.email = email.toLowerCase();
      // If email changed, mark as unverified
      updateData.emailVerified = false;
    }

    if (avatar !== undefined) {
      if (avatar !== null && typeof avatar !== 'string') {
        return res.status(400).json({ error: 'Avatar must be a string or null' });
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
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * POST /api/user/change-password
 * Change user password
 */
router.post('/change-password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || typeof currentPassword !== 'string') {
      return res.status(400).json({ error: 'Current password is required' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ error: 'New password is required' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'New password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { passwordHash: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return res.status(400).json({ 
        error: 'Account does not have a password set. Please set a password first.',
      });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.userId! },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

export default router;

