import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';
import { prisma } from '../lib/prisma';
import { SubscriptionTier } from '@prisma/client';

// Extend Express Session to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Extend Express Request to include userId and user helper
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: {
        id: string;
        subscriptionTier: SubscriptionTier;
      };
    }
  }
}

/**
 * Middleware to check if user is authenticated
 * Also attaches user object (including subscriptionTier) to request
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = req.session as Session & { userId?: string };
  if (!session.userId) {
    console.log('[Auth Failed] No userId in session');
    console.log('[Auth Failed] Cookie header:', req.headers.cookie);
    console.log('[Auth Failed] Session ID:', req.sessionID);
    console.log('[Auth Failed] Session data:', JSON.stringify(req.session));
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  req.userId = session.userId;
  
  // Fetch and attach user data (including subscriptionTier) to request
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        subscriptionTier: true,
      },
    });
    
    if (user) {
      req.user = user;
    }
  } catch (error) {
    // If user fetch fails, continue anyway (userId is still set)
    console.error('Error fetching user in requireAuth:', error);
  }
  
  next();
}

/**
 * Middleware to check if user is authenticated (optional - doesn't fail if not)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as Session & { userId?: string };
  if (session.userId) {
    req.userId = session.userId;
  }
  next();
}

