# Settings Implementation Checklist

This document tracks the implementation status of each setting feature.

## Playback Settings

### ✅ Storage Implemented
- [x] **Autoplay** - Auto-start video when opening a song
  - [x] Connect to PlayModeScreen (StudyModeScreen intentionally excluded)
  - [x] Auto-play video when screen loads if enabled
  - [x] Test with different songs

- [ ] **Auto-scroll Lyrics** - Auto-scroll to active lyric line
  - [ ] Connect to PlayModeScreen
  - [ ] Connect to StudyModeScreen
  - [ ] Respect preference when highlighting active lines
  - [ ] Test scrolling behavior

- [ ] **Loop Song** - Auto-replay when song ends
  - [ ] Connect to video player
  - [ ] Detect when video ends
  - [ ] Restart video if enabled
  - [ ] Test looping behavior

---

## Display Settings

### ✅ Storage Implemented
- [ ] **Font Size** - Text size for lyrics ('small' | 'medium' | 'large')
  - [ ] Apply font size to PlayModeScreen lyrics
  - [ ] Apply font size to StudyModeScreen lyrics
  - [ ] Define font size constants (small: 14, medium: 16, large: 18)
  - [ ] Test all three sizes

- [ ] **Default Translation** - Show translations by default
  - [ ] Connect to PlayModeScreen
  - [ ] Connect to StudyModeScreen
  - [ ] Set initial translation visibility based on preference
  - [ ] Test toggle behavior

- [ ] **Theme** - App theme preference ('light' | 'dark' | 'system')
  - [ ] Implement theme system (currently hardcoded to dark)
  - [ ] Apply theme colors throughout app
  - [ ] Support system theme detection
  - [ ] Test theme switching

---

## Language Settings

### ✅ Storage Implemented
- [ ] **Learning Language** - Language being learned
  - [ ] Use preference to filter/display relevant content
  - [ ] Connect to translation display logic
  - [ ] Update when user changes language

- [ ] **Interface Language** - App UI language
  - [ ] Implement i18n system
  - [ ] Translate all UI strings
  - [ ] Update when user changes language
  - [ ] Test language switching

---

## User Profile

### ✅ Storage Implemented
- [ ] **User Name** - Display name
  - [ ] Show in UserProfileSettingsScreen
  - [ ] Show in SettingsScreen profile card
  - [ ] Allow editing (when Edit Profile is implemented)

- [ ] **Email** - User email
  - [ ] Show in UserProfileSettingsScreen
  - [ ] Allow editing (when Edit Profile is implemented)

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
- [ ] **Sign In** - Authenticate user
  - [ ] Create sign in screen/modal
  - [ ] Implement API call to backend
  - [ ] Store auth token
  - [ ] Update user state on success
  - [ ] Handle errors

- [ ] **Sign Out** - Log out user
  - [ ] Clear auth token
  - [ ] Clear user data (or keep local preferences?)
  - [ ] Reset to guest state
  - [ ] Navigate to appropriate screen

- [ ] **Edit Profile** - Update user information
  - [ ] Create edit profile screen
  - [ ] Allow editing name, email
  - [ ] Implement API call to update profile
  - [ ] Update local storage
  - [ ] Handle errors

- [ ] **Change Password** - Update password
  - [ ] Create change password screen
  - [ ] Implement API call
  - [ ] Validate password requirements
  - [ ] Handle errors

---

## Song History

### ✅ Storage Implemented
- [ ] **Track Song Plays** - Add entries to history
  - [ ] Call `addToHistory` when song starts playing in PlayMode
  - [ ] Call `addToHistory` when song starts playing in StudyMode
  - [ ] Include correct mode, song info, videoId
  - [ ] Test history creation

- [ ] **Display History** - Show in UserProfileSettingsScreen
  - [ ] Replace dummy data with real history from context
  - [ ] Show most recent entries
  - [ ] Update when new entries added

- [ ] **Display Full History** - Show in SongHistoryScreen
  - [ ] Replace dummy data with real history from context
  - [ ] Implement pagination with real data
  - [ ] Update when new entries added

- [ ] **Clear History** - Remove all history entries
  - [ ] Add clear button (optional)
  - [ ] Implement clear functionality
  - [ ] Confirm before clearing

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

