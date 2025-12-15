-- Create full-text search indexes for lyrics
-- These indexes enable fast text search in Spanish and English lyrics

-- Spanish lyrics full-text search index
CREATE INDEX IF NOT EXISTS songs_lyrics_spanish_fts_idx 
ON "Song" 
USING gin(to_tsvector('spanish', "lyricsTextSpanish"));

-- English lyrics full-text search index
-- Only create if there are songs with English lyrics
CREATE INDEX IF NOT EXISTS songs_lyrics_english_fts_idx 
ON "Song" 
USING gin(to_tsvector('english', "lyricsTextEnglish"))
WHERE "lyricsTextEnglish" IS NOT NULL;
