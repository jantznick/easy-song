# Ad Placement Strategy for Easy Song

## Overview
This document outlines strategic ad placement opportunities that balance revenue generation with user experience. The goal is to monetize without disrupting the core language learning experience.

---

## 🎯 Ad Placement Principles

1. **Never interrupt active learning** - No ads during video playback or while reading lyrics
2. **Use natural break points** - Place ads at transitions between screens/actions
3. **Respect user intent** - Don't block critical actions (song selection, settings access)
4. **Offer value exchange** - Use rewarded ads for premium features
5. **Mobile-first design** - Consider smaller screens and touch interactions

---

## 📱 Mobile App Ad Placements

### 1. Song List Screen (`SongListScreen.tsx`)

#### **Banner Ad - Top of List** ⭐ RECOMMENDED
- **Location**: Below header, above song grid
- **Format**: 320x50 banner or 320x100 medium rectangle
- **Frequency**: Always visible
- **Pros**: High visibility, doesn't block content, users see it while browsing
- **Cons**: Takes vertical space
- **Implementation**: Add between header (line 88) and songs grid (line 100)

#### **Native Ad - Between Songs** ⭐ RECOMMENDED
- **Location**: Every 6-8 songs in the grid
- **Format**: Native ad styled like a song card
- **Frequency**: 1 ad per 6-8 songs
- **Pros**: Blends naturally, high engagement, doesn't feel intrusive
- **Cons**: Requires careful styling to match app design
- **Implementation**: Insert in the map function around line 102-109

#### **Interstitial Ad - After Song Selection** 
- **Location**: When user taps a song, before navigating to SongDetail
- **Format**: Full-screen interstitial
- **Frequency**: Every 3rd song selection (33% frequency)
- **Pros**: High CPM, natural break point
- **Cons**: Can feel intrusive if too frequent
- **Implementation**: Show ad in navigation handler before `navigation.navigate('SongDetail')`

---

### 2. Play Mode Screen (`PlayModeScreen.tsx`)

#### **Banner Ad - Below Video Player** ⭐ RECOMMENDED
- **Location**: Between video player and song info (around line 211-212)
- **Format**: 320x50 banner
- **Frequency**: Always visible
- **Pros**: Visible but doesn't block lyrics, users see it when video loads
- **Cons**: Takes space above lyrics
- **Note**: **Never show ads during video playback** - only static banners

#### **Interstitial Ad - When Song Ends**
- **Location**: After video completes (when `onChangeState` receives 'ended')
- **Format**: Full-screen interstitial
- **Frequency**: Every 3rd song completion
- **Pros**: Natural break point, user finished watching
- **Cons**: Can interrupt flow if user wants to replay immediately
- **Implementation**: In `onPlayerStateChange` when event === 'ended' (line 204)

---

### 3. Study Mode Screen (`StudyModeScreen.tsx`)

#### **Banner Ad - Below Video Player** ⭐ RECOMMENDED
- **Location**: Between video player and section pills (around line 314-316)
- **Format**: 320x50 banner
- **Frequency**: Always visible
- **Pros**: Visible but doesn't block study content
- **Cons**: Takes vertical space

#### **Native Ad - Between Sections**
- **Location**: After every 2-3 completed sections
- **Format**: Native ad styled as a section card
- **Frequency**: 1 ad per 2-3 sections
- **Pros**: Appears at natural learning milestones
- **Cons**: Can break study flow if not timed well
- **Implementation**: Show when `completedSections` set updates (line 256)

#### **Rewarded Video Ad - Unlock Next Section Early** ⭐ PREMIUM FEATURE
- **Location**: "Next Section" button (line 417-424)
- **Format**: Rewarded video (30 seconds)
- **Frequency**: Optional - user chooses to watch
- **Benefit**: Skip to next section without completing current one
- **Pros**: User-controlled, high engagement, premium feel
- **Cons**: Requires ad network with rewarded video support
- **Implementation**: Add "Watch Ad to Unlock" option next to "Next Section" button

---

### 4. Settings Screen (`SettingsScreen.tsx`)

#### **Banner Ad - Bottom of Settings** ⭐ RECOMMENDED
- **Location**: At bottom of ScrollView, above safe area
- **Format**: 320x50 banner
- **Frequency**: Always visible
- **Pros**: Low-intrusion, users browsing settings aren't actively learning
- **Cons**: May be scrolled past quickly
- **Implementation**: Add before closing ScrollView tag (around line 353)

---

### 5. Song History Screen (`SongHistoryScreen.tsx`)

#### **Native Ad - Between History Items**
- **Location**: Every 5-7 history entries
- **Format**: Native ad styled like history item
- **Frequency**: 1 ad per 5-7 items
- **Pros**: Natural break in list, doesn't interrupt browsing
- **Cons**: Requires careful styling
- **Implementation**: Insert in history list rendering

---

### 6. User Profile Settings Screen

#### **Banner Ad - Below Profile Card**
- **Location**: After profile information card
- **Format**: 320x50 banner
- **Frequency**: Always visible
- **Pros**: Low-intrusion area, users aren't actively learning here
- **Cons**: Limited screen real estate

---

## 🌐 Web Frontend Ad Placements

### Similar placements as mobile, with adjustments:

#### **Sidebar Banner** (Desktop only)
- **Location**: Right sidebar on song list and detail pages
- **Format**: 300x250 medium rectangle or 300x600 half-page
- **Frequency**: Always visible on desktop
- **Pros**: Doesn't interfere with content, high visibility

#### **Sticky Footer Banner**
- **Location**: Fixed at bottom of viewport
- **Format**: 728x90 leaderboard (desktop) or 320x50 (mobile)
- **Frequency**: Always visible
- **Pros**: Persistent visibility, doesn't block content

---

## ⏰ Timing & Frequency Recommendations

### Interstitial Ads
- **Maximum frequency**: 1 per 3-5 minutes of app usage
- **Best times**: 
  - After completing a song
  - When switching between Play/Study modes
  - After viewing 3-5 songs in a session
- **Avoid**: During active video playback, during lyric reading

### Banner Ads
- **Frequency**: Can be always-on (non-intrusive)
- **Refresh**: Every 30-60 seconds
- **Best locations**: Top/bottom of screens, between content sections

### Rewarded Video Ads
- **Frequency**: User-initiated only
- **Best use cases**:
  - Unlock premium features temporarily
  - Skip to next section in Study Mode
  - Remove ads for 1 hour
  - Get extra song history storage

---

## 💡 Premium Features to Gate Behind Ads

### Free Tier (with ads):
- All current features
- Limited song history (last 50 songs)
- Standard playback features

### Premium Tier (no ads):
- Unlimited song history
- Offline mode
- Advanced study features
- Priority support

### Rewarded Ad Unlocks (temporary):
- Remove ads for 1 hour
- Unlock next section early
- View extra song history
- Download song for offline

---

## 🎨 Ad Format Recommendations

### For Language Learning Context:
1. **Native Ads** - Best for blending with content (song cards, history items)
2. **Banner Ads** - Best for persistent, non-intrusive revenue
3. **Rewarded Video** - Best for user-controlled premium features
4. **Interstitial** - Use sparingly at natural break points

### Ad Networks to Consider:
- **Google AdMob** - Best for mobile, excellent rewarded video support
- **Meta Audience Network** - Good native ad options
- **Unity Ads** - Strong rewarded video CPMs
- **AppLovin MAX** - Good mediation platform

---

## 📊 Implementation Priority

### Phase 1 (Quick Wins):
1. ✅ Banner ad below video player (Play/Study modes)
2. ✅ Banner ad on Song List screen
3. ✅ Banner ad on Settings screen

### Phase 2 (Optimization):
4. ✅ Native ads between songs (Song List)
5. ✅ Interstitial after song completion
6. ✅ Native ads in history list

### Phase 3 (Premium Features):
7. ✅ Rewarded video for section unlock
8. ✅ Rewarded video for ad removal
9. ✅ Premium subscription option

---

## ⚠️ Things to Avoid

1. **Never show ads:**
   - During active video playback
   - Overlaying lyrics while user is reading
   - Blocking song selection buttons
   - During critical user actions (login, settings save)

2. **Don't overdo it:**
   - More than 1 interstitial per 3 minutes
   - More than 2-3 banner ads per screen
   - Ads that auto-play sound/video

3. **Respect user preferences:**
   - Honor "Do Not Track" settings
   - Provide clear ad preferences in settings
   - Allow users to understand what data is collected

---

## 🔧 Technical Implementation Notes

### Ad Component Structure:
```typescript
// Example: AdBanner component
<AdBanner 
  unitId="ca-app-pub-xxx/xxx"
  size="BANNER"
  position="top" | "bottom" | "inline"
  onAdLoaded={() => {}}
  onAdFailedToLoad={(error) => {}}
/>
```

### Ad Placement Hooks:
- Use `useEffect` to track ad impressions
- Track user session time for frequency capping
- Implement ad loading states to prevent layout shift

### Testing:
- Test on different screen sizes
- Verify ads don't break layout
- Test rewarded video flow end-to-end
- Monitor ad performance and user feedback

---

## 📈 Success Metrics

Track these metrics to optimize ad placement:
- **eCPM** (effective cost per mille) - Revenue per 1000 impressions
- **Fill Rate** - Percentage of ad requests that return ads
- **Click-Through Rate (CTR)** - Percentage of users who click ads
- **User Retention** - Ensure ads don't hurt retention
- **Session Length** - Monitor if ads reduce engagement
- **Premium Conversion** - Track users upgrading to remove ads

---

## 🎯 Recommended Starting Strategy

1. **Start conservative**: Begin with 2-3 banner placements
2. **Monitor metrics**: Track user behavior and revenue
3. **Iterate**: Add more placements based on data
4. **A/B test**: Test different frequencies and positions
5. **Listen to users**: Collect feedback and adjust

The key is finding the balance between revenue and user experience. Start small and scale based on data!

