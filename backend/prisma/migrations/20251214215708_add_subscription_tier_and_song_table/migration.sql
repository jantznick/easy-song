-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'PREMIUM', 'PREMIUM_PLUS');

-- AlterTable: Add subscriptionTier to User
ALTER TABLE "User" ADD COLUMN "subscriptionTier" "SubscriptionTier" NOT NULL DEFAULT 'FREE';

-- CreateIndex: Add index on subscriptionTier
CREATE INDEX "User_subscriptionTier_idx" ON "User"("subscriptionTier");

-- CreateTable: Song table
CREATE TABLE "Song" (
    "id" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "genre" TEXT,
    "year" INTEGER,
    "duration" INTEGER,
    "lyricsTextSpanish" TEXT NOT NULL,
    "lyricsTextEnglish" TEXT,
    "songFilePath" TEXT NOT NULL,
    "studyFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Song_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique videoId
CREATE UNIQUE INDEX "Song_videoId_key" ON "Song"("videoId");

-- CreateIndex: Indexes on Song
CREATE INDEX "Song_artist_idx" ON "Song"("artist");
CREATE INDEX "Song_title_idx" ON "Song"("title");
CREATE INDEX "Song_genre_idx" ON "Song"("genre");
CREATE INDEX "Song_videoId_idx" ON "Song"("videoId");

-- Step 1: Create temporary Song records from existing SongHistory data
-- This creates Song entries for all unique videoIds in SongHistory
INSERT INTO "Song" ("id", "videoId", "title", "artist", "songFilePath", "lyricsTextSpanish", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text as "id",
    "videoId",
    "song" as "title",
    "artist",
    'songs/' || "videoId" || '.json' as "songFilePath",
    '' as "lyricsTextSpanish", -- Will be populated later from JSON files
    CURRENT_TIMESTAMP as "createdAt",
    CURRENT_TIMESTAMP as "updatedAt"
FROM (
    SELECT DISTINCT "videoId", "song", "artist"
    FROM "SongHistory"
) AS distinct_songs
ON CONFLICT ("videoId") DO NOTHING;

-- Step 2: Add songId column to SongHistory (nullable first)
ALTER TABLE "SongHistory" ADD COLUMN "songId" TEXT;

-- Step 3: Populate songId by joining with Song table
UPDATE "SongHistory" sh
SET "songId" = s."id"
FROM "Song" s
WHERE sh."videoId" = s."videoId";

-- Step 4: Make songId NOT NULL (only if all rows have been updated)
-- If there are any NULL songIds, this will fail - which is good, it means we have orphaned data
ALTER TABLE "SongHistory" ALTER COLUMN "songId" SET NOT NULL;

-- Step 5: Add foreign key constraint
ALTER TABLE "SongHistory" ADD CONSTRAINT "SongHistory_songId_fkey" FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Remove old columns from SongHistory
ALTER TABLE "SongHistory" DROP COLUMN "song";
ALTER TABLE "SongHistory" DROP COLUMN "artist";
ALTER TABLE "SongHistory" DROP COLUMN "videoId";

-- Step 7: Drop old indexes that referenced videoId
DROP INDEX IF EXISTS "SongHistory_videoId_idx";

-- Step 8: Create new indexes
CREATE INDEX "SongHistory_songId_idx" ON "SongHistory"("songId");
CREATE INDEX "SongHistory_userId_songId_mode_playedAt_idx" ON "SongHistory"("userId", "songId", "mode", "playedAt");

-- Note: Full-text search indexes for lyrics will be created separately via raw SQL:
-- CREATE INDEX songs_lyrics_spanish_fts_idx ON "Song" USING gin(to_tsvector('spanish', "lyricsTextSpanish"));
-- CREATE INDEX songs_lyrics_english_fts_idx ON "Song" USING gin(to_tsvector('english', "lyricsTextEnglish"));
