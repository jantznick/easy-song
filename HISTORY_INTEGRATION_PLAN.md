# History Integration Plan

## Overview
Integrate history functionality with proper deduplication, user tier limits, and correct entry logging behavior.

## Requirements Summary
1. **Free users (logged in)**: View last 20 songs, but save all to backend (for premium conversion)
2. **Guest users**: View last 20 songs, save only 20 on-device
3. **Premium field**: Add to User model (DB toggle for future use)
4. **Deduplication**: Don't log if same song/mode was saved within 10 minutes
5. **Fix current bug**: Currently updating time on duplicates - should create separate entries

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
- ❌ `User` model missing `isPremium` field

## Implementation Plan

### Phase 1: Database Schema Updates
**Goal**: Add premium field to User model

**Tasks**:
1. Add `isPremium` boolean field to User model in Prisma schema (default: false)
2. Create and run migration
3. Update TypeScript types

**Testing**:
- Verify migration runs successfully
- Verify existing users default to `isPremium: false`

---

### Phase 2: Backend Deduplication Logic
**Goal**: Prevent duplicate entries within 10-minute window

**Tasks**:
1. Update POST `/api/history` endpoint to check for recent entry:
   - Query for last entry with same `userId`, `videoId`, and `mode`
   - If found and `playedAt` is within 10 minutes, return existing entry (don't create new)
   - If not found or >10 minutes, create new entry
2. Add helper function `findRecentHistoryEntry(userId, videoId, mode, minutesThreshold)`

**Testing**:
- Test: Add same song/mode twice within 10 minutes → should return existing entry
- Test: Add same song/mode after 10 minutes → should create new entry
- Test: Add same song but different mode → should create new entry
- Test: Add different song → should create new entry

---

### Phase 3: Backend View Limits for Free Users
**Goal**: Return only last 20 items for free users, but still save all

**Tasks**:
1. Update GET `/api/history` endpoint:
   - Check user's `isPremium` status
   - If free user: Limit query to last 20 items (but don't delete others)
   - If premium user: Return all items as before
   - Update `totalCount` calculation accordingly
2. Ensure POST still saves all entries regardless of premium status

**Testing**:
- Test: Free user with 50 history items → GET returns only 20, totalCount shows 20
- Test: Premium user with 50 history items → GET returns all 50, totalCount shows 50
- Test: Free user adds new entry → POST succeeds, entry is saved
- Test: Free user with 20+ items → Verify older items still exist in DB (not deleted)

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
**Goal**: Limit guest users to storing only 20 items on-device

**Tasks**:
1. Update `addToHistory` in `UserContext.tsx` for guest users:
   - After adding new entry, check if history length > 20
   - If > 20, remove oldest entries (keep only last 20)
   - Update local storage with trimmed history
2. Update `saveSongHistory` to enforce this limit for guest users

**Testing**:
- Test: Guest user adds 21st entry → Only 20 entries remain (oldest removed)
- Test: Guest user adds entries over time → Always maintains exactly 20 most recent
- Test: Authenticated user → No limit applied (all entries saved)

---

### Phase 6: Free User View Limits (Client-Side)
**Goal**: Limit displayed history to 20 items for free users, but keep all in state

**Tasks**:
1. Update `UserContext.tsx`:
   - Add `displayedHistory` computed property that returns:
     - For free users: Last 20 items from `songHistory`
     - For premium users: All items from `songHistory`
   - Keep `songHistory` with all items (for free users, backend already limits to 20, but we want to be ready)
2. Update `SongHistoryScreen.tsx`:
   - Use `displayedHistory` instead of `songHistory` for rendering
   - Update pagination logic to work with displayed items
   - Show message if user has more than 20 items (e.g., "Upgrade to see full history")

**Note**: Since backend already limits free users to 20 items, this is mainly for UI consistency and future-proofing.

**Testing**:
- Test: Free user → Only sees 20 items in history screen
- Test: Premium user → Sees all items
- Test: Free user pagination → Works correctly with 20-item limit

---

### Phase 7: Update API Response Handling
**Goal**: Ensure client properly handles premium status and view limits

**Tasks**:
1. Update `fetchSongHistory` in `api.ts` to handle premium status if returned
2. Update `UserContext.tsx` to track user's premium status
3. Update `getCurrentUser` response handling if premium status is included

**Testing**:
- Test: Free user login → Premium status correctly set to false
- Test: Premium user login → Premium status correctly set to true

---

## Testing Checklist

### Manual Testing Steps

#### Phase 1: Database
- [ ] Run migration successfully
- [ ] Verify existing users have `isPremium: false`
- [ ] Manually set a user to premium in DB, verify it persists

#### Phase 2: Backend Deduplication
- [ ] Login as authenticated user
- [ ] Play same song in same mode twice within 10 minutes → Should see only 1 entry
- [ ] Play same song in same mode after 10+ minutes → Should see 2 entries
- [ ] Play same song in different modes → Should see 2 entries (one per mode)
- [ ] Check database directly to verify entries

#### Phase 3: Backend View Limits
- [ ] Create free user account
- [ ] Add 25 history entries (via API or app)
- [ ] GET `/api/history` → Should return only 20 items, totalCount = 20
- [ ] Check database → Should have all 25 entries
- [ ] Upgrade user to premium in DB
- [ ] GET `/api/history` → Should return all 25 items, totalCount = 25

#### Phase 4: Client Deduplication
- [ ] Test as guest user: Add same song/mode twice within 10 min → Only 1 entry
- [ ] Test as authenticated user: Add same song/mode twice within 10 min → Only 1 entry (client + server check)

#### Phase 5: Guest Storage Limits
- [ ] Test as guest user: Add 21 songs → Verify only 20 stored
- [ ] Test as guest user: Add more songs over time → Always maintains 20 most recent
- [ ] Test as authenticated user: Add 21+ songs → All stored (no limit)

#### Phase 6: Free User View Limits
- [ ] Test as free user: View history screen → Only 20 items shown
- [ ] Test as premium user: View history screen → All items shown
- [ ] Test pagination for both user types

#### Phase 7: Integration
- [ ] Full flow: Guest user → Add songs → Convert to free account → History syncs
- [ ] Full flow: Free user → Add 30 songs → View history (20 shown) → Upgrade to premium → All 30 shown
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
- **View 20**: Provides value while encouraging upgrade
- **Backend enforcement**: Prevents client manipulation

### Guest User Strategy
- **Save 20**: On-device storage is limited, no backend sync
- **View 20**: Same as free users for consistency
- **Client enforcement**: No backend to enforce, must be client-side

---

## Files to Modify

### Backend
- `backend/prisma/schema.prisma` - Add `isPremium` field
- `backend/src/routes/history.ts` - Add deduplication, view limits
- `backend/prisma/migrations/` - New migration file

### Frontend
- `mobile/src/contexts/UserContext.tsx` - Add deduplication, guest limits, premium tracking
- `mobile/src/utils/api.ts` - Update response handling if needed
- `mobile/src/screens/SongHistoryScreen.tsx` - Use displayedHistory for free users
- `mobile/src/utils/storage.ts` - Add helper for guest limit enforcement

---

## Future Considerations

1. **Premium Toggle**: Add admin endpoint or user settings to toggle premium status
2. **History Export**: Allow users to export full history
3. **Analytics**: Track how many users hit the 20-item limit
4. **Upgrade Prompts**: Show upgrade prompts when free users hit limits
5. **Sync on Upgrade**: Ensure guest → free → premium transitions preserve all history
