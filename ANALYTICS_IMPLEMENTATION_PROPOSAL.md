# Analytics & A/B Testing Implementation Proposal

## Overview
This document outlines the strategy for implementing analytics tracking and A/B testing infrastructure for Easy Song. The goal is to measure user engagement, optimize ad placements, and make data-driven decisions for product growth while maintaining a lean, cost-effective approach.

---

## Platform Selection: Firebase Analytics + Remote Config

### Rationale
After evaluating multiple platforms (see `ANALYTICS_AND_AB_TESTING_OPTIONS.md` for detailed comparison), **Firebase Analytics with Remote Config** is the recommended solution.

### Key Decision Factors
1. **Zero Cost** - Completely free for unlimited events and users
2. **Native AdMob Integration** - Automatic ad revenue tracking (critical for monetization optimization)
3. **Already Using Google AdMob** - Seamless integration with existing infrastructure
4. **Sufficient Feature Set** - Covers all current analytics and experimentation needs
5. **React Native Support** - Mature `@react-native-firebase` library with Expo dev client compatibility
6. **Scalability** - Can handle growth from 0 to millions of users without pricing concerns

### What Firebase Provides
- **Analytics**: Event tracking, user properties, funnels, audiences
- **Remote Config**: Feature flags, A/B testing, dynamic configuration
- **AdMob Integration**: Automatic ad impression, click, and revenue tracking
- **Crashlytics**: Bonus - crash reporting and error tracking
- **BigQuery Export**: (Optional) Raw data export for advanced analysis

### What Firebase Does NOT Replace
- **Your Backend**: Backend stays completely independent (no hosting changes required)
- **Your Database**: Database remains on your current infrastructure
- **API Endpoints**: All existing APIs unchanged
- **User Authentication**: Your existing auth system remains primary (Firebase auth not required)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                           │
│                  (React Native)                         │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Firebase SDK                                │     │
│  │  ├─ Analytics (event tracking)               │     │
│  │  ├─ Remote Config (A/B tests)                │     │
│  │  └─ AdMob SDK (ad serving + auto-tracking)   │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Your App Code (unchanged)                   │     │
│  │  └─ API calls to your backend                │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
         │                           │
         │ Analytics events          │ API calls
         │ (to Firebase)             │ (to your backend)
         ↓                           ↓
┌──────────────────┐         ┌─────────────────┐
│ Firebase Cloud   │         │  Your Backend   │
│ (Google)         │         │  (Express/Node) │
│                  │         │                 │
│ - Analytics      │         │ - User data     │
│ - Remote Config  │         │ - Song data     │
│ - AdMob metrics  │         │ - History       │
└──────────────────┘         └─────────────────┘
```

**Key Point**: Firebase is purely client-side tracking. Your backend, database, and hosting remain completely unchanged.

---

## Implementation Strategy

### Phase 1: Foundation (Week 1)
**Goal**: Set up Firebase project and basic event tracking

#### 1.1 Firebase Project Setup
- Create Firebase project in Firebase Console
- Add iOS app configuration (`GoogleService-Info.plist`)
- Add Android app configuration (`google-services.json`)
- Enable Analytics and Remote Config in Firebase Console

#### 1.2 Install Dependencies
```bash
npm install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/remote-config
```

#### 1.3 Core Utility Module
Create `mobile/src/utils/analytics.ts`:

```typescript
import analytics from '@react-native-firebase/analytics';
import remoteConfig from '@react-native-firebase/remote-config';

// ============================================
// ANALYTICS TRACKING
// ============================================

/**
 * Track a custom event
 */
export const trackEvent = async (
  eventName: string, 
  params?: { [key: string]: string | number | boolean }
) => {
  try {
    await analytics().logEvent(eventName, params);
  } catch (error) {
    console.error('Analytics error:', error);
  }
};

/**
 * Track screen view
 */
export const trackScreen = async (screenName: string) => {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (error) {
    console.error('Screen tracking error:', error);
  }
};

/**
 * Set user properties
 */
export const setUserProperties = async (properties: {
  userId?: string;
  subscriptionTier?: 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';
  learningLanguage?: string;
  interfaceLanguage?: string;
}) => {
  try {
    // Set each property individually
    for (const [key, value] of Object.entries(properties)) {
      if (value !== undefined) {
        await analytics().setUserProperty(key, String(value));
      }
    }
  } catch (error) {
    console.error('User properties error:', error);
  }
};

/**
 * Track ad events (supplement automatic AdMob tracking)
 */
export const trackAdEvent = async (
  adFormat: 'modal' | 'song_card' | 'history_item' | 'banner',
  action: 'loaded' | 'failed' | 'dismissed',
  params?: object
) => {
  await trackEvent('ad_interaction', {
    ad_format: adFormat,
    action,
    ...params,
  });
};

// ============================================
// REMOTE CONFIG (A/B TESTING)
// ============================================

/**
 * Initialize Remote Config with defaults
 */
export const initRemoteConfig = async () => {
  try {
    const config = remoteConfig();
    
    // Set default values (fallback if remote fetch fails)
    await config.setDefaults({
      // Ad frequency/placement configs
      modal_ad_frequency: 0.33,              // 33% chance
      history_ad_interval: 6,                // Every 6 items
      song_card_ad_enabled: true,            // Show ad as first song
      
      // Feature flags
      study_mode_enabled: true,
      premium_features_enabled: true,
      
      // UX experiments
      onboarding_flow_version: 'v1',
    });
    
    // Fetch remote values (cached for 12 hours in production)
    await config.fetchAndActivate();
    
    console.log('Remote Config initialized');
  } catch (error) {
    console.error('Remote Config error:', error);
  }
};

/**
 * Get a Remote Config value
 */
export const getRemoteValue = (key: string): any => {
  try {
    const config = remoteConfig();
    const value = config.getValue(key);
    
    // Handle different value types
    switch (value.getSource()) {
      case 'remote':
        // Value from server
        break;
      case 'default':
        // Fallback default value
        break;
      case 'static':
        // Built-in default
        break;
    }
    
    return {
      asString: () => value.asString(),
      asNumber: () => value.asNumber(),
      asBoolean: () => value.asBoolean(),
    };
  } catch (error) {
    console.error('Get remote value error:', error);
    return null;
  }
};

/**
 * Get specific config values (type-safe helpers)
 */
export const getAdConfig = () => ({
  modalFrequency: getRemoteValue('modal_ad_frequency')?.asNumber() ?? 0.33,
  historyInterval: getRemoteValue('history_ad_interval')?.asNumber() ?? 6,
  songCardEnabled: getRemoteValue('song_card_ad_enabled')?.asBoolean() ?? true,
});

export const isFeatureEnabled = (featureName: string): boolean => {
  return getRemoteValue(`${featureName}_enabled`)?.asBoolean() ?? false;
};
```

#### 1.4 Initialize in App
Update `mobile/App.tsx`:

```typescript
import { useEffect } from 'react';
import { initRemoteConfig } from './src/utils/analytics';

export default function App() {
  useEffect(() => {
    // Initialize Remote Config on app start
    initRemoteConfig();
  }, []);
  
  // ... rest of app
}
```

---

### Phase 2: Core Event Tracking (Week 1-2)
**Goal**: Track essential user actions and screen views

#### 2.1 Screen Tracking
Add to each screen component:

```typescript
// Example: SongListScreen.tsx
import { trackScreen } from '../utils/analytics';

export default function SongListScreen() {
  useFocusEffect(
    React.useCallback(() => {
      trackScreen('song_list');
    }, [])
  );
  
  // ... rest of component
}
```

**Screens to Track**:
- `song_list` - Home/browse songs
- `song_detail` - Song detail view
- `play_mode` - Karaoke mode
- `study_mode` - Study mode
- `settings` - Settings screen
- `user_profile` - Profile settings
- `song_history` - History screen
- `onboarding` - Onboarding flow

#### 2.2 User Authentication Events
In `UserContext.tsx`:

```typescript
import { trackEvent, setUserProperties } from '../utils/analytics';

// After successful login/registration
const handleAuthSuccess = async (userData: User) => {
  // Track auth event
  await trackEvent('login', {
    method: 'email',
    is_new_user: isNewRegistration,
  });
  
  // Set user properties
  await setUserProperties({
    userId: userData.id,
    subscriptionTier: userData.subscriptionTier,
    learningLanguage: preferences.language.learning,
    interfaceLanguage: preferences.language.interface,
  });
};

// Track logout
const handleLogout = async () => {
  await trackEvent('logout');
};
```

#### 2.3 Core User Actions
Add throughout the app:

```typescript
// Song interaction
trackEvent('song_selected', {
  videoId: song.videoId,
  title: song.title,
  source: 'song_list', // or 'history', 'search', etc.
});

// Mode switching
trackEvent('mode_switched', {
  from_mode: 'play',
  to_mode: 'study',
  videoId: currentSong.videoId,
});

// Song completion
trackEvent('song_completed', {
  videoId: song.videoId,
  mode: 'play_mode',
  duration_seconds: watchedDuration,
});

// Learning milestone
trackEvent('songs_learned', {
  count: totalSongsLearned,
  mode: 'play_mode', // or 'study_mode'
});

// Settings changes
trackEvent('settings_changed', {
  setting: 'theme',
  value: 'dark',
});

// Premium conversion
trackEvent('subscription_purchase', {
  tier: 'PREMIUM',
  price: 9.99,
  currency: 'USD',
});
```

---

### Phase 3: Ad Performance Tracking (Week 2)
**Goal**: Track ad impressions, interactions, and optimize placements

#### 3.1 Automatic AdMob Tracking
**No code needed** - Firebase automatically tracks:
- `ad_impression` - When ad is shown
- `ad_click` - When user clicks ad
- `ad_reward` - For rewarded video ads
- Ad revenue (eCPM, earnings)

These appear automatically in Firebase Analytics dashboard under "AdMob" section.

#### 3.2 Custom Ad Events
Supplement automatic tracking with context:

```typescript
// In AdModal.tsx
import { trackAdEvent } from '../utils/analytics';

useEffect(() => {
  if (visible && nativeAd) {
    trackAdEvent('modal', 'loaded', {
      placement: 'song_list_focus',
      has_media: !!nativeAd.mediaContent,
    });
  }
}, [visible, nativeAd]);

const handleClose = () => {
  trackAdEvent('modal', 'dismissed', {
    time_visible_ms: Date.now() - shownTimestamp,
  });
  onClose();
};

// Track failures
const handleAdError = (error: Error) => {
  trackAdEvent('modal', 'failed', {
    error_message: error.message,
  });
};
```

#### 3.3 Ad Placement Tracking
In each ad component:

```typescript
// NativeAdSongCard.tsx
useEffect(() => {
  if (nativeAd) {
    trackEvent('ad_shown', {
      format: 'song_card',
      position: 'first_card',
      section: 'all_songs',
    });
  }
}, [nativeAd]);

// NativeAdHistoryItem.tsx
useEffect(() => {
  if (nativeAd) {
    trackEvent('ad_shown', {
      format: 'history_item',
      position: index,
      total_items: historyLength,
    });
  }
}, [nativeAd]);
```

---

### Phase 4: A/B Testing Implementation (Week 3)
**Goal**: Test ad frequencies and placements to optimize revenue vs. retention

#### 4.1 Implement Remote Config in Ad Logic

**Modal Ad Frequency**:
```typescript
// SongListScreen.tsx
import { getAdConfig } from '../utils/analytics';

useFocusEffect(
  React.useCallback(() => {
    // Get A/B test value from Remote Config
    const { modalFrequency } = getAdConfig();
    
    const shouldShowAd = Math.random() < modalFrequency;
    if (shouldShowAd) {
      setTimeout(() => setShowAdModal(true), 500);
    }
  }, [])
);
```

**History Ad Interval**:
```typescript
// SongHistoryScreen.tsx
import { getAdConfig } from '../utils/analytics';

const { historyInterval } = getAdConfig();

// In render logic
const shouldShowAd = (index + 1) % historyInterval === 0;
```

**Feature Flags**:
```typescript
// Check if feature is enabled
import { isFeatureEnabled } from '../utils/analytics';

const showSongCardAd = isFeatureEnabled('song_card_ad');

if (showSongCardAd) {
  // Show native ad song card
}
```

#### 4.2 Create A/B Tests in Firebase Console

**Test 1: Modal Ad Frequency**
- **Hypothesis**: 50% frequency increases revenue without hurting retention
- **Control Group (50%)**: `modal_ad_frequency = 0.33` (current)
- **Variant A (50%)**: `modal_ad_frequency = 0.50`
- **Metrics**: 
  - Primary: Ad revenue per user
  - Secondary: D1, D7 retention
  - Guardrail: Session length, songs per session
- **Duration**: 2 weeks
- **Sample Size**: 1000+ users per group

**Test 2: History Ad Density**
- **Hypothesis**: More frequent ads (every 5 items) increases revenue
- **Control Group (50%)**: `history_ad_interval = 6` (current)
- **Variant A (50%)**: `history_ad_interval = 5`
- **Metrics**:
  - Primary: Ad impressions per session
  - Secondary: History screen engagement
  - Guardrail: App uninstalls
- **Duration**: 2 weeks

**Test 3: Song Card Ad Position**
- **Hypothesis**: Random position vs first position affects CTR
- **Control**: Ad always first card
- **Variant**: Ad at random position in first 10 cards
- **Metrics**: CTR, revenue per impression

#### 4.3 Track A/B Test Assignment
Automatically tracked by Firebase, but can log explicitly:

```typescript
// Log which variant user is in (optional - Firebase does this automatically)
trackEvent('ab_test_assigned', {
  experiment_name: 'modal_ad_frequency',
  variant: modalFrequency === 0.33 ? 'control' : 'variant_a',
});
```

---

### Phase 5: Advanced Tracking (Week 4+)
**Goal**: Deep insights into learning behavior and product usage

#### 5.1 User Funnel Tracking
```typescript
// Onboarding funnel
trackEvent('onboarding_started');
trackEvent('onboarding_step_completed', { step: 1 });
trackEvent('onboarding_completed');

// Learning funnel
trackEvent('song_started', { videoId, mode });
trackEvent('song_25_percent', { videoId, mode });
trackEvent('song_50_percent', { videoId, mode });
trackEvent('song_75_percent', { videoId, mode });
trackEvent('song_completed', { videoId, mode });
```

#### 5.2 Engagement Metrics
```typescript
// Session metrics (track on app background/foreground)
trackEvent('session_start', {
  session_number: userSessionCount,
});

trackEvent('session_end', {
  duration_seconds: sessionDuration,
  songs_viewed: songsViewedInSession,
  modes_used: ['play', 'study'],
});

// Feature usage
trackEvent('feature_used', {
  feature: 'study_mode',
  first_time: isFirstTimeUsingFeature,
});
```

#### 5.3 Error Tracking
```typescript
// Track errors that aren't crashes
trackEvent('error_occurred', {
  error_type: 'api_failure',
  endpoint: '/api/songs',
  status_code: 500,
  user_impact: 'songs_not_loaded',
});

trackEvent('error_recovered', {
  error_type: 'api_failure',
  recovery_method: 'retry',
});
```

---

## Key Metrics to Track

### User Engagement
| Metric | Definition | Firebase Event |
|--------|-----------|----------------|
| DAU/WAU/MAU | Daily/Weekly/Monthly Active Users | Automatic |
| Session Duration | Average time per session | `session_start` / `session_end` |
| Sessions per User | Frequency of app opens | Automatic |
| Songs per Session | Engagement depth | `song_selected` count |
| Retention (D1, D7, D30) | % users returning | Automatic |

### Ad Performance
| Metric | Definition | Firebase Event |
|--------|-----------|----------------|
| Ad Impressions | Total ads shown | Automatic (`ad_impression`) |
| Ad CTR | Click-through rate | Automatic (`ad_click`) |
| eCPM | Revenue per 1000 impressions | Automatic (AdMob) |
| Ad Load Rate | % successful ad loads | `ad_shown` / attempts |
| Revenue per User (RPU) | Total ad revenue / active users | Calculated |

### Learning Effectiveness
| Metric | Definition | Firebase Event |
|--------|-----------|----------------|
| Songs Learned | Total songs completed | `song_completed` |
| Study Completion Rate | % users completing study mode | `study_mode_completed` |
| Mode Preference | Play vs Study usage | `mode_switched` |
| Learning Streak | Consecutive days active | Calculated |

### Conversion
| Metric | Definition | Firebase Event |
|--------|-----------|----------------|
| Free → Premium CVR | Conversion rate to paid | `subscription_purchase` |
| Time to Conversion | Days until first purchase | Calculated |
| Premium Churn | % canceling subscription | `subscription_cancelled` |
| LTV | Lifetime value per user | Calculated |

---

## Dashboard & Reporting

### Firebase Analytics Dashboard
**Built-in Reports**:
1. **Overview** - DAU, MAU, sessions, retention curves
2. **Events** - Top events, event counts, parameters
3. **Audiences** - User segments (free, premium, by language)
4. **Funnels** - Conversion funnels (onboarding, song completion)
5. **AdMob** - Revenue, eCPM, impressions, fill rate
6. **Remote Config** - A/B test results, variant performance

**Custom Dashboards**:
- Create in Firebase Console > Analytics > Custom Dashboards
- Example: "Ad Performance Dashboard"
  - Card 1: Ad revenue (last 7 days)
  - Card 2: Ad impressions by format
  - Card 3: Revenue per user by cohort
  - Card 4: Ad CTR trend

### BigQuery Export (Optional)
For advanced analysis, export raw data:
```sql
-- Example: Analyze ad revenue by user segment
SELECT
  user_properties.value.string_value AS subscription_tier,
  COUNT(DISTINCT user_pseudo_id) AS users,
  SUM(event_value_in_usd) AS total_revenue,
  SUM(event_value_in_usd) / COUNT(DISTINCT user_pseudo_id) AS revenue_per_user
FROM `project.analytics_XXXXX.events_*`
WHERE event_name = 'ad_impression'
  AND _TABLE_SUFFIX BETWEEN '20240101' AND '20240131'
GROUP BY subscription_tier
ORDER BY revenue_per_user DESC
```

---

## Privacy & Compliance

### GDPR Compliance
```typescript
// Allow users to opt out of analytics
export const setAnalyticsEnabled = async (enabled: boolean) => {
  await analytics().setAnalyticsCollectionEnabled(enabled);
};

// Add to Settings screen
<Switch
  value={analyticsEnabled}
  onValueChange={setAnalyticsEnabled}
  label="Share usage data to improve the app"
/>
```

### Data Collection Disclosure
Add to Privacy Policy:
- Event data collected (screens viewed, features used)
- No personally identifiable information (PII) collected
- Data used for app improvement and ad optimization
- Users can opt out in Settings

### App Store Requirements
**iOS App Privacy**:
- Analytics: Usage Data → Used for Analytics
- AdMob: Advertising Data → Used for Advertising

**Google Play Data Safety**:
- Analytics: App interactions collected
- AdMob: Ad interactions collected
- No data shared with third parties

---

## Testing Strategy

### Development
```typescript
// Use debug mode in development
if (__DEV__) {
  analytics().setAnalyticsCollectionEnabled(true);
  // View events in Firebase DebugView
}
```

### Staging
- Test all events in Firebase DebugView
- Verify Remote Config values update
- Test A/B test assignment logic

### Production
- Monitor event volume in Firebase Console
- Check for event errors (malformed events)
- Verify AdMob revenue tracking
- Review A/B test results weekly

---

## Implementation Checklist

### Phase 1: Setup ✅
- [ ] Create Firebase project
- [ ] Add iOS app configuration
- [ ] Add Android app configuration  
- [ ] Install npm dependencies
- [ ] Create `analytics.ts` utility
- [ ] Initialize Remote Config in App.tsx
- [ ] Test basic event in Firebase DebugView

### Phase 2: Core Tracking ✅
- [ ] Add screen tracking to all screens
- [ ] Track user authentication events
- [ ] Track song selection/completion
- [ ] Track mode switching
- [ ] Track settings changes
- [ ] Set user properties (tier, language)
- [ ] Verify events in Firebase Console

### Phase 3: Ad Tracking ✅
- [ ] Verify automatic AdMob tracking
- [ ] Add custom ad events (loaded, failed, dismissed)
- [ ] Track ad placements by format
- [ ] Monitor ad revenue in AdMob dashboard
- [ ] Check fill rates and eCPM

### Phase 4: A/B Testing ✅
- [ ] Set default Remote Config values
- [ ] Implement Remote Config in ad logic
- [ ] Create first A/B test in Console (modal frequency)
- [ ] Create second A/B test (history interval)
- [ ] Monitor test results
- [ ] Roll out winning variant

### Phase 5: Advanced ✅
- [ ] Add funnel tracking
- [ ] Add session duration tracking
- [ ] Add error tracking
- [ ] Create custom dashboards
- [ ] Set up weekly reports
- [ ] (Optional) Enable BigQuery export

---

## Cost Analysis

### Firebase (All Features)
**Cost**: $0 FREE

**Includes**:
- Unlimited events
- Unlimited users
- 14 months data retention
- Unlimited Remote Config fetches
- AdMob integration
- Basic reporting

**Optional Paid Features**:
- BigQuery export: ~$5/TB (only if needed for advanced SQL)
- Cloud Functions: Pay per execution (not needed for analytics)

### Alternative: Amplitude (For Comparison)
**Cost**: $0 (Free tier) or $49/mo (Growth)

**Free Tier Limits**:
- 10M events/month (plenty for early stage)
- 1 year data retention

**Growth Plan** ($49/mo):
- Unlimited events
- 2 years retention
- Advanced features (predictive, personas)

### Recommendation
**Start with Firebase (FREE)**, evaluate Amplitude if you need:
- Advanced cohort analysis
- Predictive analytics (churn prediction)
- More sophisticated retention curves
- Deeper user journey analysis

---

## Migration Path to Advanced Analytics

### When to Consider Amplitude/Mixpanel
Upgrade when you have:
1. **Budget** ($50-200/month)
2. **Scale** (10,000+ MAU)
3. **Analytics expertise** on team
4. **Need for advanced features**:
   - Cohort analysis
   - Predictive churn models
   - Complex funnel optimization
   - User journey mapping

### How to Migrate
Firebase + Amplitude can run in parallel:

```typescript
// Send events to both platforms
const trackEvent = async (name: string, params?: object) => {
  // Firebase (keep for AdMob)
  await analytics().logEvent(name, params);
  
  // Amplitude (add for advanced analytics)
  await amplitude.logEvent(name, params);
};
```

This allows you to:
- Keep AdMob revenue tracking in Firebase
- Get advanced analytics in Amplitude
- Compare platforms before committing

---

## Success Criteria

### Week 1 (Setup)
- ✅ Firebase project created
- ✅ Basic events tracking (10+ event types)
- ✅ Screen views tracking on all screens
- ✅ Events visible in Firebase Console

### Week 2 (Core Tracking)
- ✅ 50+ events per day
- ✅ User properties set correctly
- ✅ Ad impressions tracking automatically
- ✅ First funnel created (onboarding)

### Week 3 (A/B Testing)
- ✅ Remote Config values fetching
- ✅ First A/B test launched (modal frequency)
- ✅ Test results visible in Console
- ✅ 100+ users per variant

### Week 4 (Optimization)
- ✅ Winning A/B variant rolled out
- ✅ Ad revenue increased OR retention maintained
- ✅ Custom dashboards created
- ✅ Weekly reporting routine established

### Month 2+
- ✅ 5+ A/B tests completed
- ✅ Data-driven product decisions
- ✅ Optimized ad placements
- ✅ Clear understanding of user behavior

---

## Questions & Decisions

### 1. Analytics Opt-Out
**Question**: Should analytics be opt-in or opt-out?

**Recommendation**: Opt-out (enabled by default)
- Most apps do this
- Better data coverage
- Provide toggle in Settings
- Full disclosure in Privacy Policy

### 2. Event Naming Convention
**Question**: What naming convention for events?

**Recommendation**: snake_case with verb_noun pattern
- Examples: `song_selected`, `mode_switched`, `ad_clicked`
- Consistent with Firebase best practices
- Easy to read in dashboards

### 3. PII Collection
**Question**: Should we track user email or name?

**Recommendation**: NO - Don't track PII
- Use anonymous user IDs
- Track tier, language (non-PII properties)
- Better for privacy compliance
- Reduces risk

### 4. Development vs Production Events
**Question**: Should dev events go to production Firebase?

**Recommendation**: Use debug mode in dev
- Enable debug view in Firebase Console
- Events tagged as "debug"
- Don't pollute production data
- Easy to test without affecting metrics

---

## Next Steps

1. ✅ Review and approve proposal
2. Create Firebase project
3. Implement Phase 1 (setup + basic tracking)
4. Test events in DebugView
5. Deploy to production
6. Launch first A/B test
7. Review results weekly
8. Iterate based on data

---

## Resources

### Documentation
- [Firebase Analytics Docs](https://firebase.google.com/docs/analytics)
- [Remote Config Docs](https://firebase.google.com/docs/remote-config)
- [React Native Firebase](https://rnfirebase.io/)

### Tutorials
- [Getting Started with Firebase Analytics](https://firebase.google.com/docs/analytics/get-started?platform=ios)
- [A/B Testing with Remote Config](https://firebase.google.com/docs/remote-config/abtest-config)
- [BigQuery Export Guide](https://firebase.google.com/docs/analytics/bigquery-export)

### Tools
- [Firebase Console](https://console.firebase.google.com/)
- [DebugView](https://firebase.google.com/docs/analytics/debugview) - Test events in real-time
- [Event Builder](https://firebase.google.com/docs/analytics/events) - Plan your events

---

## Appendix: Complete Event Catalog

### Authentication Events
- `sign_up` - User registration
- `login` - User login
- `logout` - User logout

### Content Events
- `song_selected` - User taps a song
- `song_started` - Video playback begins
- `song_completed` - Video finishes
- `mode_switched` - Switch between Play/Study

### Engagement Events
- `screen_view` - User views a screen
- `session_start` - App opened
- `session_end` - App backgrounded

### Ad Events (Automatic)
- `ad_impression` - Ad shown
- `ad_click` - Ad clicked
- `ad_reward` - Rewarded ad completed

### Custom Ad Events
- `ad_shown` - Ad displayed with context
- `ad_interaction` - User dismissed/interacted

### Commerce Events
- `subscription_purchase` - User upgrades
- `subscription_cancelled` - User downgrades

### Learning Events
- `songs_learned` - Milestone reached
- `study_section_completed` - Section finished
- `feature_used` - New feature tried

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Status**: Proposed - Awaiting Approval

