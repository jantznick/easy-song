import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_PREFERENCES: '@easysong:user_preferences',
  USER_PROFILE: '@easysong:user_profile',
  SONG_HISTORY: '@easysong:song_history',
  ONBOARDING_COMPLETE: '@easysong:onboarding_complete',
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

export const DEFAULT_USER_PROFILE: StoredUserProfile = {
  name: 'Guest User',
  email: 'guest@easysong.com',
};

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
export async function loadUserProfile(): Promise<StoredUserProfile> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (data) {
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all fields exist
      return { ...DEFAULT_USER_PROFILE, ...parsed };
    }
    return DEFAULT_USER_PROFILE;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return DEFAULT_USER_PROFILE;
  }
}

export async function saveUserProfile(profile: StoredUserProfile): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
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

// Onboarding Storage
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return value === 'true';
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
}

export async function saveOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
  } catch (error) {
    console.error('Error saving onboarding status:', error);
  }
}

export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
  } catch (error) {
    console.error('Error resetting onboarding status:', error);
  }
}

// Clear all storage (for sign out)
export async function clearAllStorage(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.USER_PROFILE,
      STORAGE_KEYS.SONG_HISTORY,
      // Note: We don't clear ONBOARDING_COMPLETE on sign out
      // Note: Session cookies are cleared automatically by React Native when backend sends Set-Cookie with Max-Age=0
    ]);
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
}

