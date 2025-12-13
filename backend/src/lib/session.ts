import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { prisma } from './prisma';
import { config } from '../config';

const PgSession = connectPgSimple(session);

export const sessionStore = new PgSession({
  // Use Prisma's connection string
  conString: config.databaseUrl,
  tableName: 'session', // This will be created automatically
  createTableIfMissing: true,
});

export const sessionMiddleware = session({
  store: sessionStore,
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production', // Only send over HTTPS in production
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: 'lax',
  },
  name: 'easysong.sid',
});

