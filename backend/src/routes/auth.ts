import { Router, Request, Response } from 'express';
import { Session } from 'express-session';
import bcrypt from 'bcrypt';
import { prisma, Prisma } from '../lib/prisma';
import { createAndSendMagicCode, verifyMagicCode } from '../utils/magicCode';
import { requireAuth } from '../middleware/auth';
import { validatePassword } from '../config/password';

const MagicCodeType = Prisma.MagicCodeType;

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        errors: passwordValidation.errors,
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
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
    await createAndSendMagicCode(
      user.email,
      MagicCodeType.EMAIL_VERIFICATION,
      user.id
    );

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
    res.status(500).json({ error: 'Failed to register user' });
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
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!password || typeof password !== 'string') {
      return res.status(400).json({ error: 'Password is required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { preferences: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user has a password set
    if (!user.passwordHash) {
      return res.status(401).json({ 
        error: 'This account does not have a password set. Please use magic code login.',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
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
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/auth/request-login-code
 * Request a magic code for login
 */
router.post('/request-login-code', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Create and send magic code (even if user doesn't exist yet - they'll be created on verification)
    await createAndSendMagicCode(
      email.toLowerCase(),
      MagicCodeType.LOGIN,
      user?.id
    );

    res.json({ success: true, message: 'Login code sent to email' });
  } catch (error) {
    console.error('Error requesting login code:', error);
    res.status(500).json({ error: 'Failed to send login code' });
  }
});

/**
 * POST /api/auth/verify-login-code
 * Verify magic code and create/login user
 */
router.post('/verify-login-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return res.status(400).json({ error: 'Valid 6-digit code is required' });
    }

    const verification = await verifyMagicCode(
      email.toLowerCase(),
      code,
      MagicCodeType.LOGIN
    );

    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { preferences: true },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          name: email.split('@')[0] || 'User',
          emailVerified: false, // Will need email verification
          preferences: {
            create: {},
          },
        },
        include: { preferences: true },
      });

      // Send email verification code
      await createAndSendMagicCode(
        email.toLowerCase(),
        MagicCodeType.EMAIL_VERIFICATION,
        user.id
      );
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
    res.status(500).json({ error: 'Failed to verify code' });
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
      return res.status(400).json({ error: 'Valid 6-digit code is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const verification = await verifyMagicCode(
      user.email,
      code,
      MagicCodeType.EMAIL_VERIFICATION
    );

    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid or expired code' });
    }

    // Update user email verification status
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ error: 'Failed to verify email' });
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
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    await createAndSendMagicCode(
      user.email,
      MagicCodeType.EMAIL_VERIFICATION,
      user.id
    );

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error) {
    console.error('Error resending verification:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
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

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to log out' });
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
      return res.status(404).json({ error: 'User not found' });
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
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;

