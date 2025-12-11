export interface LyricLine {
    spanish: string;
    english: string | null;
    explanation: string | null;
    start_ms: number;
    end_ms: number;
}

export interface SongSection {
    title: string;
    lines: LyricLine[];
}

export interface Song {
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
    sections: SongSection[];
}

export interface SongSummary {
    videoId: string;
    title: string;
    artist: string;
    thumbnailUrl: string;
}

// Study Mode Types
export interface StructuredLine {
    spanish: string;
    english: string;
    explanation: string | null;
    start_ms: number;
    end_ms: number;
}

export interface StructuredSection {
    title: string;
    sectionExplanation?: string;
    lines: StructuredLine[];
}

export interface StudyData {
    videoId: string;
    title: string;
    artist: string;
    structuredSections: StructuredSection[];
}