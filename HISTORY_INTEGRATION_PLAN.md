# History Integration Plan

## Overview
Integrate history functionality with proper deduplication, user tier limits, and correct entry logging behavior.

## Requirements Summary
1. **Free users (logged in)**: View last 10 songs, but save all to backend (for premium conversion)
2. **Guest users**: View last 3 songs, save only 3 on-device
3. **Premium users (both tiers)**: View all songs in history
4. **Subscription tiers**: Add subscription tier to User model (FREE, PREMIUM, PREMIUM_PLUS) - supports future study mode limits
5. **Song table**: Add Song model to database (hybrid approach - metadata in DB, full content in files)
6. **History references**: Update SongHistory to reference Song table instead of duplicating song/artist/videoId
7. **Deduplication**: Don't log if same song/mode was saved within 10 minutes
8. **Fix current bug**: Currently updating time on duplicates - should create separate entries

## Current State Analysis

### Backend (`backend/src/routes/history.ts`)
- ✅ POST `/api/history` - Creates new entry (no deduplication)
- ✅ GET `/api/history` - Returns paginated history
- ✅ DELETE `/api/history` - Clears all history
- ✅ DELETE `/api/history/:id` - Deletes specific entry
- ❌ No deduplication logic (10-minute window)
- ❌ No premium/free distinction in response

### Frontend (`mobile/src/contexts/UserContext.tsx`)
- ✅ `addToHistory` - Adds to backend if authenticated, local if guest
- ✅ `fetchMoreHistory` - Fetches paginated history
- ✅ `clearHistory` - Clears history
- ❌ No deduplication check before adding
- ❌ No limit enforcement for guest users (20 max)
- ❌ No view limit for free users (should only show 20, but save all)

### Database Schema
- ✅ `SongHistory` model exists with proper fields
- ❌ `User` model missing subscription tier field
- ❌ `Song` model doesn't exist (need to add for hybrid approach)
- ❌ `SongHistory` duplicates song/artist/videoId (should reference Song table)

## Implementation Plan

### Phase 1: Database Schema Updates
**Goal**: Add subscription tiers, Song table, and update SongHistory to reference Song

**Tasks**:
1. Add `SubscriptionTier` enum (FREE, PREMIUM, PREMIUM_PLUS) to Prisma schema
2. Add `subscriptionTier` field to User model (default: FREE)
3. Add `Song` model with:
   - Basic metadata (videoId, title, artist, thumbnailUrl, genre, year, duration)
   - Multi-language lyrics text fields:
     - `lyricsTextSpanish` (required) - Original Spanish lyrics for search
     - `lyricsTextEnglish` (optional) - English translation for search
     - Additional languages can be added later (e.g., French, Portuguese)
   - File paths (songFilePath, studyFilePath)
4. Update `SongHistory` model:
   - Remove `song`, `artist`, `videoId` fields (now in Song table)
   - Add `songId` foreign key to Song table
   - Add composite index for deduplication queries
5. Create and run migration
6. Update TypeScript types

**Testing**:
- Verify migration runs successfully
- Verify existing users default to `subscriptionTier: FREE`
- Verify Song table structure is correct
- Verify SongHistory foreign key relationship works

---

### Phase 2: Backend Deduplication Logic
**Goal**: Prevent duplicate entries within 10-minute window

**Tasks**:
1. Update POST `/api/history` endpoint to check for recent entry:
   - First, find or create Song record (by videoId)
   - Query for last entry with same `userId`, `songId`, and `mode`
   - If found and `playedAt` is within 10 minutes, return existing entry (don't create new)
   - If not found or >10 minutes, create new entry
2. Add helper function `findOrCreateSong(videoId, song, artist, ...)` to get/create Song record
3. Add helper function `findRecentHistoryEntry(userId, songId, mode, minutesThreshold)`
4. Update response to include song metadata from Song table

**Testing**:
- Test: Add same song/mode twice within 10 minutes → should return existing entry
- Test: Add same song/mode after 10 minutes → should create new entry
- Test: Add same song but different mode → should create new entry
- Test: Add different song → should create new entry

---

### Phase 3: Backend View Limits Based on Subscription Tier
**Goal**: Return limited items for free users, all items for premium users, but still save all

**Tasks**:
1. Update GET `/api/history` endpoint:
   - Check user's `subscriptionTier` status
   - If FREE user: Limit query to last 10 items (but don't delete others)
   - If PREMIUM or PREMIUM_PLUS: Return all items
   - Always return full `totalCount` (so UI can show "Viewing 10 of 50 songs")
   - Include song metadata from Song table in response
2. Ensure POST still saves all entries regardless of subscription tier

**Testing**:
- Test: FREE user with 50 history items → GET returns only 10, totalCount shows 50 (full count)
- Test: PREMIUM user with 50 history items → GET returns all 50, totalCount shows 50
- Test: PREMIUM_PLUS user with 50 history items → GET returns all 50, totalCount shows 50
- Test: FREE user adds new entry → POST succeeds, entry is saved
- Test: FREE user with 10+ items → Verify older items still exist in DB (not deleted)

---

### Phase 4: Client-Side Deduplication (Defense in Depth)
**Goal**: Add client-side check to prevent unnecessary API calls

**Tasks**:
1. Update `addToHistory` in `UserContext.tsx`:
   - Before calling API, check local history for recent entry (same videoId + mode within 10 minutes)
   - If found, skip API call (but still update local state if needed)
   - This prevents unnecessary network requests
2. Add helper function `hasRecentHistoryEntry(history, videoId, mode, minutesThreshold)`

**Testing**:
- Test: Guest user adds same song/mode twice within 10 minutes → Only one entry saved locally
- Test: Guest user adds same song/mode after 10 minutes → Two entries saved
- Test: Authenticated user → Client check + server check both work

---

### Phase 5: Guest User Storage Limits
**Goal**: Limit guest users to storing only 3 items on-device

**Tasks**:
1. Update `addToHistory` in `UserContext.tsx` for guest users:
   - After adding new entry, check if history length > 3
   - If > 3, remove oldest entries (keep only last 3)
   - Update local storage with trimmed history
2. Update `saveSongHistory` to enforce this limit for guest users

**Testing**:
- Test: Guest user adds 4th entry → Only 3 entries remain (oldest removed)
- Test: Guest user adds entries over time → Always maintains exactly 3 most recent
- Test: Authenticated user → No limit applied (all entries saved)

---

### Phase 6: Free User View Limits (Client-Side)
**Goal**: Limit displayed history to 10 items for free users, but keep all in state

**Tasks**:
1. Update `UserContext.tsx`:
   - Add `displayedHistory` computed property that returns:
     - For free users: Last 10 items from `songHistory`
     - For premium users: All items from `songHistory`
   - Keep `songHistory` with all items (for free users, backend already limits to 10, but we want to be ready)
2. Update `SongHistoryScreen.tsx`:
   - Use `displayedHistory` instead of `songHistory` for rendering
   - Update pagination logic to work with displayed items
   - Show message if user has more than 10 items (e.g., "Upgrade to see full history")

**Note**: Since backend already limits free users to 10 items, this is mainly for UI consistency and future-proofing.

**Testing**:
- Test: Free user → Only sees 10 items in history screen
- Test: Premium user → Sees all items
- Test: Premium_plus user → Sees all items
- Test: Free user pagination → Works correctly with 10-item limit

---

### Phase 7: Update API Response Handling
**Goal**: Ensure client properly handles subscription tier and view limits

**Tasks**:
1. Update `fetchSongHistory` in `api.ts` to handle subscription tier if returned
2. Update `UserContext.tsx` to track user's subscription tier
3. Update `getCurrentUser` response handling to include subscription tier
4. Update auth endpoints to return subscription tier in user object

**Testing**:
- Test: FREE user login → Subscription tier correctly set to FREE
- Test: PREMIUM user login → Subscription tier correctly set to PREMIUM
- Test: PREMIUM_PLUS user login → Subscription tier correctly set to PREMIUM_PLUS

---

### Phase 8: Guest History Warnings
**Goal**: Show warnings to guest users as they approach the 20-song limit

**Tasks**:
1. Update `UserContext.tsx`:
   - Add `shouldShowHistoryWarning` computed property (true if guest and history.length >= 10)
   - Add `historyWarningLevel` ('info' if >= 10, 'urgent' if >= 15)
2. Update `SongHistoryScreen.tsx`:
   - Show info banner at 10 songs: "You have X songs in your history. Sign up to save them permanently!"
   - Show urgent banner at 15 songs: "You have X songs! Sign up now to save your entire listening history!"
   - Add "Sign up" CTA button

**Testing**:
- Test: Guest user with 9 songs → No warning shown
- Test: Guest user with 10 songs → Info banner shown
- Test: Guest user with 15 songs → Urgent banner shown
- Test: Guest user with 20 songs → Urgent banner still shown
- Test: Authenticated user → No warnings shown

---

### Phase 9: Guest History Migration on Signup
**Goal**: Migrate guest user's local history to their new account when they sign up

**Tasks**:
1. Update `signIn` function in `UserContext.tsx`:
   - Before clearing local history, check if guest history exists
   - If exists and user is now authenticated, migrate all items to server:
     - POST each item to `/api/history` endpoint
     - Handle deduplication (server will handle 10-min window)
     - Use `Promise.allSettled` to continue even if some fail
   - Clear local history after successful migration
   - Fetch fresh history from server
2. Handle edge cases:
   - Network failures during migration → Log errors but don't fail signup
   - Partial migration → Continue with successfully migrated items

**Testing**:
- Test: Guest user with 5 songs signs up → All 5 songs migrated to account
- Test: Guest user with 20 songs signs up → All 20 songs migrated to account
- Test: Guest user with 0 songs signs up → No migration, no errors
- Test: Network failure during migration → Signup succeeds, errors logged
- Test: Duplicate entries → Server deduplication handles correctly

---

## Testing Checklist

### Manual Testing Steps

#### Phase 1: Database
- [ ] Run migration successfully
- [ ] Verify existing users have `subscriptionTier: FREE`
- [ ] Verify Song table structure is correct
- [ ] Verify SongHistory foreign key relationship works
- [ ] Manually set a user to PREMIUM in DB, verify it persists
- [ ] Manually set a user to PREMIUM_PLUS in DB, verify it persists

#### Phase 2: Backend Deduplication
- [ ] Login as authenticated user
- [ ] Play same song in same mode twice within 10 minutes → Should see only 1 entry
- [ ] Play same song in same mode after 10+ minutes → Should see 2 entries
- [ ] Play same song in different modes → Should see 2 entries (one per mode)
- [ ] Check database directly to verify entries

#### Phase 3: Backend View Limits
- [ ] Create FREE user account
- [ ] Add 25 history entries (via API or app)
- [ ] GET `/api/history` → Should return only 10 items, totalCount = 25 (full count)
- [ ] Check database → Should have all 25 entries
- [ ] Upgrade user to PREMIUM in DB
- [ ] GET `/api/history` → Should return all 25 items, totalCount = 25
- [ ] Upgrade user to PREMIUM_PLUS in DB
- [ ] GET `/api/history` → Should return all 25 items, totalCount = 25

#### Phase 4: Client Deduplication
- [ ] Test as guest user: Add same song/mode twice within 10 min → Only 1 entry
- [ ] Test as authenticated user: Add same song/mode twice within 10 min → Only 1 entry (client + server check)

#### Phase 5: Guest Storage Limits
- [ ] Test as guest user: Add 4 songs → Verify only 3 stored
- [ ] Test as guest user: Add more songs over time → Always maintains 3 most recent
- [ ] Test as authenticated user: Add 4+ songs → All stored (no limit)

#### Phase 6: Free User View Limits
- [ ] Test as free user: View history screen → Only 10 items shown
- [ ] Test as premium user: View history screen → All items shown
- [ ] Test as premium_plus user: View history screen → All items shown
- [ ] Test pagination for all user types

#### Phase 8: Guest History Warnings
- [ ] Guest user with 9 songs → No warning
- [ ] Guest user with 10 songs → Info banner appears
- [ ] Guest user with 15 songs → Urgent banner appears
- [ ] Authenticated user → No warnings

#### Phase 9: Guest History Migration
- [ ] Guest user with 5 songs signs up → All migrated
- [ ] Guest user with 20 songs signs up → All migrated
- [ ] Network failure during migration → Signup succeeds, errors logged
- [ ] Duplicate entries → Server deduplication works

#### Phase 7: Integration
- [ ] Full flow: Guest user → Add songs → Convert to free account → History syncs
- [ ] Full flow: FREE user → Add 30 songs → View history (20 shown, totalCount=30) → Upgrade to PREMIUM → All 30 shown
- [ ] Edge cases: Network failures, offline mode, etc.

---

## Implementation Order

1. **Phase 1** - Database schema (foundation)
2. **Phase 2** - Backend deduplication (core logic)
3. **Phase 3** - Backend view limits (server-side enforcement)
4. **Phase 4** - Client deduplication (optimization)
5. **Phase 5** - Guest storage limits (client-side enforcement)
6. **Phase 6** - Free user view limits (UI)
7. **Phase 7** - API response handling (polish)
8. **Phase 8** - Guest history warnings (UX enhancement)
9. **Phase 9** - Guest history migration (data preservation)

---

## Key Design Decisions

### Deduplication: Server-Side vs Client-Side
- **Server-side (primary)**: Always enforced, prevents duplicates even if client is compromised
- **Client-side (secondary)**: Reduces unnecessary API calls, improves UX
- **Both**: Defense in depth approach

### 10-Minute Window
- Prevents spam from rapid toggling between modes
- Allows legitimate separate listening sessions
- Configurable constant: `DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000`

### Free User Strategy
- **Save all**: Enables seamless upgrade to premium (no data loss)
- **View 10**: Provides value while encouraging upgrade
- **Backend enforcement**: Prevents client manipulation

### Guest User Strategy
- **Save 3**: On-device storage is limited, no backend sync
- **View 3**: Minimal storage footprint
- **Client enforcement**: No backend to enforce, must be client-side

### Premium User Strategy
- **View all**: Full access to complete history
- **No limits**: Both PREMIUM and PREMIUM_PLUS tiers have unlimited history viewing

---

## Files to Modify

### Backend
- `backend/prisma/schema.prisma` - Add `SubscriptionTier` enum, `subscriptionTier` field, `Song` model, update `SongHistory`
- `backend/src/routes/history.ts` - Add deduplication, view limits, Song lookup/creation
- `backend/prisma/migrations/` - New migration file

### Frontend
- `mobile/src/contexts/UserContext.tsx` - Add deduplication, guest limits, premium tracking
- `mobile/src/utils/api.ts` - Update response handling if needed
- `mobile/src/screens/SongHistoryScreen.tsx` - Use displayedHistory for free users
- `mobile/src/utils/storage.ts` - Add helper for guest limit enforcement

---

## Future Considerations

1. **Subscription Management**: Add admin endpoint or user settings to manage subscription tiers
2. **Study Mode Limits**: Implement daily song limits for study mode based on subscription tier
3. **History Export**: Allow users to export full history
4. **Analytics**: Track how many users hit the 20-item limit
5. **Upgrade Prompts**: Show upgrade prompts when free users hit limits
6. **Sync on Upgrade**: Ensure guest → free → premium transitions preserve all history
7. **Song Migration**: Create script to populate Song table from existing JSON files
8. **Search Feature**: Implement full-text search on lyrics using PostgreSQL FTS
