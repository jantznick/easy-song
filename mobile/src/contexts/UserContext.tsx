import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { SongHistoryItem } from '../data/songHistory';
import {
  loadPreferences,
  savePreferences,
  loadUserProfile,
  saveUserProfile,
  loadSongHistory,
  saveSongHistory,
  loadAuthToken,
  saveAuthToken,
  clearAllStorage,
  type StoredPreferences,
  type StoredUserProfile,
  DEFAULT_PREFERENCES,
} from '../utils/storage';

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface UserPreferences extends StoredPreferences {}

export interface UserContextType {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // User Profile
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };

  // Preferences
  preferences: UserPreferences;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  updatePlaybackPreference: <K extends keyof UserPreferences['playback']>(
    key: K,
    value: UserPreferences['playback'][K]
  ) => Promise<void>;
  updateDisplayPreference: <K extends keyof UserPreferences['display']>(
    key: K,
    value: UserPreferences['display'][K]
  ) => Promise<void>;
  updateLanguagePreference: <K extends keyof UserPreferences['language']>(
    key: K,
    value: UserPreferences['language'][K]
  ) => Promise<void>;

  // Song History
  songHistory: SongHistoryItem[];
  addToHistory: (song: string, artist: string, mode: 'Play Mode' | 'Study Mode', videoId: string) => Promise<void>;
  clearHistory: () => Promise<void>;

  // Auth methods (placeholders for now)
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [songHistory, setSongHistory] = useState<SongHistoryItem[]>([]);

  // Load initial data from storage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [storedPreferences, storedProfile, storedHistory, authToken] = await Promise.all([
          loadPreferences(),
          loadUserProfile(),
          loadSongHistory(),
          loadAuthToken(),
        ]);

        setPreferences(storedPreferences);
        setSongHistory(storedHistory);

        if (authToken && storedProfile) {
          setUser(storedProfile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  }, [preferences]);

  // Update playback preference
  const updatePlaybackPreference = useCallback(async <K extends keyof UserPreferences['playback']>(
    key: K,
    value: UserPreferences['playback'][K]
  ) => {
    const newPreferences = {
      ...preferences,
      playback: {
        ...preferences.playback,
        [key]: value,
      },
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  }, [preferences]);

  // Update display preference
  const updateDisplayPreference = useCallback(async <K extends keyof UserPreferences['display']>(
    key: K,
    value: UserPreferences['display'][K]
  ) => {
    const newPreferences = {
      ...preferences,
      display: {
        ...preferences.display,
        [key]: value,
      },
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  }, [preferences]);

  // Update language preference
  const updateLanguagePreference = useCallback(async <K extends keyof UserPreferences['language']>(
    key: K,
    value: UserPreferences['language'][K]
  ) => {
    const newPreferences = {
      ...preferences,
      language: {
        ...preferences.language,
        [key]: value,
      },
    };
    setPreferences(newPreferences);
    await savePreferences(newPreferences);
  }, [preferences]);

  // Add to song history
  const addToHistory = useCallback(async (
    song: string,
    artist: string,
    mode: 'Play Mode' | 'Study Mode',
    videoId: string
  ) => {
    const newEntry: SongHistoryItem = {
      song,
      artist,
      mode,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      videoId,
    };

    // Add to beginning of history (most recent first)
    const newHistory = [newEntry, ...songHistory];
    setSongHistory(newHistory);
    await saveSongHistory(newHistory);
  }, [songHistory]);

  // Clear history
  const clearHistory = useCallback(async () => {
    setSongHistory([]);
    await saveSongHistory([]);
  }, []);

  // Sign in (placeholder - will implement with API later)
  const signIn = useCallback(async (email: string, password: string) => {
    // TODO: Implement API call
    console.log('Sign in:', email, password);
    throw new Error('Sign in not yet implemented');
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    setUser(null);
    setIsAuthenticated(false);
    await clearAllStorage();
    // Reset to defaults
    setPreferences(DEFAULT_PREFERENCES);
    setSongHistory([]);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setIsAuthenticated(true);
    await saveUserProfile(updatedUser);
  }, [user]);

  const profile = user || {
    name: 'Guest User',
    email: '',
    avatar: undefined,
  };

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
    profile,
    preferences,
    updatePreferences,
    updatePlaybackPreference,
    updateDisplayPreference,
    updateLanguagePreference,
    songHistory,
    addToHistory,
    clearHistory,
    signIn,
    signOut,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

