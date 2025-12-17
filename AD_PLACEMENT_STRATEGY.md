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

### 1. Song List Screen (`SongListScreen.tsx`) ✅ IMPLEMENTED

#### **Custom Modal Ad - On Screen Focus** ⭐ IMPLEMENTED
- **Status**: ✅ **Live**
- **Component**: `AdModal.tsx`
- **Location**: Shows as overlay when navigating to Song List
- **Format**: Custom branded modal with 300x250 native banner ad
- **Frequency**: 33% chance every time screen comes into focus
- **Implementation**: Uses `useFocusEffect` hook to trigger randomly on navigation
- **Technical Notes**:
  - Custom purple-themed modal with "Support Easy Song" branding
  - Dismissible with backdrop tap, X button, or CTA button
  - 500ms delay after screen loads for smooth UX
  - Uses `BannerAdSize.MEDIUM_RECTANGLE`
- **Pros**: High engagement, branded experience, non-intrusive (user can dismiss)
- **Cons**: May not show for several visits (33% probability)

#### **Native Ad Song Card - First Item in Grid** ⭐ IMPLEMENTED
- **Status**: ✅ **Live**
- **Component**: `NativeAdSongCard.tsx`
- **Location**: First card in "All Songs" horizontal scroll section
- **Format**: Native ad styled exactly like song cards
- **Frequency**: Always visible as first item
- **Implementation**: Inserted into FlatList data array with type discrimination
- **Technical Notes**:
  - 160px media area (NativeMediaView) with 100px content area
  - Purple "Ad" badge in top-right corner
  - CTA button centered like play button
  - Fixed height (260px total) matches all song cards
  - Uses `NativeAssetType.HEADLINE`, `ADVERTISER`, `CALL_TO_ACTION`
- **Pros**: Blends seamlessly, high visibility, looks native
- **Cons**: Takes first slot in song list

#### **Interstitial Ad - After Song Selection** ❌ NOT IMPLEMENTED
- **Status**: Removed in favor of less intrusive placements
- **Reason**: Full-screen interstitials can disrupt learning flow

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

### 4. Settings Screen (`SettingsScreen.tsx`) ✅ IMPLEMENTED

#### **Native Ad Banner - Bottom of Settings** ⭐ IMPLEMENTED
- **Status**: ✅ **Live**
- **Component**: `NativeAdBanner.tsx`
- **Location**: At bottom of ScrollView, before closing tag
- **Format**: Compact horizontal native ad (icon + text + CTA)
- **Frequency**: Always visible
- **Implementation**: Renders after all settings sections
- **Technical Notes**:
  - Horizontal layout: 48x48 icon OR 120x120 media, text, CTA button
  - Rounded card design with subtle background
  - Uses `NativeMediaView` if media available, falls back to icon
  - 4px top padding, 12px bottom padding
  - Max width 400px, centered
- **Pros**: Low-intrusion, compact design, users aren't learning here
- **Cons**: May be scrolled past quickly

---

### 5. Song History Screen (`SongHistoryScreen.tsx`) ✅ IMPLEMENTED

#### **Native Ad - Between History Items** ⭐ IMPLEMENTED
- **Status**: ✅ **Live**
- **Component**: `NativeAdHistoryItem.tsx`
- **Location**: Every 6 history entries
- **Format**: Native ad styled exactly like history items
- **Frequency**: 1 ad per 6 songs
- **Implementation**: Injected into map function with conditional rendering
- **Technical Notes**:
  - Matches history item layout: 40x40 icon circle, headline, body, CTA badge
  - "SPONSORED" label at top
  - Optional 120x120 media view (only shows if ad has media)
  - Same padding (16px vertical, 20px horizontal)
  - Top and bottom borders match list items
  - Uses `StyleSheet` instead of className for better border control
  - Purple megaphone icon fallback if no ad icon
- **Pros**: Blends perfectly, natural break in list, non-disruptive
- **Cons**: Requires pagination to see multiple ads

---

### 6. User Profile Settings Screen (`UserProfileSettingsScreen.tsx`) ✅ IMPLEMENTED

#### **Native Ad Banner - Below Profile Card** ⭐ IMPLEMENTED
- **Status**: ✅ **Live**
- **Component**: `NativeAdBanner.tsx` (same as Settings screen)
- **Location**: Between profile card and account settings section
- **Format**: Compact horizontal native ad
- **Frequency**: Always visible
- **Implementation**: Inserted after profile card View
- **Technical Notes**: Same component as Settings screen (reusable)
- **Pros**: Low-intrusion area, users aren't actively learning here
- **Cons**: Slightly increases scroll distance to settings


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

## 📊 Implementation Status

### ✅ Phase 1 - COMPLETED:
1. ✅ **Native ad banner** on Settings screen (`NativeAdBanner.tsx`)
2. ✅ **Native ad banner** on User Profile Settings (`NativeAdBanner.tsx`)
3. ✅ **Custom modal ad** on Song List (33% frequency, `AdModal.tsx`)
4. ✅ **Native ad song card** in Song List grid (`NativeAdSongCard.tsx`)
5. ✅ **Native ad history item** in Song History (`NativeAdHistoryItem.tsx`)

### ❌ Phase 2 - NOT STARTED:
6. ❌ Banner ad below video player (Play/Study modes)
7. ❌ Interstitial after song completion
8. ❌ Native ads in Study Mode sections

### 🔮 Phase 3 - FUTURE:
9. 🔮 Rewarded video for section unlock
10. 🔮 Rewarded video for ad removal (1 hour)
11. 🔮 Premium subscription tier

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

### Current Ad Infrastructure

#### Ad Configuration (`mobile/src/utils/ads.ts`)
```typescript
// Google AdMob test ad unit IDs
export const AD_UNIT_IDS = {
  native: {
    ios: 'ca-app-pub-3940256099942544/3986624511',
    android: 'ca-app-pub-3940256099942544/2247696110',
  },
  banner: {
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  },
  // ... other types
};

// Helper to get platform-specific ID
export function getAdUnitId(adType: 'native' | 'banner' | ...): string
```

#### Native Ad Components Structure

**All ads use Native Ads API** for maximum customization:

```typescript
// Basic pattern used in all components
const [nativeAd, setNativeAd] = useState<NativeAd | null>(null);

useEffect(() => {
  NativeAd.createForAdRequest(getAdUnitId('native'))
    .then(setNativeAd)
    .catch(console.error);
  
  return () => nativeAd?.destroy();
}, []);

return (
  <NativeAdView nativeAd={nativeAd}>
    <NativeAsset assetType={NativeAssetType.HEADLINE}>
      <Text>{nativeAd.headline}</Text>
    </NativeAsset>
    <NativeMediaView style={{ width: 120, height: 120 }} />
    {/* ... other assets */}
  </NativeAdView>
);
```

### Critical Implementation Rules

#### 1. NativeMediaView Requirements ⚠️
- **Minimum size**: 120x120 pixels (AdMob requirement for video ads)
- **Must be included**: Even if you want text-only ads
- **Validation**: AdMob SDK validates on load, not render

```typescript
// ✅ CORRECT - Meets minimum size
<NativeMediaView style={{ width: 120, height: 120, minWidth: 120, minHeight: 120 }} />

// ❌ WRONG - Too small, will fail validation
<NativeMediaView style={{ width: 80, height: 80 }} />
```

#### 2. Asset Placement Rules ⚠️
- **All assets must be direct children** of `NativeAsset` component
- **No wrapper Views** around asset content
- **Why**: SDK tracks clicks and impressions on direct children only

```typescript
// ✅ CORRECT - Direct child
<NativeAsset assetType={NativeAssetType.HEADLINE}>
  <Text style={{ padding: 8 }}>{nativeAd.headline}</Text>
</NativeAsset>

// ❌ WRONG - Wrapper View breaks tracking
<NativeAsset assetType={NativeAssetType.HEADLINE}>
  <View style={{ padding: 8 }}>
    <Text>{nativeAd.headline}</Text>
  </View>
</NativeAsset>
```

#### 3. Border/Styling Workarounds
- `NativeAdView` doesn't properly accept border styles
- **Solution**: Wrap in container View for borders, keep assets inside

```typescript
// ✅ CORRECT - Border on wrapper, assets inside NativeAdView
<View style={{ borderBottomWidth: 1, borderColor: '#333' }}>
  <NativeAdView nativeAd={nativeAd}>
    {/* All assets here */}
  </NativeAdView>
</View>
```

### Component Architecture

#### Reusable Components Created:
1. **`NativeAdBanner.tsx`** - Compact horizontal ad for settings pages
2. **`NativeAdSongCard.tsx`** - Song card style for grid placement
3. **`NativeAdHistoryItem.tsx`** - History item style for lists
4. **`AdModal.tsx`** - Custom branded modal with banner ad

#### Fixed Height Strategy:
All song cards use **260px fixed height**:
- Media area: 160px
- Content area: 100px (fixed with `height: 100` style)
- Ensures uniform grid regardless of text length

### Ad Placement Hooks:

#### Modal Ads with Navigation:
```typescript
// Use useFocusEffect to show on every screen focus
useFocusEffect(
  React.useCallback(() => {
    const shouldShowAd = Math.random() < 0.33;
    if (shouldShowAd) {
      const timer = setTimeout(() => setShowAdModal(true), 500);
      return () => clearTimeout(timer);
    }
  }, [])
);
```

#### List Item Injection:
```typescript
// Add ad as first item in data array
const listData = isAllSongsSection 
  ? [{ type: 'ad' }, ...songs.map(song => ({ type: 'song', song }))]
  : songs.map(song => ({ type: 'song', song }));

// Render with type discrimination
{item.type === 'ad' ? <NativeAdSongCard /> : <SongListItem song={item.song} />}
```

### Testing Checklist:
- ✅ Test on different screen sizes (small/large phones)
- ✅ Verify ads don't break layout
- ✅ Check AdMob Ad Inspector for validation warnings
- ✅ Test with no internet (graceful failure)
- ✅ Verify fixed heights prevent layout shift
- ✅ Test ad cleanup on component unmount
- ✅ Monitor memory leaks (destroy ads properly)

### Production Deployment:
1. Replace test ad unit IDs in `ads.ts` with real IDs from AdMob dashboard
2. Test with real ads in staging environment
3. Monitor fill rate and eCPM in AdMob console
4. Adjust frequencies based on user retention metrics

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

