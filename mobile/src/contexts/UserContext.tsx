import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import type { SongHistoryItem } from '../data/songHistory';
import {
  loadPreferences,
  savePreferences,
  loadSongHistory,
  saveSongHistory,
  clearAllStorage,
  type StoredPreferences,
  DEFAULT_PREFERENCES,
} from '../utils/storage';
import { changeLanguage } from '../i18n/config';
import { updateUserProfile as updateUserProfileAPI, fetchSongHistory as fetchSongHistoryAPI, loginUser, getCurrentUser, logoutUser as logoutUserAPI } from '../utils/api';
import { clearCookies } from '../utils/cookieStorage';

// Get API base URL
const getApiBaseUrl = () => {
  return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';
};

export interface User {
  name: string;
  email: string;
  avatar?: string;
  subscriptionTier?: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  hasPassword?: boolean; // Whether user has a password set (vs magic code only)
  emailVerified?: boolean; // Whether user's email is verified
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
  displayedHistory: SongHistoryItem[]; // Limited view based on subscription tier
  totalHistoryCount: number | null; // null means we don't know the total yet (for guest users)
  isLoadingMoreHistory: boolean;
  addToHistory: (song: string, artist: string, mode: 'Play Mode' | 'Study Mode', videoId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  fetchMoreHistory: () => Promise<void>;

  // Auth methods
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
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
        const [storedPreferences, storedHistory] = await Promise.all([
          loadPreferences(),
          loadSongHistory(),
        ]);

        setPreferences(storedPreferences);

        // Initialize i18n language based on stored preference
        if (storedPreferences.language.interface) {
          changeLanguage(storedPreferences.language.interface);
        }

        // Check if user is authenticated via session cookie
        // The cookie is stored separately in AsyncStorage via cookieStorage.ts
        // We'll try to get the current user - if a valid cookie exists, it will work
        try {
          const currentUser = await getCurrentUser();
          if (currentUser) {
            // Valid session cookie exists - user is authenticated
            const userData: User = {
              name: currentUser.name,
              email: currentUser.email,
              avatar: currentUser.avatar,
              subscriptionTier: currentUser.subscriptionTier,
              hasPassword: currentUser.hasPassword,
              emailVerified: currentUser.emailVerified,
            };
            setUser(userData);
            setIsAuthenticated(true);
            
            // Fetch history from server
            try {
              const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
              setSongHistory(items);
              setTotalHistoryCount(totalCount);
              setHistoryPage(1);
              // Limit local storage based on subscription tier
              let historyToSave = items;
              if (currentUser.subscriptionTier === 'FREE' && items.length > 10) {
                historyToSave = items.slice(0, 10);
              }
              await saveSongHistory(historyToSave);
            } catch (error) {
              console.error('Error fetching history from server:', error);
              // Fallback to local history if server fetch fails
              // Limit based on subscription tier
              let fallbackHistory = storedHistory;
              if (currentUser.subscriptionTier === 'FREE' && storedHistory.length > 10) {
                fallbackHistory = storedHistory.slice(0, 10);
                await saveSongHistory(fallbackHistory);
              }
              setSongHistory(fallbackHistory);
            }
          } else {
            // No valid session cookie - user is a guest
            setUser(GUEST_USER);
            setIsAuthenticated(false);
            
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
          console.error('Error checking authentication:', error);
          // On error, assume guest user
          setUser(GUEST_USER);
          setIsAuthenticated(false);
          
          // For guest users, use local history (limit to 3 most recent items)
          const guestHistory = storedHistory.length > 3 ? storedHistory.slice(0, 3) : storedHistory;
          setSongHistory(guestHistory);
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

  // Computed displayed history - enforces view limits as a safety net
  // This ensures we never show more than the allowed limit, even if songHistory temporarily exceeds it
  const displayedHistory = useMemo(() => {
    if (!isAuthenticated) {
      // Guest users: limit to 3 items (client-side only)
      return songHistory.slice(0, 3);
    }
    
    // For authenticated users, enforce display limits based on subscription tier
    const tier = user.subscriptionTier;
    if (tier === 'FREE') {
      // Free users: limit to 10 items (safety net in case songHistory temporarily has more)
      return songHistory.slice(0, 10);
    }
    
    // Premium users: show all items
    return songHistory;
  }, [songHistory, isAuthenticated, user.subscriptionTier]);

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
          let newHistory = [serverEntry, ...songHistory];
          // Limit local storage for free users
          if (user.subscriptionTier === 'FREE' && newHistory.length > 10) {
            newHistory = newHistory.slice(0, 10);
          }
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
    
    // Enforce storage limits based on user type
    if (!isAuthenticated) {
      // Guest users: 3-item limit
      if (newHistory.length > 3) {
        newHistory = newHistory.slice(0, 3);
      }
    } else if (user.subscriptionTier === 'FREE') {
      // Free users: 10-item limit
      if (newHistory.length > 10) {
        newHistory = newHistory.slice(0, 10);
      }
    }
    // Premium users: no limit (all items saved)
    
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
          
          let updated = [...prev, ...newItems];
          // Limit local storage for free users
          if (user.subscriptionTier === 'FREE' && updated.length > 10) {
            updated = updated.slice(0, 10);
          }
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
          subscriptionTier: currentUser.subscriptionTier,
          hasPassword: currentUser.hasPassword,
          emailVerified: currentUser.emailVerified,
        };
        setUser(userData);
        setIsAuthenticated(true);
        
        // Fetch history from API
        try {
          const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
          setSongHistory(items);
          setTotalHistoryCount(totalCount);
          // Limit local storage for free users
          let historyToSave = items;
          if (currentUser.subscriptionTier === 'FREE' && items.length > 10) {
            historyToSave = items.slice(0, 10);
          }
          await saveSongHistory(historyToSave);
        } catch (error) {
          console.error('Failed to fetch history:', error);
        }
        return;
      }
      throw new Error('Not authenticated');
    }
    
    // Login with email and password
    const result = await loginUser(email, password);
    
    // Fetch full user data including hasPassword
    const currentUser = await getCurrentUser();
    
    // Update user state
    const userData: User = {
      name: result.user.name,
      email: result.user.email,
      avatar: result.user.avatar,
      subscriptionTier: result.user.subscriptionTier,
      hasPassword: currentUser?.hasPassword ?? true, // If login worked with password, they have one
      emailVerified: currentUser?.emailVerified ?? result.user.emailVerified ?? false,
    };
    setUser(userData);
    setIsAuthenticated(true);
    
    // Load song history from API (most recent 20)
    try {
      const { items, totalCount } = await fetchSongHistoryAPI(1, 20);
      setSongHistory(items);
      setTotalHistoryCount(totalCount);
      setHistoryPage(1);
      // Limit local storage for free users
      let historyToSave = items;
      if (result.user.subscriptionTier === 'FREE' && items.length > 10) {
        historyToSave = items.slice(0, 10);
      }
      await saveSongHistory(historyToSave);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    // Call logout API to clear server session
    try {
      await logoutUserAPI();
    } catch (error) {
      console.error('Error during logout API call:', error);
    }
    
    // Clear session cookie
    await clearCookies();
    
    // Clear all local storage
    await clearAllStorage();
    
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
    const updatedUserData = await updateUserProfileAPI(updates);
    
    // Fetch full user data to get hasPassword status
    const currentUser = await getCurrentUser();
    
    // Update user state with server response (ensures we have correct emailVerified status, etc.)
    const updatedUser: User = {
      name: updatedUserData.name,
      email: updatedUserData.email,
      avatar: updatedUserData.avatar || undefined,
      subscriptionTier: user.subscriptionTier, // Keep existing subscription tier (not returned by profile endpoint)
      hasPassword: currentUser?.hasPassword ?? user.hasPassword, // Update hasPassword if available
    };
    setUser(updatedUser);
  }, [user]);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        const userData: User = {
          name: currentUser.name,
          email: currentUser.email,
          avatar: currentUser.avatar,
          subscriptionTier: currentUser.subscriptionTier,
          hasPassword: currentUser.hasPassword,
          emailVerified: currentUser.emailVerified,
        };
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, [isAuthenticated]);

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
    displayedHistory,
    totalHistoryCount,
    isLoadingMoreHistory,
    addToHistory,
    clearHistory,
    fetchMoreHistory,
    signIn,
    signOut,
    updateProfile,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

