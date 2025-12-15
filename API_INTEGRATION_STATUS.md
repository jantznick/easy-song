# API Integration Status

## Backend Endpoints Available

### Authentication (`/api/auth`)
- ✅ `POST /api/auth/register` - Register new user
- ✅ `POST /api/auth/login` - Login with email/password
- ✅ `POST /api/auth/request-login-code` - Request magic code
- ✅ `POST /api/auth/verify-login-code` - Verify magic code
- ✅ `POST /api/auth/verify-email` - Verify email address
- ✅ `POST /api/auth/resend-verification` - Resend verification code
- ✅ `POST /api/auth/logout` - Logout user
- ✅ `GET /api/auth/me` - Get current user

### User Profile (`/api/user`)
- ✅ `PUT /api/user/profile` - Update user profile (name, email, avatar)
- ✅ `POST /api/user/change-password` - Change password
- ✅ `GET /api/user/:id` - Get user by ID

### User Preferences (`/api/user`)
- ✅ `GET /api/user/preferences` - Get user preferences
- ✅ `PUT /api/user/preferences` - Update user preferences

### Song History (`/api/history`)
- ✅ `POST /api/history` - Add song to history
- ✅ `GET /api/history?page=1&pageSize=20` - Get paginated history
- ❌ `DELETE /api/history` - Clear all history (removed per user request)
- ❌ `DELETE /api/history/:id` - Delete specific entry (removed per user request)

### Song Data (`/api/songs`)
- ✅ `GET /api/songs` - Get list of all songs
- ✅ `GET /api/songs/:videoId` - Get full song data
- ✅ `GET /api/songs/:videoId/study` - Get study data

### Health Check
- ✅ `GET /api/health` - Health check

---

## Mobile App API Usage

### ✅ Fully Integrated (Using Backend)
1. **Authentication**
   - ✅ `registerUser()` → `POST /api/auth/register`
   - ✅ `loginUser()` → `POST /api/auth/login`
   - ✅ `requestMagicCode()` → `POST /api/auth/request-login-code`
   - ✅ `verifyMagicCode()` → `POST /api/auth/verify-login-code`
   - ✅ `getCurrentUser()` → `GET /api/auth/me`
   - ✅ `logoutUser()` → `POST /api/auth/logout`

2. **Song Data**
   - ✅ `fetchSongs()` → `GET /api/songs`
   - ✅ `fetchSongById()` → `GET /api/songs/:videoId`
   - ✅ `fetchStudyData()` → `GET /api/songs/:videoId/study`

3. **Song History**
   - ✅ `fetchSongHistory()` → `GET /api/history`
   - ✅ `addToHistory()` (in UserContext) → `POST /api/history`

4. **User Preferences**
   - ✅ `fetchPreferences()` → `GET /api/user/preferences`
   - ✅ `updatePreferences()` → `PUT /api/user/preferences`
   - ✅ Preferences are fetched from backend on login/authentication
   - ✅ Preferences sync to backend when updated (for authenticated users)
   - ✅ Guest users continue using local storage only

### ❌ NOT Integrated (Still Using Dummy/Local Storage Only)
1. **User Profile**
   - ❌ `updateUserProfile()` - Currently a dummy function that always returns success
     - **Backend endpoint exists:** `PUT /api/user/profile`
     - **Status:** Needs to be connected to backend

2. **Change Password**
   - ❌ No API function exists for change password
     - **Backend endpoint exists:** `POST /api/user/change-password`
     - **Status:** Needs to be implemented

---

## Remaining Work

### High Priority

1. **Connect User Profile Updates to Backend**
   - Update `updateUserProfile()` in `mobile/src/utils/api.ts` to call `PUT /api/user/profile`
   - Currently it's a dummy function that always returns success
   - **Files to modify:**
     - `mobile/src/utils/api.ts` - Implement actual API call
     - `mobile/src/contexts/UserContext.tsx` - Already calls it, should work once API is connected

2. **Implement Change Password**
   - Create `changePassword()` function in `mobile/src/utils/api.ts`
   - Connect to `UserProfileSettingsScreen.tsx` (currently has a placeholder button)
   - **Files to modify:**
     - `mobile/src/utils/api.ts` - Add `changePassword()` function
     - `mobile/src/screens/UserProfileSettingsScreen.tsx` - Connect the change password button

### Medium Priority

3. **Guest History Migration on Signup** (Phase 9 from HISTORY_INTEGRATION_PLAN.md)
   - Currently `signIn` in `UserContext.tsx` has a TODO comment about migrating guest history
   - Backend doesn't have a dedicated migration endpoint, but can use `POST /api/history` for each item
   - **Status:** Partially planned, not implemented

4. **Email Verification Flow**
   - Backend endpoints exist: `POST /api/auth/verify-email`, `POST /api/auth/resend-verification`
   - Mobile app doesn't have UI for email verification yet
   - **Status:** Backend ready, UI not implemented

### Low Priority / Future

5. **Password Reset Flow**
   - Backend endpoints don't exist yet (mentioned in ENDPOINTS.md as "Future")
   - **Status:** Not needed yet

---

## Summary

**Fully Working:**
- ✅ Authentication (register, login, magic code, logout)
- ✅ Song data fetching
- ✅ Song history (add, fetch)
- ✅ User preferences (fetch on login, sync on update)

**Needs Integration:**
- ❌ User profile updates (dummy function exists)
- ❌ Change password (no function exists)

**Backend Ready, Mobile Not:**
- ❌ Email verification UI
- ❌ Guest history migration on signup

The mobile app is mostly functional. User preferences now sync to the backend and persist across devices and login sessions. User profile updates still need to be connected to the backend.
