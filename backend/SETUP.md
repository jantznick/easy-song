# Backend Setup Guide

This guide will help you set up the backend API with PostgreSQL and Prisma.

## Prerequisites

- Node.js (v18 or later)
- Docker and Docker Compose
- Resend API key (for transactional emails)

## Setup Steps

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database
DATABASE_URL="postgresql://easysong:easysong_dev_password@localhost:5432/easysong?schema=public"

# Server
PORT=3001
NODE_ENV=development

# Session
SESSION_SECRET="your-session-secret-key-change-in-production"

# Email Configuration
# Set to 'true' to enable email sending via Resend, 'false' to log codes to console
ENABLE_EMAIL_SENDING="false"
RESEND_API_KEY="your-resend-api-key"
RESEND_FROM_EMAIL="Easy Song <noreply@easysong.app>"

# Frontend URL (for CORS and email links)
FRONTEND_URL="http://localhost:5173"
MOBILE_URL="exp://localhost:8081"
```

**Important:** 
- Generate a secure random string for `SESSION_SECRET` (you can use `openssl rand -base64 32`)
- For local development, set `ENABLE_EMAIL_SENDING="false"` - codes will be logged to console
- For production, set `ENABLE_EMAIL_SENDING="true"` and configure Resend:
  - Get your Resend API key from https://resend.com
  - Update `RESEND_FROM_EMAIL` with your verified Resend domain

### 3. Start PostgreSQL with Docker

From the project root:

```bash
docker-compose up -d
```

This will start PostgreSQL on port 5432. You can verify it's running with:

```bash
docker ps
```

### 4. Run Prisma Migrations

```bash
cd backend
npm run prisma:migrate
```

This will create all the database tables. You'll be prompted to name the migration (e.g., "init").

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001`.

## Database Management

### View Database with Prisma Studio

```bash
npm run prisma:studio
```

This opens a web interface at `http://localhost:5555` where you can view and edit your database.

### Create a New Migration

After making changes to `prisma/schema.prisma`:

```bash
npm run prisma:migrate
```

### Reset Database (⚠️ WARNING: Deletes all data)

```bash
npx prisma migrate reset
```

## API Endpoints

### Authentication
- `POST /api/auth/request-login-code` - Request a 6-digit login code
- `POST /api/auth/verify-login-code` - Verify code and create/login user
- `POST /api/auth/verify-email` - Verify email with code
- `POST /api/auth/resend-verification` - Resend verification code
- `POST /api/auth/logout` - Log out user
- `GET /api/auth/me` - Get current user

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Preferences
- `GET /api/user/preferences` - Get user preferences
- `PUT /api/user/preferences` - Update preferences (supports partial updates)

### Song History
- `POST /api/history` - Add song to history
- `GET /api/history?page=1&pageSize=20` - Get paginated history
- `DELETE /api/history` - Clear all history
- `DELETE /api/history/:id` - Delete specific entry

### Song Data (existing)
- `GET /api/songs` - Get list of songs
- `GET /api/songs/:videoId` - Get song data
- `GET /api/songs/:videoId/study` - Get study data

## Testing the API

You can test the API using curl or any HTTP client. Here's an example flow:

1. **Request login code:**
```bash
curl -X POST http://localhost:3001/api/auth/request-login-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}' \
  -c cookies.txt
```

2. **Verify code (check your email for the 6-digit code):**
```bash
curl -X POST http://localhost:3001/api/auth/verify-login-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","code":"123456"}' \
  -c cookies.txt -b cookies.txt
```

3. **Get current user:**
```bash
curl http://localhost:3001/api/auth/me \
  -b cookies.txt
```

## Troubleshooting

### Database Connection Issues

If you get connection errors:
1. Make sure Docker is running: `docker ps`
2. Check if PostgreSQL container is running: `docker-compose ps`
3. Verify DATABASE_URL in `.env` matches docker-compose.yml settings

### Session Issues

- Make sure `SESSION_SECRET` is set in `.env`
- Check that CORS is configured correctly for your frontend URL
- Ensure cookies are being sent with requests (credentials: true)

### Email Issues

- For local development, set `ENABLE_EMAIL_SENDING="false"` to see codes in console
- For production, ensure `ENABLE_EMAIL_SENDING="true"` and:
  - Verify your Resend API key is correct
  - Update `RESEND_FROM_EMAIL` with your verified domain
  - Check Resend dashboard for email delivery status

