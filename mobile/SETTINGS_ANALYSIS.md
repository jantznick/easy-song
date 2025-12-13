# Settings Analysis & State Management Recommendations

## Settings Inventory

### 1. Playback Settings (SettingsScreen)
- **Autoplay** (boolean) - Auto-start video when opening a song
- **Auto-scroll Lyrics** (boolean) - Auto-scroll to active lyric line
- **Loop Song** (boolean) - Auto-replay when song ends

### 2. Display Settings (SettingsScreen)
- **Font Size** ('small' | 'medium' | 'large') - Text size for lyrics
- **Default Translation** (boolean) - Show translations by default
- **Theme** ('light' | 'dark' | 'system') - App theme preference

### 3. Language Settings (SettingsScreen)
- **Learning Language** (string) - Language being learned (e.g., "Spanish")
- **Interface Language** (string) - App UI language (e.g., "English")

### 4. User Profile (UserProfileSettingsScreen)
- **User Name** (string) - Display name
- **Email** (string) - User email
- **Sign In Status** (boolean) - Whether user is authenticated
- **Profile Picture** (string/URI) - User avatar (future)

### 5. Account Actions (UserProfileSettingsScreen)
- **Edit Profile** (action) - Navigate to edit profile
- **Change Password** (action) - Navigate to change password
- **Sign In** (action) - Navigate to sign in

### 6. Song History (UserProfileSettingsScreen)
- **Song History** (array) - List of songs played with mode, date/time

### 7. Static/Info (SettingsScreen)
- **App Version** (static string) - No state needed
- **Help & Support** (navigation) - No state needed
- **Terms of Service** (navigation) - No state needed
- **Privacy Policy** (navigation) - No state needed

---

## State Management Recommendations

### Option 1: Unified UserContext (Recommended)
**Single context wrapping the app with all user-related state**

**Pros:**
- Single source of truth for all user data
- Easy to sync with server (one API call to get/set user preferences)
- Simple to persist to AsyncStorage
- Natural place for authentication state
- Easy to add user-specific features later

**Cons:**
- Larger context file
- More re-renders if not optimized (can use separate contexts for different concerns)

**Structure:**
```typescript
UserContext {
  // Authentication
  user: User | null
  isAuthenticated: boolean
  signIn: (email, password) => Promise<void>
  signOut: () => Promise<void>
  
  // User Profile
  profile: {
    name: string
    email: string
    avatar?: string
  }
  
  // Preferences (synced with server if logged in)
  preferences: {
    playback: {
      autoplay: boolean
      autoscroll: boolean
      loop: boolean
    }
    display: {
      fontSize: 'small' | 'medium' | 'large'
      defaultTranslation: boolean
      theme: 'light' | 'dark' | 'system'
    }
    language: {
      learning: string
      interface: string
    }
  }
  
  // Song History (synced with server if logged in)
  songHistory: SongHistoryItem[]
  addToHistory: (song, mode) => void
  
  // Loading/Error states
  isLoading: boolean
  error: string | null
}
```

**Storage Strategy:**
- **Local (AsyncStorage):** All preferences stored locally for offline access
- **Server (when authenticated):** Sync preferences and history to server
- **Fallback:** Use local storage if not authenticated or server unavailable

---

### Option 2: Separate Contexts (Alternative)
**Multiple focused contexts for different concerns**

**Structure:**
- `UserContext` - Authentication & profile
- `PreferencesContext` - All app preferences
- `HistoryContext` - Song history

**Pros:**
- Better separation of concerns
- Fewer re-renders (components only subscribe to what they need)
- Easier to test individual contexts

**Cons:**
- More boilerplate
- Need to coordinate between contexts
- More complex server sync (multiple API calls)

---

## Recommendation: **Option 1 - Unified UserContext**

### Rationale:
1. **Future-proof:** When you add server sync, you'll likely have a single `/user/preferences` endpoint
2. **Simplicity:** One context to manage, one place to persist, one place to sync
3. **User-centric:** Most settings are user preferences anyway
4. **Performance:** Can be optimized with `useMemo` and selective subscriptions if needed

### Implementation Plan:
1. Create `UserContext` with all state
2. Wrap app in `UserProvider`
3. Use `AsyncStorage` for local persistence
4. Add server sync layer later (when backend is ready)
5. Components consume via `useUser()` hook

### File Structure:
```
mobile/src/
  contexts/
    UserContext.tsx       # Main context with all user state
    UserProvider.tsx      # Provider component
  hooks/
    useUser.ts           # Hook to access user context
  utils/
    storage.ts           # AsyncStorage helpers
    api.ts               # API calls (future server sync)
```

---

## Settings Persistence Strategy

### Local Storage (AsyncStorage)
- Store all preferences locally immediately
- Works offline
- Fast access

### Server Sync (Future)
- When user is authenticated, sync preferences to server
- On app launch, fetch user preferences from server if authenticated
- Merge server preferences with local (server takes precedence)
- Background sync periodically

### Default Values
```typescript
const DEFAULT_PREFERENCES = {
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
}
```

---

## Next Steps (Upon Approval)
1. Create `UserContext.tsx` with all state and methods
2. Create `UserProvider.tsx` component
3. Create `useUser.ts` hook
4. Create `storage.ts` utilities for AsyncStorage
5. Wrap app in `App.tsx` with `UserProvider`
6. Update `SettingsScreen` to use context
7. Update `PlayModeScreen` and `StudyModeScreen` to use preferences
8. Add persistence on preference changes

