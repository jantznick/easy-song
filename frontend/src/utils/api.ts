// src/utils/api.ts

import type { Song, SongSummary, StudyData } from "../types/song";

// Use the current hostname so it works on local network
// In development, this will be localhost or your local IP
// In production, this will be your domain
const getApiUrl = () => {
  const hostname = window.location.hostname;
  // If accessing via localhost, use localhost for API
  // Otherwise use the same hostname (for network access)
  return `http://${hostname}:3001/api`;
};

const API_URL = getApiUrl();

/**
 * Fetches a list of all available songs.
 * @returns A promise that resolves to an array of SongSummary objects.
 */
export const fetchSongs = async (): Promise<SongSummary[]> => {
    const response = await fetch(`${API_URL}/songs`);
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
    const response = await fetch(`${API_URL}/songs/${videoId}`);
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
    const response = await fetch(`${API_URL}/songs/${videoId}/study`);
    if (response.status === 404) {
        return null; // Study data doesn't exist, return null
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch study data (${response.status})`);
    }
    return response.json();
};
