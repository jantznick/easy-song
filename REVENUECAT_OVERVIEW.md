# RevenueCat Overview & Integration with Firebase

## Executive Summary

**RevenueCat** is a subscription management platform that handles in-app purchases, while **Firebase** handles analytics and A/B testing. They serve different purposes but work excellently together.

### Quick Comparison

| Feature | Firebase | RevenueCat | Recommendation |
|---------|----------|------------|----------------|
| **Primary Purpose** | Analytics & A/B Testing | Subscription Management | Use Both |
| **Cost** | Free (unlimited) | Free up to $2.5k MRR | Both free initially |
| **Event Tracking** | ✅ Comprehensive | ⚠️ Subscription-only | Firebase |
| **Ad Revenue Tracking** | ✅ AdMob native | ❌ No | Firebase |
| **Subscription Management** | ❌ Manual coding | ✅ Full platform | RevenueCat |
| **Receipt Validation** | ❌ You build it | ✅ Server-side | RevenueCat |
| **A/B Testing** | ✅ Remote Config | ✅ Paywall experiments | Both |
| **Cross-platform Subs** | ❌ Manual | ✅ Automatic | RevenueCat |

### Recommendation: Use Both Together
- **Firebase**: Analytics, ad tracking, general A/B testing, user behavior
- **RevenueCat**: Subscription management, paywall optimization, purchase tracking
- **Integration**: RevenueCat sends subscription events to Firebase automatically

---

## What is RevenueCat?

RevenueCat is a **subscription infrastructure platform** that handles all the complexity of in-app purchases across iOS and Android.

### Core Problem It Solves
Building subscription systems is hard:
- iOS uses StoreKit, Android uses Google Play Billing
- Receipt validation requires secure server infrastructure  
- Subscription status tracking is complex (renewals, cancellations, grace periods)
- Cross-platform purchases need manual syncing
- Promotional offers, trials, and pricing experiments are tedious

### What RevenueCat Provides
1. **Unified Purchase API** - One SDK for iOS & Android
2. **Server-side Receipt Validation** - Secure, automatic verification
3. **Subscription Status Management** - Real-time status across devices
4. **Cross-platform Subscriptions** - Buy on iOS, use on Android
5. **Webhooks** - Real-time subscription events to your backend
6. **Paywall A/B Testing** - Test pricing, trials, and offers
7. **Analytics Dashboard** - MRR, churn, LTV, conversion rates
8. **Integrations** - Send data to Firebase, Amplitude, Mixpanel, etc.

---

## Architecture: Firebase + RevenueCat Together

```
┌─────────────────────────────────────────────────────────┐
│                    Mobile App                           │
│                  (React Native)                         │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Firebase SDK                                │     │
│  │  ├─ Analytics (all events, screens, ads)     │     │
│  │  ├─ Remote Config (feature flags, A/B tests) │     │
│  │  └─ AdMob SDK (ad serving + tracking)        │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  RevenueCat SDK                              │     │
│  │  ├─ Purchase flow (iOS/Android)              │     │
│  │  ├─ Subscription status checking             │     │
│  │  └─ Paywall experiments                      │     │
│  └──────────────────────────────────────────────┘     │
│                                                         │
│  ┌──────────────────────────────────────────────┐     │
│  │  Your App Code                               │     │
│  │  └─ API calls to your backend                │     │
│  └──────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────┘
         │              │              │
         │              │              │ API calls
         │              │              │ (to your backend)
         │              │              ↓
         │              │         ┌─────────────────┐
         │              │         │  Your Backend   │
         │              │         │  (Express/Node) │
         │              │         │                 │
         │              │         │ - User data     │
         │              │         │ - Song data     │
         │              │         │ - History       │
         │              │         └─────────────────┘
         │              │                   ↑
         │              │                   │ Webhooks
         │              │                   │ (subscription events)
         ↓              ↓                   │
┌──────────────┐  ┌──────────────┐        │
│   Firebase   │  │  RevenueCat  │────────┘
│   Console    │  │   Server     │
│              │  │              │
│ - Analytics  │  │ - Receipts   │
│ - AdMob $    │  │ - Status     │
│ - A/B tests  │  │ - Webhooks   │
└──────────────┘  └──────────────┘
         ↑                   │
         │                   │
         └───────────────────┘
           RevenueCat → Firebase
           integration (automatic)
```

### Key Integration Point
RevenueCat automatically sends subscription events to Firebase Analytics:
- `subscription_started`
- `subscription_renewed` 
- `subscription_cancelled`
- `trial_started`
- `revenue` (with amounts)

This means you get **both**:
- RevenueCat's subscription dashboard (MRR, churn)
- Firebase's user journey analytics (how subscribers use the app)

---

## Detailed Feature Comparison

### 1. Subscription Management

#### Without RevenueCat (Manual)
```typescript
// You have to build all of this:
import * as InAppPurchases from 'expo-in-app-purchases';

// 1. Load products
const products = await InAppPurchases.getProductsAsync(['premium_monthly']);

// 2. Purchase
const result = await InAppPurchases.purchaseItemAsync('premium_monthly');

// 3. Validate receipt (requires backend!)
const response = await fetch('YOUR_BACKEND/validate-receipt', {
  method: 'POST',
  body: JSON.stringify({ receipt: result.receipt }),
});

// 4. Check subscription status (complex!)
const isActive = await checkIfSubscriptionActive(); // You build this

// 5. Handle renewals, grace periods, billing issues...
// 6. Sync across iOS/Android/Web...
// 7. Handle refunds, cancellations...
```

**Problems**:
- Must build secure receipt validation backend
- iOS and Android have different receipt formats
- Subscription status is complex (renewals, grace periods, billing retry)
- Cross-platform syncing is manual
- No protection against receipt fraud

#### With RevenueCat
```typescript
import Purchases from 'react-native-purchases';

// 1. Initialize once
await Purchases.configure({ apiKey: 'your_api_key' });

// 2. Load products
const offerings = await Purchases.getOfferings();

// 3. Purchase (RevenueCat handles everything)
const { customerInfo } = await Purchases.purchasePackage(
  offerings.current.monthly
);

// 4. Check subscription status (always accurate)
const customerInfo = await Purchases.getCustomerInfo();
const isPremium = customerInfo.entitlements.active['premium'] !== undefined;

// That's it! RevenueCat handles:
// - Receipt validation (server-side, secure)
// - Renewal tracking
// - Cross-platform syncing
// - Grace periods
// - Billing retries
// - Fraud protection
```

**Benefit**: ~2000 lines of code eliminated, plus secure backend infrastructure

---

### 2. Analytics & Tracking

#### Firebase Analytics
**Best for**: All user behavior, engagement, retention, ads

```typescript
// Track everything users do
trackEvent('song_selected', { videoId, mode });
trackEvent('study_mode_used', { duration });
trackScreen('settings');

// See in Firebase Console:
// - Daily active users
// - Session duration
// - Retention curves
// - Ad revenue
// - Feature usage
// - User journeys
```

#### RevenueCat Analytics
**Best for**: Subscription business metrics

- **MRR** (Monthly Recurring Revenue)
- **ARR** (Annual Recurring Revenue)
- **Churn Rate** (% subscribers cancelling)
- **LTV** (Lifetime Value per user)
- **Trial Conversion** (% trials → paid)
- **Refund Rate**
- **Revenue by Country**
- **Active Subscriptions**

### Combined Power
```typescript
// User purchases subscription via RevenueCat
const { customerInfo } = await Purchases.purchasePackage(package);

// RevenueCat automatically sends to Firebase:
// Event: 'subscription_started'
// Parameters: { product_id, price, currency }

// You also track in Firebase:
await trackEvent('subscription_purchase', {
  tier: 'PREMIUM',
  source: 'study_limit_reached',
  trial: true,
});

// Now you can answer:
// - What actions lead to purchases? (Firebase)
// - What's our MRR growth? (RevenueCat)
// - How do subscribers use the app differently? (Firebase)
// - What's our churn rate? (RevenueCat)
```

---

### 3. A/B Testing

#### Firebase Remote Config
**Best for**: Feature flags, UI experiments, ad frequency

```typescript
// Test ad frequency
const { modalFrequency } = getAdConfig();
// Control: 33%, Variant A: 50%

// Feature flags
const showNewOnboarding = isFeatureEnabled('new_onboarding_v2');

// UI variations
const buttonColor = getRemoteValue('cta_button_color').asString();
```

**Use cases**:
- Ad placement optimization
- Feature rollouts
- UI/UX experiments
- Content variations

#### RevenueCat Experiments
**Best for**: Paywall & pricing optimization

```typescript
// Test pricing
const offerings = await Purchases.getOfferings();

// RevenueCat automatically assigns user to experiment
// Control: $9.99/month
// Variant A: $7.99/month with 3-day trial
// Variant B: $11.99/month with 7-day trial

// Show paywall
const package = offerings.current?.monthly;

// Purchase
const { customerInfo } = await Purchases.purchasePackage(package);

// RevenueCat tracks which variant converted
```

**A/B test types**:
- **Pricing**: $9.99 vs $7.99 vs $11.99
- **Trial duration**: 3-day vs 7-day vs no trial
- **Billing period**: Monthly vs annual
- **Paywall design**: Different UI layouts
- **Free trial vs paid**: Immediate payment vs trial

### When to Use Which?

| What You're Testing | Use This |
|---------------------|----------|
| Ad frequency/placement | Firebase Remote Config |
| Feature on/off | Firebase Remote Config |
| UI changes | Firebase Remote Config |
| Subscription price | RevenueCat Experiments |
| Trial duration | RevenueCat Experiments |
| Paywall design + price | Both (Firebase for UI, RevenueCat for price) |

---

## Implementation Guide

### Phase 1: RevenueCat Setup (Week 1)

#### 1.1 Create RevenueCat Account
1. Go to [revenuecat.com](https://www.revenuecat.com)
2. Create account (free)
3. Create project: "Easy Song"

#### 1.2 Configure Apps
1. **iOS App**:
   - Add bundle ID: `com.easysong.mobile`
   - Connect to App Store Connect (Shared Secret)
   
2. **Android App**:
   - Add package name: `com.easysong.mobile`
   - Upload service account JSON from Google Play Console

#### 1.3 Create Entitlements & Products
**Entitlement**: "premium" (what users get access to)

**Products** (map to App Store/Play Store):
- `premium_monthly` → Premium Monthly ($9.99)
- `premium_annual` → Premium Annual ($79.99 - save 33%)

**Packages** (offerings to users):
```json
{
  "identifier": "default",
  "packages": [
    {
      "identifier": "monthly",
      "platform_product_identifier": "premium_monthly"
    },
    {
      "identifier": "annual",
      "platform_product_identifier": "premium_annual"
    }
  ]
}
```

#### 1.4 Install SDK
```bash
cd mobile
npm install react-native-purchases
```

**iOS Setup**:
```bash
cd ios && pod install
```

**Android Setup** (automatic with autolinking)

#### 1.5 Create Utility Module
Create `mobile/src/utils/subscriptions.ts`:

```typescript
import Purchases, { 
  CustomerInfo, 
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys (get from dashboard)
const API_KEYS = {
  ios: 'appl_XXXXXXXXXXXXX',
  android: 'goog_XXXXXXXXXXXXX',
};

/**
 * Initialize RevenueCat
 * Call this once on app startup
 */
export const initializeSubscriptions = async (userId?: string) => {
  try {
    // Configure SDK
    Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Set to INFO in production
    
    await Purchases.configure({
      apiKey: Platform.OS === 'ios' ? API_KEYS.ios : API_KEYS.android,
      appUserID: userId, // Optional: your user ID
    });
    
    console.log('RevenueCat initialized');
  } catch (error) {
    console.error('RevenueCat initialization error:', error);
  }
};

/**
 * Get current subscription status
 */
export const getSubscriptionStatus = async (): Promise<{
  isPremium: boolean;
  isPremiumPlus: boolean;
  expirationDate?: Date;
  willRenew: boolean;
}> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    
    const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
    const isPremiumPlus = customerInfo.entitlements.active['premium_plus'] !== undefined;
    
    const premiumEntitlement = customerInfo.entitlements.active['premium'];
    const expirationDate = premiumEntitlement?.expirationDate 
      ? new Date(premiumEntitlement.expirationDate) 
      : undefined;
    
    const willRenew = premiumEntitlement?.willRenew ?? false;
    
    return {
      isPremium: isPremium || isPremiumPlus,
      isPremiumPlus,
      expirationDate,
      willRenew,
    };
  } catch (error) {
    console.error('Get subscription status error:', error);
    return { isPremium: false, isPremiumPlus: false, willRenew: false };
  }
};

/**
 * Get available subscription offerings
 */
export const getOfferings = async (): Promise<PurchasesOffering | null> => {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Get offerings error:', error);
    return null;
  }
};

/**
 * Purchase a subscription package
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
  error?: string;
}> => {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    // Handle user cancellation gracefully
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    
    console.error('Purchase error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Restore purchases (for users who reinstall app)
 */
export const restorePurchases = async (): Promise<{
  success: boolean;
  customerInfo?: CustomerInfo;
}> => {
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { success: true, customerInfo };
  } catch (error) {
    console.error('Restore purchases error:', error);
    return { success: false };
  }
};

/**
 * Check if user is eligible for intro offer (trial)
 */
export const checkIntroEligibility = async (
  productIds: string[]
): Promise<Record<string, boolean>> => {
  try {
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility(
      productIds
    );
    
    // Convert to simple boolean map
    const result: Record<string, boolean> = {};
    for (const [productId, status] of Object.entries(eligibility)) {
      result[productId] = status.status === 'ELIGIBLE';
    }
    
    return result;
  } catch (error) {
    console.error('Check intro eligibility error:', error);
    return {};
  }
};

/**
 * Set up listener for subscription changes
 */
export const setupSubscriptionListener = (
  onUpdate: (customerInfo: CustomerInfo) => void
) => {
  Purchases.addCustomerInfoUpdateListener(onUpdate);
};
```

#### 1.6 Initialize in App
Update `mobile/App.tsx`:

```typescript
import { useEffect } from 'react';
import { initializeSubscriptions } from './src/utils/subscriptions';
import { initRemoteConfig } from './src/utils/analytics';

export default function App() {
  useEffect(() => {
    // Initialize both Firebase and RevenueCat
    const initializeApp = async () => {
      await initRemoteConfig(); // Firebase
      await initializeSubscriptions(); // RevenueCat
    };
    
    initializeApp();
  }, []);
  
  // ... rest of app
}
```

---

### Phase 2: Integrate with User Context (Week 1-2)

Update `mobile/src/contexts/UserContext.tsx`:

```typescript
import { setupSubscriptionListener, getSubscriptionStatus } from '../utils/subscriptions';

export const UserProvider = ({ children }) => {
  const [subscriptionStatus, setSubscriptionStatus] = useState({
    isPremium: false,
    isPremiumPlus: false,
    expirationDate: undefined,
    willRenew: false,
  });
  
  useEffect(() => {
    // Set up listener for subscription changes
    const unsubscribe = setupSubscriptionListener((customerInfo) => {
      console.log('Subscription updated:', customerInfo);
      refreshSubscriptionStatus();
    });
    
    return unsubscribe;
  }, []);
  
  const refreshSubscriptionStatus = async () => {
    const status = await getSubscriptionStatus();
    setSubscriptionStatus(status);
  };
  
  // Sync with your backend
  useEffect(() => {
    if (user && subscriptionStatus.isPremium) {
      // Update your backend with subscription status
      updateUserSubscription(user.id, {
        tier: subscriptionStatus.isPremiumPlus ? 'PREMIUM_PLUS' : 'PREMIUM',
        expiresAt: subscriptionStatus.expirationDate,
      });
    }
  }, [subscriptionStatus]);
  
  return (
    <UserContext.Provider value={{
      ...user,
      subscriptionStatus,
      refreshSubscriptionStatus,
    }}>
      {children}
    </UserContext.Provider>
  );
};
```

---

### Phase 3: Build Paywall Screen (Week 2)

Create `mobile/src/screens/PaywallScreen.tsx`:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getOfferings, purchasePackage } from '../utils/subscriptions';
import { trackEvent } from '../utils/analytics';
import type { PurchasesPackage } from 'react-native-purchases';

export default function PaywallScreen({ route, navigation }) {
  const { source } = route.params; // 'settings', 'study_limit', 'onboarding'
  
  const [offerings, setOfferings] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    loadOfferings();
    trackEvent('paywall_viewed', { source });
  }, []);
  
  const loadOfferings = async () => {
    const current = await getOfferings();
    setOfferings(current);
    // Pre-select annual (best value)
    setSelectedPackage(current?.annual ?? current?.monthly);
  };
  
  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setLoading(true);
    trackEvent('purchase_initiated', {
      package: selectedPackage.identifier,
      price: selectedPackage.product.priceString,
      source,
    });
    
    const result = await purchasePackage(selectedPackage);
    
    setLoading(false);
    
    if (result.success) {
      trackEvent('purchase_success', {
        package: selectedPackage.identifier,
        source,
      });
      
      // Show success screen or navigate back
      navigation.goBack();
    } else if (result.error !== 'cancelled') {
      trackEvent('purchase_failed', {
        error: result.error,
        source,
      });
      
      Alert.alert('Purchase Failed', result.error);
    }
  };
  
  if (!offerings) {
    return <ActivityIndicator />;
  }
  
  return (
    <View className="flex-1 bg-gray-900 p-6">
      {/* Header */}
      <Text className="text-3xl font-bold text-white text-center mb-2">
        Upgrade to Premium
      </Text>
      <Text className="text-gray-400 text-center mb-8">
        Unlock unlimited study mode and remove ads
      </Text>
      
      {/* Features */}
      <View className="bg-gray-800 rounded-xl p-6 mb-8">
        <Feature icon="✨" text="Unlimited Study Mode" />
        <Feature icon="🚫" text="Ad-Free Experience" />
        <Feature icon="📱" text="All Devices" />
        <Feature icon="🎯" text="Priority Support" />
      </View>
      
      {/* Pricing Options */}
      <View className="space-y-4 mb-8">
        {offerings.annual && (
          <PricingCard
            package={offerings.annual}
            selected={selectedPackage?.identifier === 'annual'}
            onSelect={() => setSelectedPackage(offerings.annual)}
            badge="BEST VALUE"
            savings="Save 33%"
          />
        )}
        
        {offerings.monthly && (
          <PricingCard
            package={offerings.monthly}
            selected={selectedPackage?.identifier === 'monthly'}
            onSelect={() => setSelectedPackage(offerings.monthly)}
          />
        )}
      </View>
      
      {/* CTA Button */}
      <TouchableOpacity
        onPress={handlePurchase}
        disabled={loading}
        className="bg-blue-500 rounded-xl p-4 mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">
            Start Free Trial
          </Text>
        )}
      </TouchableOpacity>
      
      {/* Restore Purchases */}
      <TouchableOpacity onPress={handleRestore}>
        <Text className="text-gray-400 text-center">
          Restore Purchases
        </Text>
      </TouchableOpacity>
      
      {/* Terms */}
      <Text className="text-gray-500 text-xs text-center mt-4">
        Free trial for 7 days, then {selectedPackage?.product.priceString}/
        {selectedPackage?.identifier}. Cancel anytime.
      </Text>
    </View>
  );
}

const Feature = ({ icon, text }) => (
  <View className="flex-row items-center mb-3">
    <Text className="text-2xl mr-3">{icon}</Text>
    <Text className="text-white text-lg">{text}</Text>
  </View>
);

const PricingCard = ({ package: pkg, selected, onSelect, badge, savings }) => (
  <TouchableOpacity
    onPress={onSelect}
    className={`border-2 rounded-xl p-4 ${
      selected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800'
    }`}
  >
    {badge && (
      <View className="bg-blue-500 rounded-full px-3 py-1 self-start mb-2">
        <Text className="text-white text-xs font-bold">{badge}</Text>
      </View>
    )}
    
    <View className="flex-row items-center justify-between">
      <View>
        <Text className="text-white text-xl font-bold">
          {pkg.product.priceString}
        </Text>
        <Text className="text-gray-400">
          per {pkg.identifier}
        </Text>
      </View>
      
      {savings && (
        <Text className="text-green-400 font-bold">{savings}</Text>
      )}
      
      <View className={`w-6 h-6 rounded-full border-2 ${
        selected ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
      }`}>
        {selected && <Text className="text-white text-center">✓</Text>}
      </View>
    </View>
  </TouchableOpacity>
);
```

---

### Phase 4: Backend Webhook Integration (Week 2-3)

RevenueCat sends webhooks for subscription events to your backend.

#### 4.1 Create Webhook Endpoint
Create `backend/src/routes/webhooks.ts`:

```typescript
import express from 'express';
import { prisma } from '../lib/prisma';

const router = express.Router();

/**
 * RevenueCat Webhook Handler
 * Receives subscription events in real-time
 */
router.post('/revenuecat', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('RevenueCat webhook:', event.type);
    
    const {
      type,
      app_user_id,
      product_id,
      purchased_at_ms,
      expiration_at_ms,
    } = event;
    
    // Map RevenueCat user ID to your user ID
    const user = await prisma.user.findUnique({
      where: { id: app_user_id },
    });
    
    if (!user) {
      console.error('User not found:', app_user_id);
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Handle different event types
    switch (type) {
      case 'INITIAL_PURCHASE':
        await handleInitialPurchase(user, event);
        break;
      
      case 'RENEWAL':
        await handleRenewal(user, event);
        break;
      
      case 'CANCELLATION':
        await handleCancellation(user, event);
        break;
      
      case 'EXPIRATION':
        await handleExpiration(user, event);
        break;
      
      case 'BILLING_ISSUE':
        await handleBillingIssue(user, event);
        break;
      
      default:
        console.log('Unhandled event type:', type);
    }
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const handleInitialPurchase = async (user: any, event: any) => {
  // Update user subscription in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: event.product_id.includes('annual') ? 'PREMIUM' : 'PREMIUM',
      subscriptionExpiresAt: new Date(event.expiration_at_ms),
      subscriptionStatus: 'ACTIVE',
    },
  });
  
  console.log(`User ${user.id} purchased ${event.product_id}`);
};

const handleRenewal = async (user: any, event: any) => {
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionExpiresAt: new Date(event.expiration_at_ms),
      subscriptionStatus: 'ACTIVE',
    },
  });
  
  console.log(`User ${user.id} subscription renewed`);
};

const handleCancellation = async (user: any, event: any) => {
  // Don't remove access immediately - wait for expiration
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'CANCELLED',
      // subscriptionExpiresAt remains same (access until expiration)
    },
  });
  
  console.log(`User ${user.id} cancelled subscription`);
};

const handleExpiration = async (user: any, event: any) => {
  // Subscription expired - remove access
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'EXPIRED',
    },
  });
  
  console.log(`User ${user.id} subscription expired`);
};

const handleBillingIssue = async (user: any, event: any) => {
  // Notify user of billing problem
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'BILLING_ISSUE',
    },
  });
  
  // TODO: Send email notification
  console.log(`User ${user.id} has billing issue`);
};

export default router;
```

#### 4.2 Register Webhook in App
Update `backend/src/index.ts`:

```typescript
import webhookRoutes from './routes/webhooks';

app.use('/webhooks', webhookRoutes);
```

#### 4.3 Configure in RevenueCat Dashboard
1. Go to RevenueCat Dashboard → Project Settings → Webhooks
2. Add webhook URL: `https://your-backend.com/webhooks/revenuecat`
3. Select events to receive:
   - Initial Purchase
   - Renewal
   - Cancellation
   - Expiration
   - Billing Issue

---

### Phase 5: Firebase Integration (Week 3)

RevenueCat automatically sends events to Firebase Analytics.

#### 5.1 Enable in RevenueCat Dashboard
1. Go to RevenueCat Dashboard → Integrations
2. Find "Firebase"
3. Click "Connect"
4. No SDK changes needed!

#### 5.2 Events Sent Automatically
RevenueCat → Firebase events:

| RevenueCat Event | Firebase Event | Parameters |
|------------------|----------------|------------|
| Initial Purchase | `rc_initial_purchase` | `product_id`, `price`, `currency` |
| Trial Started | `rc_trial_started` | `product_id` |
| Trial Converted | `rc_trial_converted` | `product_id` |
| Trial Cancelled | `rc_trial_cancelled` | `product_id` |
| Renewal | `rc_renewal` | `product_id`, `price` |
| Cancellation | `rc_cancellation` | `product_id` |

#### 5.3 Custom Tracking
You can also track custom events:

```typescript
import { trackEvent } from '../utils/analytics';

const handlePurchase = async () => {
  const result = await purchasePackage(selectedPackage);
  
  if (result.success) {
    // RevenueCat sends rc_initial_purchase automatically
    
    // You can add custom context
    trackEvent('premium_upgrade', {
      source: 'study_limit',
      package: selectedPackage.identifier,
      had_trial: true,
      days_since_install: daysSinceInstall,
    });
  }
};
```

---

## Cost Analysis

### RevenueCat Pricing

| Tier | Monthly Cost | Features | Limits |
|------|-------------|----------|--------|
| **Free** | $0 | Full features | Up to $2,500 MRR (tracked revenue) |
| **Starter** | Starts at $80/mo | Full features | $2,500 - $10k MRR |
| **Professional** | Custom pricing | + Advanced features | $10k+ MRR |

**Key Points**:
- Free tier covers you until $2,500/month subscription revenue
- At $9.99/month subscription: Free tier = ~250 paying subscribers
- If you reach this limit, you're making $2,500/mo and can afford $80/mo
- No per-transaction fees (unlike Stripe)

### Firebase (No Change)
**Cost**: $0 FREE (unlimited)

### Total Early Stage Cost
**$0** until you have 250 paying subscribers ($2,500 MRR)

### ROI Calculation
**Without RevenueCat**:
- 40-80 hours engineering time building subscription system
- $5,000 - $10,000 cost (if outsourced)
- Ongoing maintenance and bug fixes
- Security risks (receipt validation)

**With RevenueCat**:
- 4-8 hours integration time
- $0 until profitable
- Battle-tested infrastructure
- Automatic receipt validation

**Break-even**: Instantly (saves development time worth thousands)

---

## Decision Framework

### Use Firebase Analytics When:
✅ Tracking any user behavior (screen views, taps, engagement)  
✅ Monitoring ad performance (impressions, revenue)  
✅ A/B testing features, UI, ad placements  
✅ Building user funnels  
✅ Analyzing retention and engagement  

### Use RevenueCat When:
✅ Offering in-app subscriptions (monthly, annual)  
✅ Need cross-platform subscription status (iOS ↔ Android)  
✅ Want to avoid building receipt validation backend  
✅ Need subscription analytics (MRR, churn, LTV)  
✅ Planning to test pricing and trials  

### Use Both Together:
✅ **You want in-app subscriptions** (RevenueCat manages purchases)  
✅ **+ comprehensive analytics** (Firebase tracks everything)  
✅ **+ unified view** (RevenueCat sends subscription events to Firebase)  

### Skip RevenueCat If:
❌ You're only monetizing with ads (no subscriptions)  
❌ You're only using ads + Firebase already handles everything you need  
❌ You want to build subscription system yourself (not recommended)

---

## Recommendation for Easy Song

### Current Situation
From your `ANALYTICS_IMPLEMENTATION_PROPOSAL.md`:
- Using AdMob for ads
- Planning Firebase for analytics
- Have Premium/Premium Plus tiers in your database schema

### Recommended Setup: Firebase + RevenueCat

**Why?**
1. **You're already planning subscriptions** - Premium tiers exist in your schema
2. **RevenueCat saves weeks of development** - Don't build receipt validation
3. **Free until profitable** - $0 until $2,500 MRR
4. **Perfect integration** - RevenueCat → Firebase automatic events
5. **Future-proof** - Easy to add paywall experiments later

### Implementation Priority

**Week 1-2: Firebase Foundation** ✅
- Set up Firebase Analytics (from your existing proposal)
- Track screens, events, user properties
- Verify AdMob revenue tracking

**Week 3-4: Add RevenueCat** ⭐
- Integrate RevenueCat SDK
- Build paywall screen
- Test subscription flow
- Set up webhooks

**Week 5+: Optimize**
- Launch A/B tests in Firebase (ad frequency)
- Launch pricing experiments in RevenueCat (trial duration)
- Analyze combined data

### Architecture Summary

```
Mobile App
│
├─ Firebase SDK
│  ├─ Analytics: All events (songs, study, ads, engagement)
│  ├─ Remote Config: Feature flags, ad frequency A/B tests
│  └─ AdMob: Ad serving + revenue tracking
│
├─ RevenueCat SDK
│  ├─ Purchase flow: iOS/Android subscriptions
│  ├─ Status checking: Is user premium?
│  └─ Experiments: Pricing/trial A/B tests
│      └─ Sends events → Firebase (automatic)
│
└─ Your Backend API
   ├─ Song data
   ├─ User data
   └─ Webhooks: Receive subscription events from RevenueCat
```

---

## FAQ

### Q: Do I need both Firebase and RevenueCat?
**A**: If you're offering subscriptions, YES. They serve different purposes:
- Firebase = Analytics for everything
- RevenueCat = Subscription infrastructure

### Q: Can't I just use Firebase for subscriptions?
**A**: Firebase doesn't handle subscriptions. You'd have to:
- Use Expo In-App Purchases (manual coding)
- Build receipt validation backend (security risk)
- Track subscription status yourself (complex)
- Handle iOS and Android differences (painful)

RevenueCat does all of this for you.

### Q: What if I only do ads (no subscriptions)?
**A**: Then just use Firebase + AdMob. RevenueCat is specifically for in-app purchases.

### Q: Can I use RevenueCat without Firebase?
**A**: Yes, but you lose:
- Ad revenue tracking
- User engagement analytics
- Free analytics platform

Better to use both.

### Q: What about Stripe for subscriptions?
**A**: Stripe is for web subscriptions. For iOS/Android:
- Must use Apple App Store / Google Play Store
- Stripe doesn't work in mobile apps
- RevenueCat wraps App Store/Play Store APIs

### Q: RevenueCat vs building it myself?
**A**: 
- RevenueCat: 8 hours, $0 until $2,500 MRR, battle-tested
- DIY: 80 hours, $0 but costly bugs, security risks

Unless you love building payment infrastructure, use RevenueCat.

---

## Next Steps

### Immediate Actions
1. ✅ **Read and approve both proposals** (Firebase + RevenueCat)
2. Create Firebase project (Week 1)
3. Create RevenueCat account (Week 3)
4. Set up products in App Store Connect / Play Console (Week 3)

### Questions to Answer
1. **What subscription tiers?** 
   - Suggestion: Premium ($9.99/mo), Premium Plus ($14.99/mo or annual only)
   
2. **Free trial?**
   - Suggestion: Yes, 7-day free trial (standard for language apps)
   
3. **Annual discount?**
   - Suggestion: Yes, $79.99/year (33% savings, ~$7/mo)
   
4. **When to show paywall?**
   - Study mode limit reached (primary)
   - Settings → Upgrade (secondary)
   - After X songs (optional)

### Implementation Timeline

| Week | Focus | Tools |
|------|-------|-------|
| 1-2 | Firebase setup + core analytics | Firebase |
| 3-4 | RevenueCat integration + paywall | RevenueCat |
| 5-6 | Test subscriptions, fix bugs | Both |
| 7-8 | Launch A/B tests | Both |
| 9+ | Optimize based on data | Both |

---

## Summary

### The Winning Combination

```
Firebase Analytics        +        RevenueCat
     (Free)                        (Free until $2.5k MRR)
        │                                  │
        ├─ Track everything                ├─ Manage subscriptions
        ├─ Ad revenue (AdMob)              ├─ Handle purchases
        ├─ User engagement                 ├─ Receipt validation
        ├─ Retention curves                ├─ Cross-platform sync
        ├─ Feature A/B tests               ├─ Subscription analytics
        └─ Funnels & audiences             └─ Pricing experiments
                                                    │
                                                    ↓
                                            Sends events to
                                            Firebase (auto)
        ┌──────────────────────────────────────────┘
        ↓
    Complete view of:
    - How users engage (Firebase)
    - Why they subscribe (both)
    - How subscribers behave differently (Firebase with RC events)
    - What maximizes revenue (both platforms' experiments)
```

### Final Recommendation
✅ **Use Both**: Firebase for analytics + RevenueCat for subscriptions  
✅ **Cost**: $0 until you're making $2,500/month  
✅ **Time**: 2-3 weeks to implement both  
✅ **ROI**: Saves 60+ hours of development + ongoing maintenance  

This is the modern standard for mobile subscription apps. You get best-in-class tools for both areas without reinventing the wheel.

---

**Questions?** Let me know which parts you'd like me to expand on or clarify!

