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
  DEFAULT_USER_PROFILE,
} from '../utils/storage';
import { changeLanguage } from '../i18n/config';
import { updateUserProfile as updateUserProfileAPI, signInUser as signInUserAPI, fetchSongHistory as fetchSongHistoryAPI } from '../utils/api';

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

  // User Profile (always available, even for guests)
  profile: StoredUserProfile;

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
  totalHistoryCount: number | null; // null means we don't know the total yet (for guest users)
  isLoadingMoreHistory: boolean;
  addToHistory: (song: string, artist: string, mode: 'Play Mode' | 'Study Mode', videoId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  fetchMoreHistory: () => Promise<void>;

  // Auth methods (placeholders for now)
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<StoredUserProfile>) => Promise<void>;
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
  const [totalHistoryCount, setTotalHistoryCount] = useState<number | null>(null);
  const [profile, setProfile] = useState<StoredUserProfile>(DEFAULT_USER_PROFILE);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

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
        setProfile(storedProfile);

        // Initialize i18n language based on stored preference
        if (storedPreferences.language.interface) {
          changeLanguage(storedPreferences.language.interface);
        }

        if (authToken && storedProfile) {
          setUser(storedProfile);
          setIsAuthenticated(true);
          // For authenticated users, fetch from server to get total count
          // This will replace local history with server data
          try {
            const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
            setSongHistory(items);
            setTotalHistoryCount(totalCount);
            setHistoryPage(1);
            await saveSongHistory(items);
          } catch (error) {
            console.error('Error fetching history from server:', error);
            // Fallback to local history if server fetch fails
            setSongHistory(storedHistory);
          }
        } else {
          // For guest users, use local history
          setSongHistory(storedHistory);
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
    
    // If interface language changed, update i18n
    if (key === 'interface') {
      changeLanguage(value as string);
    }
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
    setTotalHistoryCount(null);
    setHistoryPage(1);
    setHasMoreHistory(false);
  }, []);

  // Fetch more history (for pagination)
  const fetchMoreHistory = useCallback(async () => {
    if (isLoadingMoreHistory || !isAuthenticated) return;
    
    // Don't fetch if we already have all items
    if (totalHistoryCount !== null && songHistory.length >= totalHistoryCount) {
      return;
    }
    
    setIsLoadingMoreHistory(true);
    try {
      const nextPage = historyPage + 1;
      const { items, totalCount } = await fetchSongHistoryAPI(nextPage, 20);
      
      // Update total count if we got it from the API
      if (totalCount !== null && totalCount !== undefined) {
        setTotalHistoryCount(totalCount);
      }
      
      if (items.length > 0) {
        setSongHistory(prev => {
          // Filter out duplicates (same videoId and mode) before appending
          const existingIds = new Set(
            prev.map(entry => `${entry.videoId}-${entry.mode}`)
          );
          const newItems = items.filter(
            item => !existingIds.has(`${item.videoId}-${item.mode}`)
          );
          
          const updated = [...prev, ...newItems];
          saveSongHistory(updated).catch(err => {
            console.error('Failed to save song history:', err);
          });
          
          return updated;
        });
        setHistoryPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to fetch more history:', error);
    } finally {
      setIsLoadingMoreHistory(false);
    }
  }, [isLoadingMoreHistory, isAuthenticated, historyPage, totalHistoryCount, songHistory.length]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    // Call dummy API
    const { token, user, songHistory: history, totalHistoryCount } = await signInUserAPI(email, password);
    
    // Store auth token
    await saveAuthToken(token);
    
    // Update user state
    setUser(user);
    setIsAuthenticated(true);
    
    // Update profile with user data
    const userProfile: StoredUserProfile = {
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    };
    setProfile(userProfile);
    await saveUserProfile(userProfile);
    
    // Load song history from API (most recent 20)
    setSongHistory(history);
    await saveSongHistory(history);
    setTotalHistoryCount(totalHistoryCount);
    setHistoryPage(1);
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Clear auth token
    await saveAuthToken(null);
    
    // Clear user state
    setUser(null);
    setIsAuthenticated(false);
    
    // Reset to default preferences
    setPreferences(DEFAULT_PREFERENCES);
    await savePreferences(DEFAULT_PREFERENCES);
    
    // Reset profile to default
    setProfile(DEFAULT_USER_PROFILE);
    await saveUserProfile(DEFAULT_USER_PROFILE);
    
    // Clear song history
    setSongHistory([]);
    await saveSongHistory([]);
    setTotalHistoryCount(null);
    setHistoryPage(1);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<StoredUserProfile>) => {
    // Call dummy API (always succeeds for now)
    await updateUserProfileAPI(updates);
    
    // Update local state
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    await saveUserProfile(updatedProfile);
    
    // If user is authenticated, also update user object
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
    }
  }, [profile, user]);

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
    totalHistoryCount,
    isLoadingMoreHistory,
    addToHistory,
    clearHistory,
    fetchMoreHistory,
    signIn,
    signOut,
    updateProfile,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

