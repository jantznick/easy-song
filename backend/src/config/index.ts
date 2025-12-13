import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resendApiKey: process.env.RESEND_API_KEY || '',
  resendFromEmail: process.env.RESEND_FROM_EMAIL || 'Easy Song <noreply@easysong.app>',
  enableEmailSending: process.env.ENABLE_EMAIL_SENDING === 'true',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  mobileUrl: process.env.MOBILE_URL || 'exp://localhost:8081',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

