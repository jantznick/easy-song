# History Integration - Additional Considerations & Architecture Analysis

## 1. Full Count Display for Non-Premium Users

### Current State
- Backend already returns `totalCount` in GET `/api/history` response
- Free users see 10 items but get the full count
- Premium users see all items

### Implementation Approach

**UI Enhancement:**
- Show pagination info: "Page 1 of 1 (50 total songs)"
- Add upgrade prompt: "Upgrade to Premium to view all 50 songs in your history"
- Could show a progress indicator: "Viewing 10 of 50 songs"

**Location:** `mobile/src/screens/SongHistoryScreen.tsx`

**Example UI:**
```
[Previous]  Page 1 of 3 (50 total)  [Next]
            ↑ Upgrade to see all 50 songs
```

---

## 2. Guest History Migration on Signup

### Requirements
- When guest user signs up, migrate their local history (up to 3 items) to their new account
- Show warning at 2 songs: "Join now to save your entire listening history"

### Implementation Strategy

#### Phase A: Warning System (Before Signup)
**Location:** `mobile/src/contexts/UserContext.tsx` and `mobile/src/screens/SongHistoryScreen.tsx`

**Logic:**
- Monitor `songHistory.length` for guest users
- At 2 songs: Show subtle banner/info message
- At 3 songs: Show more prominent warning (at limit)
- Message: "You have X songs in your history. Sign up to save them permanently!"

**Implementation:**
```typescript
// In UserContext.tsx
const shouldShowHistoryWarning = !isAuthenticated && songHistory.length >= 2;
const historyWarningLevel = songHistory.length >= 3 ? 'urgent' : 'info';
```

#### Phase B: Migration on Signup
**Location:** `mobile/src/contexts/UserContext.tsx` - `signIn` function

**Flow:**
1. User signs up/logs in
2. Before clearing local history, check if guest history exists (up to 3 items)
3. If exists, POST each item to `/api/history` endpoint
4. Handle deduplication (server will handle 10-min window)
5. Clear local history after successful migration
6. Fetch fresh history from server

**Implementation:**
```typescript
// In signIn function
if (!isAuthenticated && songHistory.length > 0) {
  // Migrate guest history to account (up to 3 items)
  const itemsToMigrate = songHistory.slice(0, 3);
  const migrationPromises = itemsToMigrate.map(item => 
    fetch(`${apiBase}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        song: item.song,
        artist: item.artist,
        mode: item.mode,
        videoId: item.videoId,
      }),
    })
  );
  
  await Promise.allSettled(migrationPromises); // Don't fail signup if some fail
}
```

**Edge Cases:**
- Network failure during migration → Retry mechanism or queue for later
- Duplicate entries → Server deduplication handles this
- Partial migration → Use `Promise.allSettled` to continue even if some fail

---

## 3. Song Storage Architecture Reconsideration

### Current Architecture
- **Storage:** Flat JSON files in `backend/data/songs/` and `backend/data/study/`
- **Content:** Full song data with timestamps, translations, explanations
- **Serving:** Direct file reads via Express endpoints
- **History:** Stores `videoId`, `song`, `artist`, `mode` (duplicated data)

### Proposed Changes
- Add songs to database
- Store searchable lyrics (plain text, no timestamps)
- Reference songs by ID in history
- Consider hybrid approach (metadata in DB, full content in files)

---

## Architecture Options Analysis

### Option A: Full Database Storage
**Store everything in PostgreSQL**

**Schema:**
```prisma
model Song {
  id          String   @id @default(uuid())
  videoId     String   @unique
  title       String
  artist      String
  thumbnailUrl String?
  genre       String?
  year        Int?
  duration    Int?     // in seconds
  lyricsTextSpanish String @db.Text  // Original Spanish lyrics (required)
  lyricsTextEnglish String? @db.Text // English translation (optional)
  // Additional languages can be added as needed
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Full structured data stored as JSON
  fullData    Json     // Complete song structure with timestamps
  studyData   Json?    // Study mode structured sections
  
  history     SongHistory[]
  
  @@index([artist])
  @@index([title])
  @@index([genre])
  // Full-text search indexes created via raw SQL for each language
}
```

**Pros:**
- ✅ Single source of truth
- ✅ Native full-text search (PostgreSQL)
- ✅ Easy to query and filter
- ✅ History references are clean (foreign key)
- ✅ Can add metadata easily (genre, year, etc.)
- ✅ Better for analytics/reporting

**Cons:**
- ❌ Large JSON blobs in database (can be slow)
- ❌ Harder to version control song data
- ❌ More complex backup/restore
- ❌ Database size grows significantly
- ❌ Slower reads for full song data (JSON parsing)

---

### Option B: Hybrid Approach (RECOMMENDED)
**Metadata + searchable text in DB, full content in files**

**Schema:**
```prisma
model Song {
  id          String   @id @default(uuid())
  videoId     String   @unique
  title       String
  artist      String
  thumbnailUrl String?
  genre       String?
  year        Int?
  duration    Int?
  
  // Searchable plain text lyrics (no timestamps)
  lyricsText  String   @db.Text
  
  // File paths (relative to data directory)
  songFilePath    String   // "songs/{videoId}.json"
  studyFilePath   String?  // "study/{videoId}.json"
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  history     SongHistory[]
  
  @@index([artist])
  @@index([title])
  @@index([genre])
  @@fulltext([lyricsText])
}

model SongHistory {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  songId    String   // Foreign key to Song
  song      Song     @relation(fields: [songId], references: [id])
  mode      SongMode
  playedAt  DateTime @default(now())
  createdAt DateTime @default(now())
  
  // Remove: song, artist, videoId (now in Song table)
  
  @@index([userId, playedAt])
  @@index([songId])
}
```

**Pros:**
- ✅ Best of both worlds
- ✅ Fast full-text search on lyrics
- ✅ Fast file reads for full song data (no JSON parsing overhead)
- ✅ Easy to version control song files
- ✅ Clean history references (foreign key)
- ✅ Can add metadata easily
- ✅ Smaller database size
- ✅ Can still serve files directly (CDN-friendly)
- ✅ Easy migration path (keep existing files)

**Cons:**
- ⚠️ Two sources of truth (need to keep in sync)
- ⚠️ More complex data pipeline (update both DB and files)

**Migration Strategy:**
1. Create Song table
2. Script to populate Song table from existing JSON files
3. Extract plain text lyrics (remove timestamps, join lines)
4. Update history to use `songId` instead of `videoId`
5. Keep file serving as-is (backward compatible)

---

### Option C: Minimal Database (Current + Enhancements)
**Keep files, add minimal song registry**

**Schema:**
```prisma
model Song {
  id          String   @id @default(uuid())
  videoId     String   @unique
  title       String
  artist      String
  thumbnailUrl String?
  genre       String?
  year        Int?
  
  // Searchable lyrics in multiple languages (plain text)
  lyricsTextSpanish String @db.Text  // Original Spanish lyrics (required)
  lyricsTextEnglish String? @db.Text // English translation (optional)
  
  // No full data stored, always read from files
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  history     SongHistory[]
  
  @@index([artist])
  @@index([title])
  // Full-text search indexes created via raw SQL for each language
}
```

**Pros:**
- ✅ Minimal changes to current architecture
- ✅ Fast file serving unchanged
- ✅ Search capability added
- ✅ Clean history references

**Cons:**
- ⚠️ Still need to sync DB when files change
- ⚠️ Two sources of truth

---

## Recommendation: Option B (Hybrid Approach)

### Why Hybrid?
1. **Performance:** File reads are faster than JSON parsing from DB
2. **Search:** Database full-text search is powerful and fast
3. **Scalability:** Files can be moved to CDN later
4. **Flexibility:** Can add metadata without touching files
5. **Migration:** Easiest path from current architecture

### Implementation Plan

#### Step 1: Database Schema
- Add `Song` model with metadata + `lyricsText`
- Update `SongHistory` to reference `Song` via `songId`
- Keep `videoId` in Song for backward compatibility

#### Step 2: Data Migration Script
```typescript
// scripts/migrate-songs-to-db.ts
// 1. Read all JSON files from data/songs/
// 2. Extract metadata (title, artist, etc.)
// 3. Extract plain text lyrics:
//    - lyricsTextSpanish: Join all Spanish lines, remove timestamps
//    - lyricsTextEnglish: Join all English lines, remove timestamps (if available)
// 4. Insert into Song table
// 5. Update existing SongHistory entries to use songId
```

#### Step 3: Update Data Pipeline
- When generating new songs, also insert into DB
- Extract and store `lyricsText` during generation

#### Step 4: Update API Endpoints
- Keep file serving as-is (backward compatible)
- Add search endpoint: `GET /api/songs/search?q=lyrics`
- Update history endpoints to use `songId`

#### Step 5: Update History Integration
- History now references `Song` table
- Can display song metadata without file read
- Search history by song content

---

## Search Implementation (Future)

### Full-Text Search Options

**PostgreSQL Full-Text Search:**
```sql
-- Create indexes for each language
CREATE INDEX songs_lyrics_spanish_fts_idx ON "Song" USING gin(to_tsvector('spanish', "lyricsTextSpanish"));
CREATE INDEX songs_lyrics_english_fts_idx ON "Song" USING gin(to_tsvector('english', "lyricsTextEnglish"));

-- Search query (Spanish)
SELECT * FROM "Song" 
WHERE to_tsvector('spanish', "lyricsTextSpanish") @@ to_tsquery('spanish', 'verano & nueva & york');

-- Search query (English)
SELECT * FROM "Song" 
WHERE to_tsvector('english', "lyricsTextEnglish") @@ to_tsquery('english', 'summer & new & york');

-- Combined search (search in both languages)
SELECT * FROM "Song" 
WHERE to_tsvector('spanish', "lyricsTextSpanish") @@ to_tsquery('spanish', 'verano')
   OR to_tsvector('english', "lyricsTextEnglish") @@ to_tsquery('english', 'summer');
```

**Benefits:**
- Native PostgreSQL feature
- Fast and efficient
- Supports ranking/relevance
- Language-aware (handles Spanish, English, and can add more)
- Can search in specific language or across all languages

**API Endpoint:**
```typescript
GET /api/songs/search?q=summer+new+york&lang=english&limit=20
GET /api/songs/search?q=verano+nueva+york&lang=spanish&limit=20
GET /api/songs/search?q=summer&lang=all&limit=20  // Search in all languages
```

---

## Updated History Integration Plan

### Additional Phases

#### Phase 8: Guest History Warnings
- Show warning at 10 songs (info banner)
- Show urgent warning at 15 songs
- Add "Sign up to save" CTA

#### Phase 9: Guest History Migration
- Detect guest history on signup
- Migrate all items to server
- Handle errors gracefully
- Clear local history after migration

#### Phase 10: Song Database Integration (Optional - Future)
- Add Song model to schema
- Create migration script
- Update history to use songId
- Add search endpoint

---

## Decision Points

### Immediate (History Integration)
1. ✅ **Full count display** - Implement UI showing total count for free users
2. ✅ **Guest warnings** - Add warnings at 10/15 songs
3. ✅ **Guest migration** - Migrate history on signup

### Future (Song Architecture)
1. ⏳ **Song database** - Decide on Option A, B, or C
2. ⏳ **Search feature** - Implement after song DB is ready
3. ⏳ **Metadata expansion** - Add genre, year, etc. to songs

---

## Questions to Consider

1. **Search Priority:** How important is search? If critical, Option B makes sense now. If later, can defer.
2. **File Management:** Do you want to keep files for version control/CDN? If yes, Option B.
3. **Data Size:** How many songs? If <100, Option A is fine. If >1000, Option B better.
4. **Update Frequency:** How often do songs change? If rarely, sync is manageable.
5. **CDN Plans:** Planning to serve files from CDN? If yes, Option B.

---

## My Recommendation

**For History Integration (Now):**
- Implement full count display
- Add guest warnings
- Add guest migration
- Keep current song storage (files)

**For Song Architecture (Future):**
- **Option B (Hybrid)** when you're ready for search
- Start with minimal Song table (just metadata + lyricsText)
- Keep file serving as-is
- Add search endpoint later

This gives you:
- ✅ Fast history integration now
- ✅ Clean architecture for future search
- ✅ Minimal disruption to current system
- ✅ Easy migration path
