import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import type { SongHistoryItem } from '../data/songHistory';
import {
  loadPreferences,
  savePreferences,
  loadSongHistory,
  saveSongHistory,
  loadAuthToken,
  saveAuthToken,
  clearAllStorage,
  type StoredPreferences,
  DEFAULT_PREFERENCES,
} from '../utils/storage';
import { changeLanguage } from '../i18n/config';
import { updateUserProfile as updateUserProfileAPI, fetchSongHistory as fetchSongHistoryAPI, loginUser, getCurrentUser, logoutUser as logoutUserAPI } from '../utils/api';

// Get API base URL
const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

// Guest user fallback (always available for non-authenticated users)
const GUEST_USER: User = {
  name: 'Guest User',
  email: 'guest@easysong.com',
  avatar: undefined,
};

export interface UserPreferences extends StoredPreferences {}

export interface UserContextType {
  // Authentication & User (always available, defaults to guest)
  user: User;
  isAuthenticated: boolean;
  isLoading: boolean;

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

  // Auth methods
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

// Deduplication window constant (10 minutes in milliseconds)
const DEDUPLICATION_WINDOW_MS = 10 * 60 * 1000;

/**
 * Helper function to check if a recent history entry exists
 * Parses date/time strings and checks if entry is within the deduplication window
 */
function hasRecentHistoryEntry(
  history: SongHistoryItem[],
  videoId: string,
  mode: 'Play Mode' | 'Study Mode',
  minutesThreshold: number = 10
): boolean {
  const thresholdMs = minutesThreshold * 60 * 1000;
  const now = Date.now();

  for (const entry of history) {
    // Check if same videoId and mode
    if (entry.videoId === videoId && entry.mode === mode) {
      try {
        // Parse date and time strings
        // Date format: "Jan 15, 2025", Time format: "2:34 PM"
        const dateStr = entry.date; // e.g., "Jan 15, 2025"
        const timeStr = entry.time; // e.g., "2:34 PM"
        
        // Combine date and time, then parse
        // Format: "Jan 15, 2025 2:34 PM"
        const combinedDateTime = `${dateStr} ${timeStr}`;
        const entryDate = new Date(combinedDateTime);
        
        // Check if the date is valid
        if (isNaN(entryDate.getTime())) {
          // If parsing fails, skip this entry
          continue;
        }
        
        const entryTimestamp = entryDate.getTime();
        const timeDiff = now - entryTimestamp;
        
        // If entry is within the threshold window (0 to thresholdMs), it's a duplicate
        // timeDiff >= 0 ensures the entry is in the past (not future)
        if (timeDiff >= 0 && timeDiff <= thresholdMs) {
          return true;
        }
      } catch (error) {
        // If parsing fails, skip this entry and continue
        console.warn('Failed to parse history entry date/time:', entry, error);
        continue;
      }
    }
  }
  
  return false;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User>(GUEST_USER);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [songHistory, setSongHistory] = useState<SongHistoryItem[]>([]);
  const [totalHistoryCount, setTotalHistoryCount] = useState<number | null>(null);
  const [isLoadingMoreHistory, setIsLoadingMoreHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);

  // Load initial data from storage
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [storedPreferences, storedHistory, authToken] = await Promise.all([
          loadPreferences(),
          loadSongHistory(),
          loadAuthToken(),
        ]);

        setPreferences(storedPreferences);

        // Initialize i18n language based on stored preference
        if (storedPreferences.language.interface) {
          changeLanguage(storedPreferences.language.interface);
        }

        // Check if user is authenticated via session
        if (authToken) {
          try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
              const userData: User = {
                name: currentUser.name,
                email: currentUser.email,
                avatar: currentUser.avatar,
              };
              setUser(userData);
              setIsAuthenticated(true);
              
              // Fetch history from server
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
              // Token exists but session invalid, clear it
              await saveAuthToken(null);
              // Reset to guest user
              setUser(GUEST_USER);
              setIsAuthenticated(false);
              setSongHistory(storedHistory);
            }
          } catch (error) {
            console.error('Error checking authentication:', error);
            // Reset to guest user on error
            setUser(GUEST_USER);
            setIsAuthenticated(false);
            setSongHistory(storedHistory);
          }
        } else {
          // For guest users, use default guest user
          setUser(GUEST_USER);
          
          // For guest users, use local history (limit to 3 most recent items)
          // Trim to 3 items if there are more (in case old dummy data exists)
          const guestHistory = storedHistory.length > 3 ? storedHistory.slice(0, 3) : storedHistory;
          setSongHistory(guestHistory);
          // Save trimmed history back to storage if it was trimmed
          if (storedHistory.length > 3) {
            await saveSongHistory(guestHistory);
          }
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
    // Client-side deduplication check: Check if recent entry exists
    const hasRecent = hasRecentHistoryEntry(songHistory, videoId, mode, 10);
    if (hasRecent) {
      // Recent entry found within 10 minutes, skip adding (no duplicate)
      console.log(`Skipping duplicate history entry: ${song} (${mode}) - recent entry found`);
      return;
    }

    const newEntry: SongHistoryItem = {
      song,
      artist,
      mode,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      videoId,
    };

    // If authenticated, add to backend
    if (isAuthenticated) {
      try {
        const apiBase = getApiBaseUrl().replace('/api', '');
        const response = await fetch(`${apiBase}/api/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            song,
            artist,
            mode,
            videoId,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update local history with the new entry from server
          const serverEntry: SongHistoryItem = {
            id: data.id,
            song: data.song,
            artist: data.artist,
            mode: data.mode === 'PLAY_MODE' ? 'Play Mode' : 'Study Mode',
            date: data.date,
            time: data.time,
            videoId: data.videoId,
          };
          const newHistory = [serverEntry, ...songHistory];
          setSongHistory(newHistory);
          await saveSongHistory(newHistory);
          return;
        }
      } catch (error) {
        console.error('Failed to add to history on server:', error);
        // Fall through to local storage
      }
    }

    // Add to beginning of history (most recent first) - for guest users or if API fails
    let newHistory = [newEntry, ...songHistory];
    
    // For guest users, enforce 3-item limit (keep only most recent 3)
    if (!isAuthenticated && newHistory.length > 3) {
      newHistory = newHistory.slice(0, 3);
    }
    
    setSongHistory(newHistory);
    await saveSongHistory(newHistory);
  }, [songHistory, isAuthenticated]);

  // Clear history
  const clearHistory = useCallback(async () => {
    setSongHistory([]);
    await saveSongHistory([]);
    setTotalHistoryCount(null);
    setHistoryPage(1);
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
    // If password is 'magic-code-login', user is already logged in via magic code
    if (password === 'magic-code-login') {
      // Check current user from session
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userData: User = {
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
        };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Fetch history from API
        try {
          const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
          setSongHistory(items);
          setTotalHistoryCount(totalCount);
          await saveSongHistory(items);
        } catch (error) {
          console.error('Failed to fetch history:', error);
        }
        return;
      }
      throw new Error('Not authenticated');
    }
    
    // Login with email and password
    const result = await loginUser(email, password);
    
    // Update user state
    const userData: User = {
      name: result.user.name,
      email: result.user.email,
      avatar: result.user.avatar,
    };
    setUser(userData);
    setIsAuthenticated(true);
    
    // Load song history from API (most recent 20)
    try {
      const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
      setSongHistory(items);
      setTotalHistoryCount(totalCount);
      setHistoryPage(1);
      await saveSongHistory(items);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Clear auth token
    await saveAuthToken(null);
    
    // Reset user to guest
    setUser(GUEST_USER);
    setIsAuthenticated(false);
    
    // Reset to default preferences
    setPreferences(DEFAULT_PREFERENCES);
    await savePreferences(DEFAULT_PREFERENCES);
    
    // Clear song history
    setSongHistory([]);
    await saveSongHistory([]);
    setTotalHistoryCount(null);
    setHistoryPage(1);
  }, []);

  // Update profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    // Call API to update profile
    await updateUserProfileAPI(updates);
    
    // Update user state
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
  }, [user]);

  const value: UserContextType = {
    user,
    isAuthenticated,
    isLoading,
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

