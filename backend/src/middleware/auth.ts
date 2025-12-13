import { Request, Response, NextFunction } from 'express';
import { Session } from 'express-session';

// Extend Express Session to include userId
declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Extend Express Request to include userId helper
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to check if user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const session = req.session as Session & { userId?: string };
  if (!session.userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  req.userId = session.userId;
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

