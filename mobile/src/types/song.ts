// Multilingual text support
export interface MultilingualText {
    en?: string;
    es?: string;
    fr?: string;
    de?: string;
    zh?: string;
    it?: string;
}

// Song content types (new format)
export interface Lyric {
    text: string;
    start_ms: number;
    end_ms: number;
    translations: MultilingualText;
    explanations: MultilingualText;
}

export interface StructuredSection {
    title: MultilingualText;
    sectionExplanation?: MultilingualText;
    start_ms: number;
    end_ms: number;
}

export interface Song {
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
    originalLanguage: string;
    transcribedAt: string;
    lyrics: Lyric[];
    structuredSections: StructuredSection[];
}

// Helper type for lines extracted from structured sections (for Study Mode)
export interface StructuredLine {
    spanish: string;
    english: string;
    explanation: string | null;
    start_ms: number;
    end_ms: number;
}

// Song list types (from backend database)
export interface SongSummary {
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
    genre?: string | null;
}

export interface SongListSection {
    id: string;
    title: string;
    songs: SongSummary[];
}

export interface SongsResponse {
    sections: SongListSection[];
}

