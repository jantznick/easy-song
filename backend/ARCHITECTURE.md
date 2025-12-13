# Backend Architecture

## Overview

The backend API has been set up with PostgreSQL, Prisma ORM, and session-based authentication. The API supports two authentication methods:
1. **Password-based authentication** - Traditional email/password login
2. **Magic code authentication** - Passwordless login using 6-digit codes sent via email

## Database Schema

### Users Table
- Stores user accounts with email, name, avatar, password hash, and email verification status
- Email is unique and indexed
- `passwordHash` is nullable - users can use magic code login without a password
- `emailVerified` tracks whether user has verified their email (optional but recommended)

### UserPreferences Table
- Stores user preferences in JSONB format
- Separate table for flexibility (not embedded in User)
- Preferences include:
  - **Playback**: autoplay, autoscroll, loop
  - **Display**: fontSize, defaultTranslation, theme
  - **Language**: learning, interface

### SongHistory Table
- **Standalone table** (not directly attached to User model for flexibility)
- Stores song play history with user_id foreign key
- Indexed on userId, videoId, and playedAt for efficient queries
- Supports pagination

### MagicCode Table
- Stores 6-digit codes for login and email verification
- Codes expire after 10 minutes
- Codes are marked as used after verification
- Indexed for fast lookups

### Session Table (managed by connect-pg-simple)
- Automatically created by connect-pg-simple
- Stores session data for authenticated users
- Sessions expire after 30 days

## Authentication Flows

### Password-Based Authentication
1. **Register**: User provides email, password, and name
   - Password is validated against requirements
   - Password is hashed with bcrypt
   - User is created with `emailVerified: false`
   - Email verification code is automatically sent
   - Session is created (user is logged in immediately)

2. **Login**: User provides email and password
   - Password is verified with bcrypt
   - **Works even if email is not verified** (verification is optional)
   - Session is created

### Magic Code Authentication (Passwordless)
1. **Request Login Code**: User requests a 6-digit code via email
2. **Verify Code**: User submits code, system creates/authenticates user
   - If user doesn't exist, account is created automatically
   - New users receive email verification code
3. **Session Created**: Express session cookie is set
4. **Email Verification**: Optional - users can verify email at any time

## API Structure

### Authentication Routes (`/api/auth`)
- `POST /register` - Register with email, password, and name
- `POST /login` - Login with email and password
- `POST /request-login-code` - Request magic code for passwordless login
- `POST /verify-login-code` - Verify magic code and login/create user
- `POST /verify-email` - Verify email address with code (requires auth)
- `POST /resend-verification` - Resend email verification code (requires auth)
- `POST /logout` - Destroy session (requires auth)
- `GET /me` - Get current user (requires auth)

### User Routes (`/api/user`)
- `GET /profile` - Get user profile (requires auth)
- `PUT /profile` - Update profile (name, email, avatar) (requires auth)
- `POST /change-password` - Change user password (requires auth)

### Preferences Routes (`/api/user`)
- `GET /preferences` - Get user preferences
- `PUT /preferences` - Update preferences (supports partial updates)

### History Routes (`/api/history`)
- `POST /` - Add song to history
- `GET /?page=1&pageSize=20` - Get paginated history
- `DELETE /` - Clear all history
- `DELETE /:id` - Delete specific entry

## Key Features

### Session Management
- Uses `express-session` with PostgreSQL store
- Sessions stored in database (survives server restarts)
- 30-day expiration
- Secure cookies (httpOnly, sameSite: lax)

### Password Authentication
- Passwords are hashed with bcrypt (10 rounds)
- Password requirements enforced (configurable in `src/config/password.ts`)
- Email verification is optional - login works with unverified emails

### Magic Code Authentication
- 6-digit codes sent via email
- 10-minute expiration
- Codes are single-use
- Automatic cleanup of expired codes
- Can be used for both login and registration (creates account if user doesn't exist)

### Real-time Sync
- All preference and history changes sync immediately
- No batching or queuing - changes are saved instantly

### Guest User Handling
- Guest users' data is stored locally (AsyncStorage in mobile app)
- When guest logs in/creates account, data can be migrated
- History/preferences only stored in DB for authenticated users

## Configuration

### Environment Variables
See `SETUP.md` for complete list. Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for signing session cookies
- `ENABLE_EMAIL_SENDING` - Set to `"true"` to send emails, `"false"` to log codes to console (default: false)
- `RESEND_API_KEY` - API key for transactional emails (only needed if email sending enabled)
- `RESEND_FROM_EMAIL` - Verified sender email address (only needed if email sending enabled)

### Password Requirements Config
Located in `src/config/password.ts` - can be shared with mobile/frontend:
- Minimum/maximum length
- Character requirements (uppercase, lowercase, numbers, special chars)
- Validation functions

## Next Steps

1. **Set up environment variables** (see SETUP.md)
2. **Start PostgreSQL**: `docker-compose up -d`
3. **Run migrations**: `npm run prisma:migrate`
4. **Generate Prisma client**: `npm run prisma:generate`
5. **Start server**: `npm run dev`

## Future Enhancements

- Password reset functionality (when needed)
- Universal links for mobile app (deep linking)
- Guest data migration endpoint (to migrate ~20 recent plays when user signs up)
- Rate limiting for magic code requests
- Email templates customization

