# API Endpoints Reference

## ✅ Created Endpoints

### Authentication (`/api/auth`)

#### Registration & Login
- `POST /api/auth/register` - Register new user with email, password, and name
  - Validates password requirements
  - Creates user with `emailVerified: false`
  - Sends email verification code automatically
  - Creates session (user is logged in immediately)
  - Returns user object with `emailVerified: false`

- `POST /api/auth/login` - Login with email and password
  - Verifies password with bcrypt
  - **Works even if email is not verified** (verification is optional)
  - Creates session
  - Returns user object with `emailVerified` status
  - Returns error if account has no password (use magic code login instead)

#### Magic Code Authentication (Alternative Login Method)
- `POST /api/auth/request-login-code` - Request a 6-digit magic code sent to email
  - Works for both new and existing users
  - If user doesn't exist, they'll be created on code verification

- `POST /api/auth/verify-login-code` - Verify magic code and login/create user
  - **Automatically creates user if they don't exist** (magic code registration)
  - New users created with email as name, `emailVerified=false`, and default preferences
  - New users automatically receive an email verification code
  - Creates session
  - **Works even if email is not verified**

#### Email Verification
- `POST /api/auth/verify-email` - Verify email address with magic code (requires auth)
  - Updates `emailVerified: true` after successful code verification
  - User must be authenticated (have active session)

- `POST /api/auth/resend-verification` - Resend email verification code (requires auth)
  - Only works if email is not already verified
  - User must be authenticated

#### Session Management
- `POST /api/auth/logout` - Destroy session and log out user (requires auth)
- `GET /api/auth/me` - Get current authenticated user info (requires auth)
  - Returns user object including `emailVerified` status

### User Profile (`/api/user`)
- `GET /api/user/profile` - Get user profile (requires auth)
- `PUT /api/user/profile` - Update user profile (name, email, avatar) (requires auth)
- `POST /api/user/change-password` - Change user password (requires auth, needs current password)

### User Preferences (`/api/user`)
- `GET /api/user/preferences` - Get user preferences (playback, display, language) (requires auth)
- `PUT /api/user/preferences` - Update user preferences (supports partial updates) (requires auth)

### Song History (`/api/history`)
- `POST /api/history` - Add song to history (requires auth)
- `GET /api/history?page=1&pageSize=20` - Get paginated song history (requires auth)
- `DELETE /api/history` - Clear all history for user (requires auth)
- `DELETE /api/history/:id` - Delete specific history entry (requires auth)

### Song Data (`/api/songs`)
- `GET /api/songs` - Get list of all available songs (public)
- `GET /api/songs/:videoId` - Get full song data by videoId (public)
- `GET /api/songs/:videoId/study` - Get study data for song by videoId (public)

### Health Check
- `GET /api/health` - Health check endpoint (public)

---

## ❌ Missing Endpoints (To Be Created)

### Guest Data Migration
- `POST /api/auth/migrate-guest-data` - Migrate guest user's local history/preferences when they sign up (requires auth)
  - Should accept array of history items and preferences object
  - Should limit to ~20 most recent history items
  - Should merge preferences intelligently

### Password Management (Future - Not Yet Needed)
- `POST /api/auth/request-password-reset` - Request password reset code (forgot password flow)
- `POST /api/auth/reset-password` - Reset password with code (forgot password flow)

---

## Authentication & Email Verification Notes

### Login Behavior
- **Email verification is NOT required for login** - users can login with unverified emails
- Both password login and magic code login work regardless of verification status
- The `emailVerified` field is returned in user objects so clients can show verification prompts

### Registration Flow
1. User registers → Account created with `emailVerified: false`
2. Verification code is automatically sent via email
3. User is logged in immediately (session created)
4. User can verify email at any time using `/api/auth/verify-email`

### Verification Flow
- Email verification is **optional but recommended**
- Users can use the app fully without verifying their email
- Verification code expires after 10 minutes
- Users can request a new verification code via `/api/auth/resend-verification`

### Session Management
- All endpoints marked "(requires auth)" need a valid session cookie
- Sessions are created on successful login/registration
- Sessions expire after 30 days
- Session cookies are httpOnly and use sameSite: 'lax' for security

### Data Sync
- Preferences and history sync immediately (real-time) when updated
- Guest users' data is stored locally until they sign up
- Default page size for history pagination is 20 items

