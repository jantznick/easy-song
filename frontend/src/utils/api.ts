// src/utils/api.ts

import type { Song, SongSummary, StudyData } from "../types/song";

// Configuration: Set to 'api' for Express backend, or 'static' for S3/static file hosting
const API_MODE: 'api' | 'static' = (import.meta.env.VITE_API_MODE as 'api' | 'static') || 'api';

// For static mode, set your S3/block storage domain here
// Example: 'https://your-bucket.s3.amazonaws.com' or 'https://cdn.yourdomain.com'
const STATIC_BASE_URL = import.meta.env.VITE_STATIC_BASE_URL || '';

// Use the current hostname so it works on local network
// In development, this will be localhost or your local IP
// In production, this will be your domain
const getApiUrl = () => {
  if (API_MODE === 'static') {
    if (!STATIC_BASE_URL) {
      throw new Error('VITE_STATIC_BASE_URL must be set when using static mode');
    }
    return STATIC_BASE_URL;
  }
  
  const hostname = window.location.hostname;
  // If accessing via localhost, use localhost for API
  // Otherwise use the same hostname (for network access)
  return `http://${hostname}:3001/api`;
};

const BASE_URL = getApiUrl();

/**
 * Fetches a list of all available songs.
 * @returns A promise that resolves to an array of SongSummary objects.
 */
export const fetchSongs = async (): Promise<SongSummary[]> => {
    if (API_MODE === 'static') {
        // In static mode, fetch from songs-list.json
        const response = await fetch(`${BASE_URL}/songs-list.json`);
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
    }
    
    // API mode: use the dynamic endpoint
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
        return null; // Study data doesn't exist, return null
    }
    if (!response.ok) {
        throw new Error(`Failed to fetch study data (${response.status})`);
    }
    return response.json();
};
