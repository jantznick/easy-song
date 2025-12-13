import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@easysong:user_preferences',
  USER_PROFILE: '@easysong:user_profile',
  SONG_HISTORY: '@easysong:song_history',
  AUTH_TOKEN: '@easysong:auth_token',
} as const;

export interface StoredPreferences {
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
    learning: string; // Language being learned (e.g., "Spanish")
    // TODO: Future use - Filter songs by learning language in SongListScreen
    // TODO: Future use - Filter song list API calls by learning language
    interface: string; // App UI language (e.g., "English")
  };
}

export interface StoredUserProfile {
  name: string;
  email: string;
  avatar?: string;
}

export const DEFAULT_PREFERENCES: StoredPreferences = {
  playback: {
    autoplay: false,
    autoscroll: true,
    loop: false,
  },
  display: {
    fontSize: 'medium',
    defaultTranslation: false,
    theme: 'dark',
  },
  language: {
    learning: 'Spanish',
    interface: 'English',
  },
};

// Preferences Storage
export async function loadPreferences(): Promise<StoredPreferences> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Error loading preferences:', error);
    return DEFAULT_PREFERENCES;
  }
}

export async function savePreferences(preferences: StoredPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
}

// User Profile Storage
export async function loadUserProfile(): Promise<StoredUserProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}

export async function saveUserProfile(profile: StoredUserProfile | null): Promise<void> {
  try {
    if (profile) {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    }
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

// Song History Storage
export async function loadSongHistory(): Promise<any[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SONG_HISTORY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading song history:', error);
    return [];
  }
}

export async function saveSongHistory(history: any[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SONG_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving song history:', error);
  }
}

// Auth Token Storage
export async function loadAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Error loading auth token:', error);
    return null;
  }
}

export async function saveAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } else {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    }
  } catch (error) {
    console.error('Error saving auth token:', error);
  }
}

// Clear all storage (for sign out)
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SONG_HISTORY,
      STORAGE_KEYS.AUTH_TOKEN,
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

