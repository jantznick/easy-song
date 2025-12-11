// src/utils/api.ts

import type { Song, SongSummary } from "../types/song";

const API_URL = 'http://localhost:3001/api';

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
