# Settings Implementation Checklist

This document tracks the implementation status of each setting feature.

## Playback Settings

### ✅ Storage Implemented
- [x] **Autoplay** - Auto-start video when opening a song
  - [x] Connect to PlayModeScreen (StudyModeScreen intentionally excluded)
  - [x] Auto-play video when screen loads if enabled
  - [x] Test with different songs

- [x] **Auto-scroll Lyrics** - Auto-scroll to active lyric line
  - [x] Connect to PlayModeScreen
  - [x] Connect to StudyModeScreen
  - [x] Respect preference when highlighting active lines
  - [x] Test scrolling behavior

- [x] **Loop Song** - Auto-replay when song ends
  - [x] Connect to video player
  - [x] Detect when video ends
  - [x] Restart video if enabled
  - [x] Test looping behavior

---

## Display Settings

### ✅ Storage Implemented
- [x] **Font Size** - Text size for lyrics ('small' | 'medium' | 'large')
  - [x] Apply font size to PlayModeScreen lyrics
  - [x] Apply font size to StudyModeScreen lyrics
  - [x] Define font size constants (small: 14, medium: 16, large: 18)
  - [x] Test all three sizes

- [x] **Default Translation** - Show translations by default
  - [x] Connect to PlayModeScreen
  - [x] Connect to StudyModeScreen
  - [x] Set initial translation visibility based on preference
  - [x] Test toggle behavior

- [ ] **Theme** - App theme preference ('light' | 'dark' | 'system')
  - [ ] Implement theme system (currently hardcoded to dark)
  - [ ] Apply theme colors throughout app
  - [ ] Support system theme detection
  - [ ] Test theme switching

---

## Language Settings

### ✅ Storage Implemented
- [x] **Learning Language** - Language being learned
  - [x] Storage implemented (saved to AsyncStorage via preferences)
  - [x] UI connected in SettingsScreen
  - [ ] TODO: Future - Use preference to filter songs in SongListScreen
  - [ ] TODO: Future - Pass to API when backend supports language filtering
  - [ ] TODO: Future - Connect to translation display logic if needed

- [ ] **Interface Language** - App UI language
  - [ ] Implement i18n system
  - [ ] Translate all UI strings
  - [ ] Update when user changes language
  - [ ] Test language switching

---

## User Profile

### ✅ Storage Implemented
- [x] **User Name** - Display name
  - [x] Show in UserProfileSettingsScreen
  - [x] Show in SettingsScreen profile card
  - [x] Allow editing (with modal, saves locally and calls dummy API)

- [x] **Email** - User email
  - [x] Show in UserProfileSettingsScreen
  - [x] Show in SettingsScreen profile card
  - [x] Allow editing (with modal, saves locally and calls dummy API)

- [ ] **Sign In Status** - Authentication state
  - [ ] Show "Guest User" when not signed in
  - [ ] Show user name when signed in
  - [ ] Update UI based on auth status

- [ ] **Profile Picture** - User avatar (future)
  - [ ] Add avatar upload functionality
  - [ ] Display avatar in profile sections
  - [ ] Store avatar URL/path

---

## Account Actions

### ✅ Storage Implemented
- [x] **Sign In** - Authenticate user
  - [x] Create sign in screen/modal
  - [x] Implement API call to backend (dummy API for now)
  - [x] Store auth token
  - [x] Update user state on success
  - [x] Handle errors

- [x] **Sign Out** - Log out user
  - [x] Clear auth token
  - [x] Reset to default preferences
  - [x] Reset to guest state
  - [x] Clear user profile and song history


- [ ] **Change Password** - Update password
  - [ ] Create change password screen
  - [ ] Implement API call
  - [ ] Validate password requirements
  - [ ] Handle errors

---

## Song History

### ✅ Storage Implemented
- [x] **Track Song Plays** - Add entries to history
  - [x] Call `addToHistory` when song starts playing in PlayMode
  - [x] Call `addToHistory` when song starts playing in StudyMode
  - [x] Include correct mode, song info, videoId
  - [x] Test history creation

- [x] **Display History** - Show in UserProfileSettingsScreen
  - [x] Replace dummy data with real history from context
  - [x] Show most recent 5 entries
  - [x] Update when new entries added

- [x] **Display Full History** - Show in SongHistoryScreen
  - [x] Replace dummy data with real history from context
  - [x] Implement pagination with real data
  - [x] Auto-fetch more history when reaching last page
  - [x] Load most recent 20 songs on login
  - [x] Update when new entries added


---

## Implementation Order Recommendation

1. **Song History Tracking** - Easiest, immediate value
2. **Display Settings (Font Size, Default Translation)** - Visual improvements
3. **Playback Settings (Autoplay, Auto-scroll)** - Core functionality
4. **Theme** - Requires more work, can be later
5. **Language Settings** - Requires i18n setup
6. **Authentication** - Requires backend API

---

## Notes

- All settings are now stored in AsyncStorage
- Settings persist across app restarts
- Settings are available via `useUser()` hook
- Server sync will be added later when backend is ready

