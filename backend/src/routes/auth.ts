import { Router, Request, Response } from 'express';
import { Session } from 'express-session';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';
import { MagicCodeType } from '@prisma/client';
import { createAndSendMagicCode, verifyMagicCode } from '../utils/magicCode';
import { requireAuth } from '../middleware/auth';
import { validatePassword } from '../config/password';
import { t } from '../middleware/i18n';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: t('errors.auth.emailRequired') });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: t('errors.auth.passwordRequired') });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: t('errors.auth.nameRequired') });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: t('errors.auth.passwordRequirementsNotMet'),
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: t('errors.auth.userExists') });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
        emailVerified: false,
        preferences: {
          create: {},
        },
      },
      include: { preferences: true },
    });

    // Send email verification code
    try {
      await createAndSendMagicCode(
        user.email,
        MagicCodeType.EMAIL_VERIFICATION,
        user.id
      );
    } catch (error: any) {
      if (error.message === 'TOO_MANY_REQUESTS') {
        return res.status(429).json({
          error: t('errors.auth.tooManyVerificationRequestsMessage'),
        });
      }
      throw error;
    }

    // Create session
    const session = req.session as Session & { userId?: string };
    session.userId = user.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: t('errors.auth.failedToRegister') });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: t('errors.auth.emailRequired') });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: t('errors.auth.passwordRequired') });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(401).json({ error: t('errors.auth.invalidCredentials') });
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return res.status(401).json({ 
        error: t('errors.auth.noPasswordSetMessage'),
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: t('errors.auth.invalidCredentials') });
    }

    // Create session (email verification not required for login)
    const session = req.session as Session & { userId?: string };
    session.userId = user.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: t('errors.auth.failedToLogin') });
  }
});

/**
 * POST /api/auth/request-login-code
 * Request a magic code for login
 */
router.post('/request-login-code', async (req: Request, res: Response) => {
  try {
    const { email, isSignup } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: t('errors.auth.emailRequired') });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // If it's a signup flow and user already exists, return error
    if (isSignup && user) {
      return res.status(400).json({ error: t('errors.auth.userExists') });
    }

    // Create and send magic code (even if user doesn't exist yet - they'll be created on verification)
    try {
      await createAndSendMagicCode(
        email.toLowerCase(),
        MagicCodeType.LOGIN,
        user?.id
      );
    } catch (error: any) {
      if (error.message === 'TOO_MANY_REQUESTS') {
        return res.status(429).json({
          error: t('errors.auth.tooManyRequestsMessage'),
        });
      }
      throw error;
    }

    res.json({ success: true, message: t('success.loginCodeSent') });
  } catch (error) {
    console.error('Error requesting login code:', error);
    res.status(500).json({ error: t('errors.auth.failedToSendCode') });
  }
});

/**
 * POST /api/auth/verify-login-code
 * Verify magic code and create/login user
 */
router.post('/verify-login-code', async (req: Request, res: Response) => {
  try {
    const { email, code, isSignup } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: t('errors.auth.emailRequired') });
    }

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ error: t('errors.auth.codeRequired') });
    }

    const verification = await verifyMagicCode(
      email.toLowerCase(),
      code,
      MagicCodeType.LOGIN
    );

    if (!verification.valid) {
      return res.status(401).json({ error: t('errors.auth.invalidCode') });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { preferences: true },
    });

    // If it's a signup flow and user already exists, return error
    if (isSignup && user) {
      return res.status(400).json({ error: t('errors.auth.userExists') });
    }

    if (!user) {
      // Create new user
      // Email is automatically verified since they successfully received and verified the login code
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: email.split('@')[0] || 'User',
          emailVerified: true, // Auto-verified since they received the login code
          preferences: {
            create: {},
          },
        },
        include: { preferences: true },
      });
    } else if (!user.emailVerified) {
      // If existing user's email wasn't verified, verify it now since they proved email access
      user = await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
        include: { preferences: true },
      });
    }

    // Create session
    const session = req.session as Session & { userId?: string };
    session.userId = user.id;
    await new Promise<void>((resolve, reject) => {
      req.session.save((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error('Error verifying login code:', error);
    res.status(500).json({ error: t('errors.auth.verifyCodeFailed') });
  }
});

/**
 * POST /api/auth/verify-email
 * Verify email address with magic code
 */
router.post('/verify-email', requireAuth, async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ error: t('errors.auth.codeRequired') });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: t('errors.user.notFound') });
    }

    const verification = await verifyMagicCode(
      user.email,
      code,
      MagicCodeType.EMAIL_VERIFICATION
    );

    if (!verification.valid) {
      return res.status(401).json({ error: t('errors.auth.invalidCode') });
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    res.json({ success: true, message: t('success.emailVerified') });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: t('errors.auth.failedToVerifyEmail') });
  }
});

/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 */
router.post('/resend-verification', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: t('errors.user.notFound') });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: t('errors.auth.emailAlreadyVerified') });
    }

    try {
      await createAndSendMagicCode(
        user.email,
        MagicCodeType.EMAIL_VERIFICATION,
        user.id
      );
    } catch (error: any) {
      if (error.message === 'TOO_MANY_REQUESTS') {
        return res.status(429).json({
          error: t('errors.auth.tooManyVerificationRequestsMessage'),
        });
      }
      throw error;
    }

    res.json({ success: true, message: t('success.verificationCodeSent') });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ error: t('errors.auth.failedToResendVerification') });
  }
});

/**
 * POST /api/auth/logout
 * Log out user
 */
router.post('/logout', requireAuth, async (req: Request, res: Response) => {
  try {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ success: true, message: t('success.logoutSuccess') });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: t('errors.auth.logoutFailed') });
  }
});

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(404).json({ error: t('errors.user.notFound') });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: t('errors.auth.fetchUserFailed') });
  }
});

export default router;

