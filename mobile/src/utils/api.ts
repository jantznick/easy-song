import type { Song, SongSummary, StudyData, LyricLine, SongsResponse } from '../types/song';

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

// Helper to get API URL without /api suffix for auth endpoints
const getAuthUrl = () => {
  const base = getApiUrl();
  // Remove /api if present, then add /api/auth
  return base.replace(/\/api$/, '') + '/api/auth';
};

/**
 * Fetches a list of all available songs.
 * @param options Optional parameters for filtering songs
 * @param options.language Optional language filter (e.g., "Spanish") - TODO: Implement when backend supports it
 * @param options.format Optional format: 'flat' for array, 'sections' for organized sections
 * @returns A promise that resolves to either an array of SongSummary objects or a SongsResponse with sections.
 */
export const fetchSongs = async (options?: { 
    language?: string;
    format?: 'flat' | 'sections';
}): Promise<SongSummary[] | SongsResponse> => {
    if (API_MODE === 'static') {
        const response = await fetch(`${BASE_URL}/songs-list.json`);
        if (!response.ok) {
            throw new Error(`Network response was not ok (${response.status})`);
        }
        // Static mode always returns flat array
        return response.json();
    }
    
    // Build URL with query parameters
    const params = new URLSearchParams();
    if (options?.format === 'sections') {
        params.append('format', 'sections');
    }
    // TODO: When backend supports language filtering, add query parameter:
    // if (options?.language) {
    //     params.append('language', options.language);
    // }
    
    const url = params.toString() 
        ? `${BASE_URL}/songs?${params.toString()}`
        : `${BASE_URL}/songs`;
    
    const response = await fetch(url);
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
 * Updates user profile on backend
 * @param updates Partial profile updates (name, email, avatar)
 * @returns Promise that resolves to updated user object
 */
export async function updateUserProfile(updates: { 
  name?: string; 
  email?: string; 
  avatar?: string | null;
}): Promise<{
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
  emailVerified: boolean;
  updatedAt: string;
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const response = await fetch(`${baseUrl}/api/user/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }

  return data;
}

/**
 * Signs in a user (dummy API call - always returns success for now)
 * @param email User email
 * @param password User password
 * @returns Promise that resolves to auth token, user profile, song history, and total count
 */
export async function signInUser(email: string, password: string): Promise<{ 
  token: string; 
  user: { name: string; email: string; avatar?: string };
  songHistory: Array<{ song: string; artist: string; mode: 'Play Mode' | 'Study Mode'; date: string; time: string; videoId: string }>;
  totalHistoryCount: number;
}> {
  // TODO: Replace with actual API call when backend is ready
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Basic validation
  if (!email || !password) {
    throw new Error('Email and password are required');
  }
  
  // Simulate validation - accept any email/password for now
  // In real implementation, this would call: POST /api/auth/login
  // const response = await fetch(`${BASE_URL}/auth/login`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ email, password }),
  // });
  // if (!response.ok) throw new Error('Invalid credentials');
  // const data = await response.json();
  // return { token: data.token, user: data.user, songHistory: data.songHistory, totalHistoryCount: data.totalHistoryCount };
  
  // Return dummy data with most recent 20 songs
  // In real implementation, this would come from the backend
  const TOTAL_HISTORY_COUNT = 103; // Total songs in user's history
  const dummyHistory = generateDummyHistory(20);
  
  return {
    token: `dummy_token_${Date.now()}`,
    user: {
      name: email.split('@')[0] || 'User', // Use email prefix as name
      email: email,
      avatar: undefined,
    },
    songHistory: dummyHistory,
    totalHistoryCount: TOTAL_HISTORY_COUNT,
  };
}

/**
 * Fetches more song history (for pagination)
 * @param page Page number (1-indexed)
 * @param pageSize Number of items per page
 * @returns Promise that resolves to object with items and total count
 */
export async function fetchSongHistory(page: number = 1, pageSize: number = 20): Promise<{
  items: Array<{ 
    id: string;
    song: string; 
    artist: string; 
    mode: 'Play Mode' | 'Study Mode'; 
    date: string; 
    time: string; 
    videoId: string;
  }>;
  totalCount: number;
}> {
  const url = `${BASE_URL.replace('/api', '')}/api/history?page=${page}&pageSize=${pageSize}`;
  const response = await fetch(url, {
    method: 'GET',
    credentials: 'include', // Include cookies for session
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  const data = await response.json();
  
  // Transform backend format to frontend format
  const items = data.items.map((item: any) => ({
    id: item.id,
    song: item.song,
    artist: item.artist,
    mode: item.mode === 'PLAY_MODE' ? 'Play Mode' : 'Study Mode',
    date: item.date,
    time: item.time,
    videoId: item.videoId,
  })).filter((item: any) => item.song && item.artist); // Filter out any invalid items

  return {
    items,
    totalCount: data.totalCount,
  };
}

/**
 * Helper function to generate dummy song history
 */
function generateDummyHistory(count: number): Array<{ 
  song: string; 
  artist: string; 
  mode: 'Play Mode' | 'Study Mode'; 
  date: string; 
  time: string; 
  videoId: string;
}> {
  const songs = [
    { song: 'Despacito', artist: 'Luis Fonsi' },
    { song: 'Bailando', artist: 'Enrique Iglesias' },
    { song: 'La Bicicleta', artist: 'Carlos Vives & Shakira' },
    { song: 'Mi Gente', artist: 'J Balvin' },
    { song: 'Sofia', artist: 'Alvaro Soler' },
  ];
  const modes: ('Play Mode' | 'Study Mode')[] = ['Play Mode', 'Study Mode'];
  const videoId = 'KU5V5WZVcVE';
  
  const history = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    const songData = songs[i % songs.length];
    const mode = modes[i % modes.length];
    
    history.push({
      song: songData.song,
      artist: songData.artist,
      mode,
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      videoId,
    });
  }
  
  return history;
}

/**
 * Register a new user
 */
export async function registerUser(email: string, password: string, name: string): Promise<{
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    emailVerified: boolean;
    subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  };
}> {
  const response = await fetch(`${getAuthUrl()}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify({ email, password, name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

/**
 * Login with email and password
 */
export async function loginUser(email: string, password: string): Promise<{
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
    avatar?: string;
    emailVerified: boolean;
  };
}> {
  const response = await fetch(`${getAuthUrl()}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Include cookies for session
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  return data;
}

/**
 * Request a magic login code
 */
export async function requestMagicCode(email: string, isSignup: boolean = false): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await fetch(`${getAuthUrl()}/request-login-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, isSignup }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to send magic code');
  }

  return data;
}

/**
 * Verify magic login code
 */
export async function verifyMagicCode(email: string, code: string, isSignup: boolean = false): Promise<{
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    emailVerified: boolean;
    subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  };
}> {
  const response = await fetch(`${getAuthUrl()}/verify-login-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, code, isSignup }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Invalid or expired code');
  }

  return data;
}

/**
 * Get current user (check if authenticated)
 */
export async function getCurrentUser(): Promise<{
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  hasPassword: boolean;
} | null> {
  try {
    const response = await fetch(`${getAuthUrl()}/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.status === 401 || response.status === 403) {
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logoutUser(): Promise<void> {
  try {
    await fetch(`${getAuthUrl()}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

/**
 * Get user preferences from backend
 */
export async function fetchPreferences(): Promise<{
  playback: {
    autoplay: boolean;
    autoscroll: boolean;
    loop: boolean;
  };
  display: {
    fontSize: 'small' | 'medium' | 'large';
    defaultTranslation: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  language: {
    learning: string;
    interface: string;
  };
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const response = await fetch(`${baseUrl}/api/user/preferences`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch preferences');
  }

  return response.json();
}

/**
 * Update user preferences on backend
 */
export async function updatePreferences(updates: {
  playback?: {
    autoplay?: boolean;
    autoscroll?: boolean;
    loop?: boolean;
  };
  display?: {
    fontSize?: 'small' | 'medium' | 'large';
    defaultTranslation?: boolean;
    theme?: 'light' | 'dark' | 'system';
  };
  language?: {
    learning?: string;
    interface?: string;
  };
}): Promise<{
  playback: {
    autoplay: boolean;
    autoscroll: boolean;
    loop: boolean;
  };
  display: {
    fontSize: 'small' | 'medium' | 'large';
    defaultTranslation: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  language: {
    learning: string;
    interface: string;
  };
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const response = await fetch(`${baseUrl}/api/user/preferences`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(updates),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to update preferences');
  }

  return data;
}

/**
 * Change user password (or set password if none exists)
 * @param newPassword New password to set
 * @param currentPassword Current password (required only if user has existing password)
 * @returns Promise that resolves to success response
 */
export async function changePassword(
  newPassword: string,
  currentPassword?: string
): Promise<{
  success: boolean;
  message: string;
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const body: { newPassword: string; currentPassword?: string } = { newPassword };
  if (currentPassword) {
    body.currentPassword = currentPassword;
  }

  const response = await fetch(`${baseUrl}/api/user/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.error || 'Failed to change password');
    // Attach validation errors if they exist
    if (data.errors && Array.isArray(data.errors)) {
      (error as any).errors = data.errors;
    }
    throw error;
  }

  return data;
}

/**
 * Verify email with a 6-digit code
 */
export async function verifyEmail(code: string): Promise<{
  success: boolean;
  message: string;
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const response = await fetch(`${baseUrl}/api/auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ code }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify email');
  }

  return data;
}

/**
 * Resend email verification code
 */
export async function resendVerificationCode(): Promise<{
  success: boolean;
  message: string;
}> {
  const baseUrl = getApiUrl().replace('/api', '');
  const response = await fetch(`${baseUrl}/api/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to resend verification code');
  }

  return data;
}

