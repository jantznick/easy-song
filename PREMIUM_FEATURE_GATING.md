# Premium Feature Gating - Implementation Proposal

## Overview
This document outlines the strategy for implementing premium feature gating across Easy Song. The goal is to monetize the app through tiered subscriptions while maintaining a positive free user experience and maximizing conversion through strategic upgrade prompts.

---

## Subscription Tiers

### FREE (Default)
**Target Audience**: Casual learners, trial users

**Limitations**:
- ✅ Browse all songs
- ✅ Play mode (karaoke) access
- ✅ Basic history (last 10 songs)
- ❌ Full history (limited to 10)
- ❌ Study mode (locked)
- ❌ Song requests (locked)
- ❌ Games/quizzes (locked, coming soon)
- 📢 **Ads enabled** (all placements)

**Purpose**: Provide value to hook users, demonstrate app quality, create desire for premium features.

---

### PREMIUM ($4.99/mo or $39.99/yr)
**Target Audience**: Active learners, regular users

**Features**:
- ✅ Unlimited song history
- ✅ Study mode (full access)
- ✅ Song requests (up to 5/month)
- ✅ Games/quizzes (coming soon)
- ✅ **Ad-free experience**
- ❌ Priority song requests
- ❌ Offline downloads (future)
- ❌ Custom playlists (future)

**Value Proposition**: "Learn without distractions, track your full progress."

---

### PREMIUM PLUS ($9.99/mo or $79.99/yr)
**Target Audience**: Power users, dedicated language learners

**Features**:
- ✅ Everything in Premium
- ✅ **Unlimited song requests**
- ✅ Priority request processing (24hr turnaround)
- ✅ Early access to new features
- ✅ Advanced study analytics (coming soon)
- ✅ Custom playlists (future)
- ✅ Offline downloads (future)
- ✅ VIP support

**Value Proposition**: "Professional language learning, personalized to your taste."

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User Context                          │
│  - user.subscriptionTier: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS' │
│  - isAuthenticated: boolean                             │
└─────────────────────────────────────────────────────────┘
                              ↓
         ┌────────────────────┴────────────────────┐
         │                                         │
         ↓                                         ↓
┌─────────────────────┐              ┌─────────────────────┐
│  Feature Gate       │              │  Ad Display Logic   │
│  Utility Functions  │              │                     │
│                     │              │                     │
│  - isPremium()      │              │  if (isPremium()) { │
│  - isPremiumPlus()  │              │    hideAds()        │
│  - hasFeature()     │              │  }                  │
│  - canAccess()      │              │                     │
└─────────────────────┘              └─────────────────────┘
         ↓                                         ↓
┌─────────────────────────────────────────────────────────┐
│              Feature Components                          │
│                                                          │
│  - Study Mode Screen (gate: PREMIUM)                    │
│  - Full History (gate: PREMIUM)                         │
│  - Song Requests (gate: PREMIUM, limit based on tier)   │
│  - Games (gate: PREMIUM, coming soon)                   │
│  - Ad Components (hide: PREMIUM)                        │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│              Upgrade Prompts                             │
│                                                          │
│  - Contextual messages when features accessed           │
│  - "Upgrade to remove ads" in ad display               │
│  - History limit reached notification                   │
│  - Study mode locked banner                             │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Strategy

### Phase 1: Core Gating Infrastructure (Week 1)
**Goal**: Set up subscription checking utilities and basic gates

#### 1.1 Feature Gate Utility Module
Create `mobile/src/utils/premiumFeatures.ts`:

```typescript
import { User } from '../contexts/UserContext';

// ============================================
// SUBSCRIPTION TIER CHECKS
// ============================================

export const isPremium = (user: User | null): boolean => {
  return user?.subscriptionTier === 'PREMIUM' || user?.subscriptionTier === 'PREMIUM_PLUS';
};

export const isPremiumPlus = (user: User | null): boolean => {
  return user?.subscriptionTier === 'PREMIUM_PLUS';
};

export const isFree = (user: User | null): boolean => {
  return !user?.subscriptionTier || user.subscriptionTier === 'FREE';
};

// ============================================
// FEATURE ACCESS CHECKS
// ============================================

export enum Feature {
  // Study Features
  STUDY_MODE = 'study_mode',
  UNLIMITED_HISTORY = 'unlimited_history',
  GAMES = 'games',
  
  // Content Features
  SONG_REQUESTS = 'song_requests',
  PRIORITY_REQUESTS = 'priority_requests',
  CUSTOM_PLAYLISTS = 'custom_playlists',
  OFFLINE_DOWNLOADS = 'offline_downloads',
  
  // Experience Features
  AD_FREE = 'ad_free',
  EARLY_ACCESS = 'early_access',
  VIP_SUPPORT = 'vip_support',
  
  // Analytics (future)
  ADVANCED_ANALYTICS = 'advanced_analytics',
}

/**
 * Check if user has access to a specific feature
 */
export const hasFeature = (user: User | null, feature: Feature): boolean => {
  const tier = user?.subscriptionTier || 'FREE';
  
  switch (feature) {
    // Features available to all Premium tiers
    case Feature.STUDY_MODE:
    case Feature.UNLIMITED_HISTORY:
    case Feature.GAMES:
    case Feature.SONG_REQUESTS:
    case Feature.AD_FREE:
      return tier === 'PREMIUM' || tier === 'PREMIUM_PLUS';
    
    // Features exclusive to Premium Plus
    case Feature.PRIORITY_REQUESTS:
    case Feature.EARLY_ACCESS:
    case Feature.VIP_SUPPORT:
    case Feature.ADVANCED_ANALYTICS:
    case Feature.CUSTOM_PLAYLISTS:
    case Feature.OFFLINE_DOWNLOADS:
      return tier === 'PREMIUM_PLUS';
    
    default:
      return false;
  }
};

/**
 * Get feature requirement (which tier is needed)
 */
export const getFeatureRequirement = (feature: Feature): 'PREMIUM' | 'PREMIUM_PLUS' => {
  switch (feature) {
    case Feature.PRIORITY_REQUESTS:
    case Feature.EARLY_ACCESS:
    case Feature.VIP_SUPPORT:
    case Feature.ADVANCED_ANALYTICS:
    case Feature.CUSTOM_PLAYLISTS:
    case Feature.OFFLINE_DOWNLOADS:
      return 'PREMIUM_PLUS';
    
    default:
      return 'PREMIUM';
  }
};

// ============================================
// USAGE LIMITS
// ============================================

export const LIMITS = {
  FREE: {
    HISTORY_ITEMS: 10,
    SONG_REQUESTS_PER_MONTH: 0,
  },
  PREMIUM: {
    HISTORY_ITEMS: Infinity,
    SONG_REQUESTS_PER_MONTH: 5,
  },
  PREMIUM_PLUS: {
    HISTORY_ITEMS: Infinity,
    SONG_REQUESTS_PER_MONTH: Infinity,
  },
};

/**
 * Get usage limit for user's tier
 */
export const getLimit = (
  user: User | null,
  limitType: 'HISTORY_ITEMS' | 'SONG_REQUESTS_PER_MONTH'
): number => {
  const tier = user?.subscriptionTier || 'FREE';
  return LIMITS[tier][limitType];
};

/**
 * Check if user has reached a limit
 */
export const hasReachedLimit = (
  user: User | null,
  limitType: 'HISTORY_ITEMS' | 'SONG_REQUESTS_PER_MONTH',
  currentCount: number
): boolean => {
  const limit = getLimit(user, limitType);
  return currentCount >= limit;
};

// ============================================
// UPGRADE HELPERS
// ============================================

/**
 * Get upgrade CTA text based on feature
 */
export const getUpgradeCTA = (feature: Feature): string => {
  switch (feature) {
    case Feature.AD_FREE:
      return 'Upgrade to Premium to remove all ads';
    case Feature.STUDY_MODE:
      return 'Unlock Study Mode with Premium';
    case Feature.UNLIMITED_HISTORY:
      return 'Upgrade to Premium for unlimited history';
    case Feature.SONG_REQUESTS:
      return 'Request your favorite songs with Premium';
    case Feature.PRIORITY_REQUESTS:
      return 'Get priority processing with Premium Plus';
    case Feature.GAMES:
      return 'Unlock learning games with Premium';
    default:
      return 'Upgrade to Premium for more features';
  }
};

/**
 * Get feature benefit description
 */
export const getFeatureBenefit = (feature: Feature): string => {
  switch (feature) {
    case Feature.AD_FREE:
      return 'Learn without interruptions from ads';
    case Feature.STUDY_MODE:
      return 'Deep-dive into lyrics with explanations and translations';
    case Feature.UNLIMITED_HISTORY:
      return 'Track all your learning progress, never lose a song';
    case Feature.SONG_REQUESTS:
      return 'Request any song to be added to Easy Song';
    case Feature.PRIORITY_REQUESTS:
      return 'Your requests processed within 24 hours';
    case Feature.GAMES:
      return 'Test your knowledge with interactive quizzes';
    default:
      return 'Enhance your learning experience';
  }
};
```

#### 1.2 Upgrade Prompt Component
Create `mobile/src/components/UpgradePrompt.tsx`:

```typescript
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { Feature, getUpgradeCTA, getFeatureBenefit } from '../utils/premiumFeatures';

interface UpgradePromptProps {
  feature: Feature;
  variant?: 'inline' | 'banner' | 'modal';
  compact?: boolean;
}

export default function UpgradePrompt({ 
  feature, 
  variant = 'banner',
  compact = false 
}: UpgradePromptProps) {
  const navigation = useNavigation();
  const { isDark } = useTheme();
  
  const ctaText = getUpgradeCTA(feature);
  const benefit = getFeatureBenefit(feature);
  
  const handleUpgrade = () => {
    navigation.navigate('PremiumBenefits' as never);
  };
  
  if (variant === 'inline') {
    return (
      <View className={`${isDark ? 'bg-[#1E293B]' : 'bg-white'} rounded-xl p-4 border-2 border-[#6366F1]`}>
        <View className="flex-row items-start mb-3">
          <Ionicons name="lock-closed" size={24} color="#6366F1" />
          <View className="flex-1 ml-3">
            <Text className={`${isDark ? 'text-white' : 'text-gray-900'} text-lg font-bold mb-1`}>
              {ctaText}
            </Text>
            {!compact && (
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
                {benefit}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={handleUpgrade}
          className="bg-[#6366F1] rounded-lg py-3 items-center"
        >
          <Text className="text-white font-bold text-base">View Premium Plans</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  if (variant === 'banner') {
    return (
      <TouchableOpacity
        onPress={handleUpgrade}
        className={`${isDark ? 'bg-[#6366F1]/20' : 'bg-[#EEF2FF]'} rounded-lg p-3 flex-row items-center border border-[#6366F1]`}
        activeOpacity={0.7}
      >
        <Ionicons name="lock-closed" size={20} color="#6366F1" />
        <View className="flex-1 ml-3">
          <Text className={`${isDark ? 'text-white' : 'text-gray-900'} font-semibold text-sm`}>
            {ctaText}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#6366F1" />
      </TouchableOpacity>
    );
  }
  
  return null;
}
```

#### 1.3 Feature Gate Component
Create `mobile/src/components/FeatureGate.tsx`:

```typescript
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useUser } from '../contexts/UserContext';
import { Feature, hasFeature } from '../utils/premiumFeatures';
import UpgradePrompt from './UpgradePrompt';

interface FeatureGateProps {
  feature: Feature;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
  promptVariant?: 'inline' | 'banner' | 'modal';
}

/**
 * Conditionally render content based on feature access
 * Shows upgrade prompt if user doesn't have access
 */
export default function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
  promptVariant = 'inline',
}: FeatureGateProps) {
  const { user } = useUser();
  
  const hasAccess = hasFeature(user, feature);
  
  if (hasAccess) {
    return <>{children}</>;
  }
  
  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} variant={promptVariant} />;
  }
  
  return null;
}
```

---

### Phase 2: Feature-Specific Gating (Week 1-2)
**Goal**: Implement gates for each premium feature

#### 2.1 Study Mode Gate
Update `mobile/src/screens/SongPlayerScreen.tsx`:

```typescript
import { hasFeature, Feature } from '../utils/premiumFeatures';
import { useUser } from '../contexts/UserContext';

export default function SongPlayerScreen() {
  const { user } = useUser();
  const navigation = useNavigation();
  
  const handleStudyModePress = () => {
    if (hasFeature(user, Feature.STUDY_MODE)) {
      // Navigate to study mode
      navigation.navigate('SongStudy', { videoId });
    } else {
      // Show upgrade prompt
      navigation.navigate('PremiumBenefits', { 
        highlightFeature: 'study_mode' 
      });
    }
  };
  
  return (
    <View>
      {/* ... other content ... */}
      
      {/* Study Mode Button */}
      <TouchableOpacity
        onPress={handleStudyModePress}
        className="bg-primary rounded-lg py-3 px-4 flex-row items-center"
      >
        {!hasFeature(user, Feature.STUDY_MODE) && (
          <Ionicons name="lock-closed" size={18} color="white" style={{ marginRight: 8 }} />
        )}
        <Text className="text-white font-bold">Study Mode</Text>
      </TouchableOpacity>
    </View>
  );
}
```

Alternative: Use `FeatureGate` component in Study Mode screen:

```typescript
// mobile/src/screens/SongStudyScreen.tsx
import FeatureGate from '../components/FeatureGate';
import { Feature } from '../utils/premiumFeatures';

export default function SongStudyScreen() {
  return (
    <FeatureGate feature={Feature.STUDY_MODE}>
      {/* Study mode content */}
      <View>
        <Text>Study Mode Content</Text>
      </View>
    </FeatureGate>
  );
}
```

#### 2.2 History Limit Gate
Update `mobile/src/contexts/UserContext.tsx`:

```typescript
import { getLimit, hasReachedLimit } from '../utils/premiumFeatures';

// In addToHistory function
export const addToHistory = async (item: SongHistoryItem) => {
  const limit = getLimit(user, 'HISTORY_ITEMS');
  
  // Truncate history for free users
  if (!isPremium(user) && songHistory.length >= limit) {
    // Keep only the most recent items up to limit
    const updatedHistory = [item, ...songHistory.slice(0, limit - 1)];
    setSongHistory(updatedHistory);
    await saveSongHistory(updatedHistory);
  } else {
    // Premium users get unlimited history
    const updatedHistory = [item, ...songHistory];
    setSongHistory(updatedHistory);
    await saveSongHistory(updatedHistory);
  }
};
```

Update `mobile/src/screens/SongHistoryScreen.tsx`:

```typescript
import { getLimit, hasReachedLimit, Feature } from '../utils/premiumFeatures';
import UpgradePrompt from '../components/UpgradePrompt';

export default function SongHistoryScreen() {
  const { user, songHistory } = useUser();
  const limit = getLimit(user, 'HISTORY_ITEMS');
  const atLimit = hasReachedLimit(user, 'HISTORY_ITEMS', songHistory.length);
  
  return (
    <View>
      {/* Show upgrade prompt if at limit */}
      {atLimit && (
        <View className="px-4 py-3">
          <UpgradePrompt 
            feature={Feature.UNLIMITED_HISTORY} 
            variant="banner"
          />
        </View>
      )}
      
      {/* History list */}
      <FlatList
        data={songHistory.slice(0, limit)}
        renderItem={({ item }) => <HistoryItem item={item} />}
        ListFooterComponent={() => (
          atLimit ? (
            <View className="p-4 items-center">
              <Text className="text-gray-500 text-sm text-center mb-2">
                Showing {limit} of {songHistory.length} songs
              </Text>
              <Text className="text-gray-400 text-xs text-center">
                Upgrade to Premium to see your full history
              </Text>
            </View>
          ) : null
        )}
      />
    </View>
  );
}
```

#### 2.3 Song Requests Gate
Create `mobile/src/screens/SongRequestScreen.tsx`:

```typescript
import { useState, useEffect } from 'react';
import { hasFeature, getLimit, Feature } from '../utils/premiumFeatures';
import { useUser } from '../contexts/UserContext';
import FeatureGate from '../components/FeatureGate';

export default function SongRequestScreen() {
  const { user } = useUser();
  const [requestsThisMonth, setRequestsThisMonth] = useState(0);
  
  const limit = getLimit(user, 'SONG_REQUESTS_PER_MONTH');
  const canRequest = requestsThisMonth < limit;
  
  return (
    <FeatureGate feature={Feature.SONG_REQUESTS}>
      <View className="flex-1 p-4">
        {/* Request form */}
        <View className="mb-4">
          <Text className="text-lg font-bold mb-2">Request a Song</Text>
          
          {/* Show remaining requests for Premium (not Plus) */}
          {!hasFeature(user, Feature.PRIORITY_REQUESTS) && (
            <View className="bg-blue-50 rounded-lg p-3 mb-4">
              <Text className="text-sm text-blue-900">
                {canRequest 
                  ? `${limit - requestsThisMonth} requests remaining this month`
                  : 'Request limit reached. Resets next month.'}
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('PremiumBenefits')}
                className="mt-2"
              >
                <Text className="text-blue-600 font-semibold text-xs">
                  Upgrade to Premium Plus for unlimited requests →
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Request form fields */}
        <TextInput
          placeholder="Song title"
          editable={canRequest}
          // ... other props
        />
        
        {/* Submit button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canRequest}
          className={`py-3 rounded-lg ${canRequest ? 'bg-primary' : 'bg-gray-300'}`}
        >
          <Text className="text-white text-center font-bold">
            {canRequest ? 'Submit Request' : 'Limit Reached'}
          </Text>
        </TouchableOpacity>
      </View>
    </FeatureGate>
  );
}
```

---

### Phase 3: Ad Removal Implementation (Week 2)
**Goal**: Hide all ads for Premium users and show upgrade prompts

#### 3.1 Ad Display Conditional
Update all ad components to check premium status:

```typescript
// mobile/src/components/AdModal.tsx
import { hasFeature, Feature } from '../utils/premiumFeatures';
import { useUser } from '../contexts/UserContext';

export default function AdModal({ visible, onClose }: AdModalProps) {
  const { user } = useUser();
  const shouldShowAds = !hasFeature(user, Feature.AD_FREE);
  
  // Don't render modal at all if user is premium
  if (!shouldShowAds) {
    return null;
  }
  
  // ... rest of component
}
```

```typescript
// mobile/src/components/NativeAdBanner.tsx
import { hasFeature, Feature } from '../utils/premiumFeatures';
import { useUser } from '../contexts/UserContext';

export default function NativeAdBanner() {
  const { user } = useUser();
  
  if (hasFeature(user, Feature.AD_FREE)) {
    return null; // No ad for premium users
  }
  
  // ... rest of component
}
```

```typescript
// mobile/src/components/NativeAdSongCard.tsx (in song list)
// In SongListScreen.tsx when injecting ad into list:

const { user } = useUser();
const shouldShowAd = !hasFeature(user, Feature.AD_FREE);

const listData = useMemo(() => {
  const items = [...songs];
  
  // Only inject ad for free users
  if (shouldShowAd) {
    items.unshift({ type: 'ad', id: 'native-ad' });
  }
  
  return items;
}, [songs, shouldShowAd]);
```

#### 3.2 "Upgrade to Remove Ads" Prompt
Add upgrade CTA to ad components for free users:

```typescript
// mobile/src/components/NativeAdBanner.tsx
import UpgradePrompt from './UpgradePrompt';
import { Feature } from '../utils/premiumFeatures';

export default function NativeAdBanner() {
  const { user } = useUser();
  const [showUpgradeOption, setShowUpgradeOption] = useState(false);
  
  if (hasFeature(user, Feature.AD_FREE)) {
    return null;
  }
  
  return (
    <View>
      {/* Show upgrade prompt above ad (optional) */}
      {showUpgradeOption && (
        <View className="mb-2">
          <UpgradePrompt feature={Feature.AD_FREE} variant="banner" compact />
        </View>
      )}
      
      {/* Ad content */}
      <NativeAdView>
        {/* ... ad content ... */}
      </NativeAdView>
      
      {/* Small "Remove ads" link below ad */}
      <TouchableOpacity
        onPress={() => navigation.navigate('PremiumBenefits')}
        className="py-2 items-center"
      >
        <Text className="text-xs text-gray-500">
          Tired of ads? <Text className="text-primary font-semibold">Upgrade to Premium</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

#### 3.3 Upgrade from Ad Modal
Update `AdModal.tsx` to include upgrade CTA:

```typescript
// mobile/src/components/AdModal.tsx
export default function AdModal({ visible, onClose }: AdModalProps) {
  const { user } = useUser();
  const navigation = useNavigation();
  
  if (hasFeature(user, Feature.AD_FREE)) {
    return null;
  }
  
  const handleUpgrade = () => {
    onClose();
    navigation.navigate('PremiumBenefits', { highlightFeature: 'ad_free' });
  };
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 bg-black/50 justify-center items-center p-6">
        <View className="bg-white rounded-2xl w-full max-w-[360px] overflow-hidden">
          {/* Modal Header */}
          <View className="bg-gradient-to-r from-primary to-purple-600 p-4 flex-row items-center justify-between">
            <Text className="text-white text-lg font-bold">Sponsored Content</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Ad Content */}
          <View className="p-4">
            <NativeAdView>
              {/* ... native ad content ... */}
            </NativeAdView>
          </View>
          
          {/* Upgrade CTA Footer */}
          <View className="border-t border-gray-200 p-4 bg-gray-50">
            <Text className="text-center text-sm text-gray-600 mb-3">
              Want an ad-free experience?
            </Text>
            <TouchableOpacity
              onPress={handleUpgrade}
              className="bg-primary rounded-lg py-3 flex-row items-center justify-center"
            >
              <Ionicons name="star" size={18} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold">Upgrade to Premium</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
```

---

### Phase 4: Premium Benefits Screen Enhancement (Week 2)
**Goal**: Improve conversion with better messaging and feature highlighting

#### 4.1 Context-Aware Entry
Update `PremiumBenefitsScreen.tsx` to highlight specific features:

```typescript
// mobile/src/screens/PremiumBenefitsScreen.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type Props = NativeStackScreenProps<RootStackParamList, 'PremiumBenefits'>;

export default function PremiumBenefitsScreen({ route }: Props) {
  const { highlightFeature } = route.params || {};
  
  // Scroll to and highlight specific feature
  useEffect(() => {
    if (highlightFeature) {
      // Highlight the feature that brought user here
      // Could expand that benefit card, add animation, etc.
    }
  }, [highlightFeature]);
  
  // ... rest of component
}
```

#### 4.2 Social Proof & Urgency
Add testimonials and limited-time offers:

```typescript
// In PremiumBenefitsScreen.tsx
<View className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
  <View className="flex-row items-center mb-2">
    <Ionicons name="people" size={20} color="#10B981" />
    <Text className="ml-2 text-green-900 font-bold">Join 10,000+ learners</Text>
  </View>
  <Text className="text-green-800 text-sm">
    "Premium changed how I learn Spanish through music. Best investment!" - Maria S.
  </Text>
</View>

{/* Limited time offer banner */}
<View className="mb-6 p-4 bg-orange-50 rounded-xl border-2 border-orange-400">
  <Text className="text-orange-900 font-bold text-center text-lg mb-1">
    🎉 Limited Time: 20% Off Annual Plans
  </Text>
  <Text className="text-orange-700 text-sm text-center">
    Offer ends in 3 days
  </Text>
</View>
```

#### 4.3 Free Trial Option
Add trial period for premium features:

```typescript
// In TierCard component
<View className="bg-yellow-50 border border-yellow-300 rounded-lg p-3 mb-4">
  <View className="flex-row items-center">
    <Ionicons name="gift" size={20} color="#F59E0B" />
    <Text className="ml-2 text-yellow-900 font-bold text-sm">
      7-Day Free Trial • Cancel Anytime
    </Text>
  </View>
</View>
```

---

### Phase 5: Advanced Gating Strategies (Week 3+)
**Goal**: Optimize conversion through strategic prompts and A/B testing

#### 5.1 Soft Paywalls (Strategic Timing)
Show upgrade prompts at key moments:

```typescript
// mobile/src/utils/conversionTriggers.ts

/**
 * Track user actions that indicate high intent
 * Show upgrade prompts at optimal moments
 */

interface ConversionTrigger {
  type: 'song_milestone' | 'feature_attempt' | 'session_count' | 'time_spent';
  threshold: number;
  feature: Feature;
}

const CONVERSION_TRIGGERS: ConversionTrigger[] = [
  {
    type: 'song_milestone',
    threshold: 5, // After 5 songs viewed
    feature: Feature.UNLIMITED_HISTORY,
  },
  {
    type: 'feature_attempt',
    threshold: 2, // After 2nd attempt to access study mode
    feature: Feature.STUDY_MODE,
  },
  {
    type: 'session_count',
    threshold: 7, // After 7 app opens (engaged user)
    feature: Feature.AD_FREE,
  },
];

export const shouldShowUpgradePrompt = (
  user: User,
  trigger: ConversionTrigger,
  currentValue: number
): boolean => {
  // Don't show if already premium
  if (hasFeature(user, trigger.feature)) {
    return false;
  }
  
  // Show at threshold (not every time after)
  return currentValue === trigger.threshold;
};
```

Usage in app:

```typescript
// In SongListScreen after song selection
const { user, songHistory } = useUser();
const songsViewedCount = songHistory.length;

useEffect(() => {
  if (songsViewedCount === 5 && !hasFeature(user, Feature.UNLIMITED_HISTORY)) {
    // Show upgrade prompt modal
    setShowUpgradeModal(true);
  }
}, [songsViewedCount]);
```

#### 5.2 Feature Teaser (Let Them Taste It)
Give free users a limited preview of premium features:

```typescript
// Allow 1 free study mode session
const FREE_STUDY_MODE_SESSIONS = 1;

// In SongStudyScreen
const [studySessionsUsed, setStudySessionsUsed] = useState(0);

if (!hasFeature(user, Feature.STUDY_MODE)) {
  if (studySessionsUsed < FREE_STUDY_MODE_SESSIONS) {
    // Show banner: "Free preview - 1 study session remaining"
    return (
      <View>
        <View className="bg-yellow-50 border-b-2 border-yellow-400 p-3">
          <Text className="text-yellow-900 text-center font-semibold">
            🎁 Free Preview: You have 1 study session remaining
          </Text>
          <Text className="text-yellow-700 text-xs text-center mt-1">
            Upgrade to Premium for unlimited access
          </Text>
        </View>
        
        {/* Allow access to study mode */}
        {children}
      </View>
    );
  } else {
    // Block access, show full upgrade prompt
    return <UpgradePrompt feature={Feature.STUDY_MODE} />;
  }
}
```

#### 5.3 Gamification & Streaks
Encourage upgrade through achievement system:

```typescript
// mobile/src/components/StreakBanner.tsx

export default function StreakBanner() {
  const { user, songHistory } = useUser();
  const streak = calculateStreak(songHistory);
  
  return (
    <View className="bg-gradient-to-r from-orange-400 to-red-500 p-4 rounded-xl">
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-white text-2xl font-bold">{streak} Day Streak! 🔥</Text>
          <Text className="text-white/90 text-sm">Keep it going!</Text>
        </View>
        
        {isFree(user) && (
          <TouchableOpacity
            onPress={() => navigation.navigate('PremiumBenefits')}
            className="bg-white px-4 py-2 rounded-full"
          >
            <Text className="text-orange-600 font-bold text-xs">
              Unlock Advanced Stats
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {isFree(user) && (
        <View className="mt-3 p-3 bg-white/20 rounded-lg">
          <Text className="text-white text-xs">
            <Ionicons name="lock-closed" size={12} color="white" /> 
            Premium users get detailed analytics, milestone badges, and more!
          </Text>
        </View>
      )}
    </View>
  );
}
```

---

## Backend Implementation

### Subscription Verification
Add endpoint to verify subscription status:

```typescript
// backend/src/routes/subscriptions.ts

router.get('/subscription/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check with App Store / Google Play
    const subscriptionStatus = await verifySubscription(
      user.subscriptionReceipt,
      user.platform
    );
    
    // Update user if status changed
    if (subscriptionStatus.tier !== user.subscriptionTier) {
      user.subscriptionTier = subscriptionStatus.tier;
      user.subscriptionExpiresAt = subscriptionStatus.expiresAt;
      await user.save();
    }
    
    res.json({
      tier: user.subscriptionTier,
      expiresAt: user.subscriptionExpiresAt,
      isActive: subscriptionStatus.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check subscription' });
  }
});
```

### Feature Flags (Server-Side)
Validate feature access on sensitive operations:

```typescript
// backend/src/middleware/premiumCheck.ts

export const requirePremium = async (req, res, next) => {
  const user = await User.findById(req.session.userId);
  
  if (!user || !['PREMIUM', 'PREMIUM_PLUS'].includes(user.subscriptionTier)) {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      upgradeUrl: '/premium',
    });
  }
  
  next();
};

// Usage in routes
router.post('/songs/request', requireAuth, requirePremium, async (req, res) => {
  // Only premium users can access this
  // ...
});
```

---

## In-App Purchase Integration

### iOS (App Store)
```typescript
// mobile/src/utils/iap.ts
import * as StoreKit from 'expo-store-kit'; // or react-native-iap

export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'com.easysong.premium.monthly',
  PREMIUM_ANNUAL: 'com.easysong.premium.annual',
  PREMIUM_PLUS_MONTHLY: 'com.easysong.premiumplus.monthly',
  PREMIUM_PLUS_ANNUAL: 'com.easysong.premiumplus.annual',
};

export const purchaseSubscription = async (productId: string) => {
  try {
    // Request purchase
    const purchase = await StoreKit.requestPurchase(productId);
    
    // Send receipt to backend for verification
    const receipt = purchase.transactionReceipt;
    await verifyPurchase(receipt);
    
    // Update user context
    return { success: true };
  } catch (error) {
    console.error('Purchase failed:', error);
    return { success: false, error };
  }
};

const verifyPurchase = async (receipt: string) => {
  const response = await fetch(`${API_URL}/subscriptions/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ receipt, platform: 'ios' }),
  });
  
  if (!response.ok) {
    throw new Error('Receipt verification failed');
  }
  
  return response.json();
};
```

### Android (Google Play)
```typescript
// Similar implementation using Google Play Billing
export const purchaseSubscription = async (sku: string) => {
  // Use react-native-iap or expo-in-app-purchases
  // Send purchase token to backend for verification
};
```

---

## Analytics & A/B Testing

### Conversion Tracking
```typescript
// Track upgrade funnel
trackEvent('upgrade_prompt_shown', { feature, location });
trackEvent('upgrade_prompt_clicked', { feature, location });
trackEvent('premium_page_viewed', { source });
trackEvent('purchase_initiated', { tier, billing_period });
trackEvent('purchase_completed', { tier, billing_period, price });
trackEvent('purchase_failed', { tier, error });

// Track feature usage (free vs premium)
trackEvent('feature_used', { 
  feature, 
  tier: user.subscriptionTier,
  is_premium: isPremium(user),
});

// Track retention by tier
trackEvent('session_start', {
  tier: user.subscriptionTier,
  days_since_signup,
});
```

### A/B Test Ideas
```typescript
// Test 1: Upgrade prompt timing
// Control: After 5 songs
// Variant: After 3 songs
modal_upgrade_prompt_song_count: 5 vs 3

// Test 2: Pricing display
// Control: Show monthly price prominently
// Variant: Show annual savings prominently
pricing_display_mode: 'monthly' vs 'annual'

// Test 3: Ad removal messaging
// Control: "Upgrade to remove ads"
// Variant: "Learn ad-free for $4.99/month"
ad_removal_cta: 'feature_focused' vs 'price_focused'

// Test 4: Free trial length
// Control: 7 days
// Variant: 14 days
free_trial_days: 7 vs 14
```

---

## Key Metrics to Track

### Conversion Funnel
| Stage | Metric | Target |
|-------|--------|--------|
| Awareness | % users viewing premium page | 50%+ |
| Consideration | Time spent on premium page | 30s+ |
| Intent | Purchase button clicks | 20%+ |
| Conversion | Free → Premium CVR | 2-5% |
| Retention | Premium churn rate (monthly) | <5% |

### Feature Usage
| Feature | Free Users | Premium Users | Lift |
|---------|-----------|---------------|------|
| Songs Viewed | 5/week | 15/week | 3x |
| Sessions | 3/week | 7/week | 2.3x |
| Study Mode | Locked | 30% use | - |
| Retention (D7) | 20% | 60% | 3x |

### Revenue Metrics
- **ARPU** (Average Revenue Per User): $1-2/month across all users
- **ARPPU** (Average Revenue Per Paying User): $30-60/year
- **LTV** (Lifetime Value): $50-150 (depends on retention)
- **Payback Period**: 2-4 months

---

## Additional Premium Features (Future)

### Tier: PREMIUM
1. **Offline Downloads**
   - Download songs for offline study
   - Sync across devices
   - Auto-download history

2. **Custom Playlists**
   - Create themed playlists
   - Share with friends
   - Collaborative playlists

3. **Progress Tracking**
   - Words learned counter
   - Time spent learning
   - Completion percentage per song

4. **Theme Customization**
   - Additional color themes
   - Font size controls
   - Custom layouts

### Tier: PREMIUM PLUS
1. **Advanced Analytics**
   - Learning velocity graphs
   - Weak areas identification
   - Progress predictions

2. **AI Features**
   - Personalized song recommendations
   - Difficulty-adjusted content
   - Smart review scheduling

3. **Exclusive Content**
   - Early access to new songs
   - Premium-only song catalog
   - Artist interviews & context

4. **Community Features**
   - Join learning groups
   - Leaderboards
   - Achievement badges

---

## Implementation Checklist

### Phase 1: Infrastructure ✅
- [ ] Create `premiumFeatures.ts` utility
- [ ] Create `UpgradePrompt` component
- [ ] Create `FeatureGate` component
- [ ] Add subscription tier to User model
- [ ] Test feature access checks

### Phase 2: Feature Gates ✅
- [ ] Gate Study Mode
- [ ] Implement History limit
- [ ] Gate Song Requests (with limits)
- [ ] Gate Games (coming soon)
- [ ] Test all gates work correctly

### Phase 3: Ad Removal ✅
- [ ] Hide ads for premium users
- [ ] Add "Upgrade to remove ads" CTAs
- [ ] Update ad modal with upgrade option
- [ ] Add subtle upgrade prompts near ads
- [ ] Test ad display logic

### Phase 4: Premium Page ✅
- [ ] Enhance PremiumBenefitsScreen
- [ ] Add context-aware highlighting
- [ ] Add social proof elements
- [ ] Add free trial messaging
- [ ] Add urgency/scarcity elements

### Phase 5: Advanced ✅
- [ ] Implement conversion triggers
- [ ] Add feature teasers/previews
- [ ] Add streak/gamification
- [ ] Set up analytics tracking
- [ ] Create A/B tests
- [ ] Monitor conversion funnel

### Phase 6: IAP ✅
- [ ] Set up App Store Connect products
- [ ] Set up Google Play Console products
- [ ] Implement purchase flow (iOS)
- [ ] Implement purchase flow (Android)
- [ ] Backend receipt verification
- [ ] Test purchase flow end-to-end
- [ ] Test subscription restoration

---

## Success Criteria

### Week 1-2 (Setup & Basic Gates)
- ✅ All feature gates implemented
- ✅ Premium features locked for free users
- ✅ Upgrade prompts showing correctly
- ✅ No crashes or blocking bugs

### Week 3-4 (Optimization)
- ✅ Conversion rate: 2%+ (free → premium)
- ✅ 50%+ free users view premium page
- ✅ Ad-free experience for premium users
- ✅ Feature usage stats collected

### Month 2+ (Growth)
- ✅ 5%+ conversion rate
- ✅ <5% monthly churn
- ✅ $1+ ARPU across all users
- ✅ Premium users 3x more engaged than free

---

## Resources

### Documentation
- [Expo In-App Purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [React Native IAP](https://github.com/dooboolab/react-native-iap)
- [Apple StoreKit](https://developer.apple.com/documentation/storekit)
- [Google Play Billing](https://developer.android.com/google/play/billing)

### Articles
- [Subscription App Best Practices](https://www.revenuecat.com/blog/subscription-app-best-practices/)
- [Paywall Optimization](https://www.apptamin.com/blog/app-paywall-best-practices/)
- [Free Trial Strategies](https://www.chargebee.com/blog/free-trial-strategies/)

### Tools
- [RevenueCat](https://www.revenuecat.com/) - IAP management & analytics
- [Adapty](https://adapty.io/) - Paywall A/B testing
- [Qonversion](https://qonversion.io/) - Subscription analytics

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Proposed - Awaiting Approval

