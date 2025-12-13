import type { Song, SongSummary, StudyData, LyricLine } from '../types/song';

// Configuration: Set to 'api' for Express backend, or 'static' for S3/static file hosting
// For mobile, we'll default to API mode but can be configured via environment variables
const API_MODE: 'api' | 'static' = (process.env.EXPO_PUBLIC_API_MODE as 'api' | 'static') || 'api';

// For static mode, set your S3/block storage domain here
const STATIC_BASE_URL = process.env.EXPO_PUBLIC_STATIC_BASE_URL || '';

// Get API URL - for mobile, we'll use localhost for development or the configured URL
const getApiUrl = () => {
  if (API_MODE === 'static') {
    if (!STATIC_BASE_URL) {
      throw new Error('EXPO_PUBLIC_STATIC_BASE_URL must be set when using static mode');
    }
    return STATIC_BASE_URL;
  }
  
  // For mobile development, use localhost or the configured API URL
  // In production, you'd set this via environment variable
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
};

const BASE_URL = getApiUrl();

/**
 * Fetches a list of all available songs.
 * @param options Optional parameters for filtering songs
 * @param options.language Optional language filter (e.g., "Spanish") - TODO: Implement when backend supports it
 * @returns A promise that resolves to an array of SongSummary objects.
 */
export const fetchSongs = async (options?: { language?: string }): Promise<SongSummary[]> => {
    if (API_MODE === 'static') {
        const response = await fetch(`${BASE_URL}/songs-list.json`);
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    }
    
    // TODO: When backend supports language filtering, add query parameter:
    // const url = options?.language ? `${BASE_URL}/songs?language=${options.language}` : `${BASE_URL}/songs`;
    const response = await fetch(`${BASE_URL}/songs`);
    if (!response.ok) {
        throw new Error(`Network response was not ok (${response.status})`);
    }
    return response.json();
};

/**
 * Fetches the full data for a single song by its videoId.
 * @param videoId The ID of the song to fetch.
 * @returns A promise that resolves to a full Song object.
 */
export const fetchSongById = async (videoId: string): Promise<Song> => {
    const url = API_MODE === 'static' 
        ? `${BASE_URL}/songs/${videoId}.json`
        : `${BASE_URL}/songs/${videoId}`;
    
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Song not found or network error (${response.status})`);
    }
    return response.json();
};

/**
 * Fetches the study data for a single song by its videoId.
 * @param videoId The ID of the song to fetch study data for.
 * @returns A promise that resolves to a StudyData object, or null if study data doesn't exist.
 */
export const fetchStudyData = async (videoId: string): Promise<StudyData | null> => {
    const url = API_MODE === 'static'
        ? `${BASE_URL}/study/${videoId}.json`
        : `${BASE_URL}/songs/${videoId}/study`;
    
    const response = await fetch(url);
    if (response.status === 404) {
        return null;
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch study data (${response.status})`);
    }
    return response.json();
};

/**
 * Computes additional content (lines not covered by structured sections).
 * @param song The song data.
 * @param studyData The study data with structured sections.
 * @returns An array of lyric lines that are not covered by structured sections.
 */
export function computeAdditionalContent(song: Song | null, studyData: StudyData | null): LyricLine[] {
  if (!song || !studyData) return [];
  
  const allOriginalLines = song.sections.flatMap(section => section.lines);
  
  const coveredTimeRanges: Array<{ start: number; end: number }> = [];
  studyData.structuredSections.forEach(section => {
    section.lines.forEach(line => {
      coveredTimeRanges.push({ start: line.start_ms, end: line.end_ms });
    });
  });
  
  return allOriginalLines.filter(line => {
    return !coveredTimeRanges.some(range => {
      return (line.start_ms >= range.start && line.start_ms <= range.end) ||
             (line.end_ms >= range.start && line.end_ms <= range.end) ||
             (line.start_ms <= range.start && line.end_ms >= range.end);
    });
  });
}

/**
 * Updates user profile (dummy API call - always returns success for now)
 * @param updates Partial profile updates (name, email, etc.)
 * @returns Promise that resolves to success response
 */
export async function updateUserProfile(updates: { name?: string; email?: string }): Promise<{ success: boolean }> {
  // TODO: Replace with actual API call when backend is ready
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Always return success for now
  return { success: true };
}

