# RevenueCat Paywall Options & Integration

## Your Current Situation

You have a **beautiful, custom-built paywall UI** in `PremiumBenefitsScreen.tsx` that shows:
- Two tiers (Premium and Premium Plus)
- Monthly/Annual toggle
- Benefits list with checkmarks
- Pricing display
- Purchase buttons

**BUT** it's not connected to actual purchases yet (line 199 has a TODO).

---

## RevenueCat Paywall Options

RevenueCat offers **THREE** approaches. You can choose the one that fits your needs:

### Option 1: Keep Your Custom UI + Use RevenueCat SDK (RECOMMENDED) ⭐

**What this means:**
- Keep your existing beautiful `PremiumBenefitsScreen.tsx` UI
- Just connect the purchase buttons to RevenueCat SDK
- RevenueCat handles all the backend complexity
- You maintain full design control

**Pros:**
✅ Keep your existing beautiful UI (no redesign needed)  
✅ Full control over design, layout, copy, colors  
✅ Your UI matches your brand perfectly  
✅ Easy to A/B test UI changes yourself  
✅ Custom logic for showing/hiding tiers based on user state  

**Cons:**
❌ You manually update prices if they change in App Store  
❌ You handle paywall analytics yourself (Firebase)  

**Implementation:**
```typescript
// In PremiumBenefitsScreen.tsx - Update handlePurchase function

import { getOfferings, purchasePackage } from '../utils/subscriptions';
import { trackEvent } from '../utils/analytics';

export default function PremiumBenefitsScreen({ route }: Props) {
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    const current = await getOfferings();
    setOfferings(current);
    
    // Optional: Update your UI with real prices from App Store
    // This ensures prices are always accurate
  };

  // REPLACE the handlePurchase function (line 198)
  const handlePurchase = async (tier: 'premium' | 'premiumPlus', billingPeriod: 'monthly' | 'annual') => {
    if (!offerings) return;

    setLoading(true);
    
    // Track paywall interaction
    trackEvent('paywall_purchase_tapped', {
      tier,
      billingPeriod,
      source: route.params?.source || 'settings',
    });

    // Get the right package
    let packageToPurchase;
    if (tier === 'premium' && billingPeriod === 'monthly') {
      packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === 'premium_monthly'
      );
    } else if (tier === 'premium' && billingPeriod === 'annual') {
      packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === 'premium_annual'
      );
    } else if (tier === 'premiumPlus' && billingPeriod === 'monthly') {
      packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === 'premium_plus_monthly'
      );
    } else if (tier === 'premiumPlus' && billingPeriod === 'annual') {
      packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === 'premium_plus_annual'
      );
    }

    if (!packageToPurchase) {
      Alert.alert('Error', 'Package not found');
      setLoading(false);
      return;
    }

    // Make the purchase via RevenueCat
    const result = await purchasePackage(packageToPurchase);
    
    setLoading(false);

    if (result.success) {
      trackEvent('purchase_success', { tier, billingPeriod });
      
      // Show success message
      setConfirmationModal({
        visible: true,
        title: t('premium.successTitle'),
        message: t('premium.successMessage'),
        type: 'success',
        onConfirm: () => {
          navigation.goBack();
        },
      });
    } else if (result.error !== 'cancelled') {
      trackEvent('purchase_failed', { tier, billingPeriod, error: result.error });
      
      Alert.alert('Purchase Failed', result.error || 'An error occurred');
    }
  };

  return (
    // ... your existing beautiful UI stays the same
  );
}
```

**What Changes:**
- Replace ~10 lines in the `handlePurchase` function
- Add `loadOfferings()` call on mount
- Everything else stays identical

**Result:**
- Your beautiful UI ✓
- Working purchases ✓
- RevenueCat handles receipt validation ✓
- Cross-platform subscription syncing ✓
- 5-10 minutes of work ✓

---

### Option 2: Use RevenueCat's Pre-Built Paywall Component

RevenueCat provides a drop-in paywall component called **RevenueCatUI**.

**What this means:**
- Replace your entire `PremiumBenefitsScreen.tsx` with RevenueCat's pre-built UI
- RevenueCat handles design, layout, and purchase logic
- Configure paywall design in RevenueCat dashboard (no code)

**Pros:**
✅ Zero paywall code to write  
✅ Built-in A/B testing for paywall design  
✅ Automatically updates with pricing changes  
✅ Pre-optimized conversion best practices  
✅ Multi-language support built-in  

**Cons:**
❌ **LOSE your beautiful custom design**  
❌ Limited customization (colors, fonts only)  
❌ Generic "app store" look and feel  
❌ Less brand differentiation  
❌ RevenueCat decides layout  

**Implementation:**
```typescript
// REPLACE PremiumBenefitsScreen.tsx entirely

import { RevenueCatUI } from 'react-native-purchases-ui';

export default function PremiumBenefitsScreen({ route }: Props) {
  return (
    <RevenueCatUI
      // RevenueCat handles everything
      onPurchaseCompleted={() => navigation.goBack()}
      onRestoreCompleted={() => navigation.goBack()}
    />
  );
}
```

**What You Lose:**
- Your custom two-tier card layout
- Your monthly/annual toggle UI
- Your benefit list styling
- Your brand-specific design

**What You Get:**
- A generic but functional paywall
- Less code to maintain
- Built-in experiments

**My Opinion:** 😕 NOT RECOMMENDED for you because:
- Your custom UI is **already built and beautiful**
- RevenueCat's UI is generic and less polished
- You lose brand differentiation

---

### Option 3: Hybrid Approach (Custom UI + RevenueCat Experiments)

**What this means:**
- Keep your custom UI (Option 1)
- Use RevenueCat Remote Config to A/B test pricing
- Use Firebase Remote Config to A/B test UI variations

**Pros:**
✅ Keep your custom UI  
✅ Working purchases via RevenueCat SDK  
✅ Can experiment with pricing (RevenueCat)  
✅ Can experiment with UI (Firebase)  
✅ Best of both worlds  

**Cons:**
❌ Slightly more complex setup  
❌ Need to coordinate two A/B testing platforms  

**Implementation:**
```typescript
// In PremiumBenefitsScreen.tsx

import { getOfferings, purchasePackage } from '../utils/subscriptions';
import { getRemoteValue } from '../utils/analytics';

export default function PremiumBenefitsScreen({ route }: Props) {
  const [offerings, setOfferings] = useState(null);
  
  // Get A/B test variants from Firebase
  const showAnnualFirst = getRemoteValue('paywall_annual_first')?.asBoolean() ?? false;
  const showSavingsBadge = getRemoteValue('paywall_show_savings')?.asBoolean() ?? true;
  const ctaText = getRemoteValue('paywall_cta_text')?.asString() ?? t('premium.premium.purchase');

  useEffect(() => {
    loadOfferings();
    
    // Track which paywall variant user sees
    trackEvent('paywall_viewed', {
      source: route.params?.source,
      variant: showAnnualFirst ? 'annual_first' : 'monthly_first',
    });
  }, []);

  const loadOfferings = async () => {
    // RevenueCat handles pricing experiments
    const current = await getOfferings();
    setOfferings(current);
    
    // Prices might be different for different users (RevenueCat A/B test)
  };

  return (
    <ScrollView>
      {/* Your custom UI, but with A/B test variations */}
      
      {/* Order cards based on A/B test */}
      {showAnnualFirst ? (
        <>
          <TierCard {...premiumAnnualProps} />
          <TierCard {...premiumMonthlyProps} />
        </>
      ) : (
        <>
          <TierCard {...premiumMonthlyProps} />
          <TierCard {...premiumAnnualProps} />
        </>
      )}
    </ScrollView>
  );
}
```

**Result:**
- Your UI with smart A/B testing
- Test both pricing (RevenueCat) and design (Firebase)
- Maximum optimization potential

---

## Detailed Comparison

| Feature | Option 1: Custom UI + SDK | Option 2: RevenueCat UI | Option 3: Hybrid |
|---------|---------------------------|-------------------------|------------------|
| **Your Custom Design** | ✅ Keep it | ❌ Lose it | ✅ Keep it |
| **Implementation Time** | 10 minutes | 5 minutes | 30 minutes |
| **Working Purchases** | ✅ | ✅ | ✅ |
| **Receipt Validation** | ✅ (RevenueCat) | ✅ (RevenueCat) | ✅ (RevenueCat) |
| **Price A/B Testing** | Manual | ✅ Built-in | ✅ Built-in |
| **UI A/B Testing** | Manual (Firebase) | ✅ Built-in | ✅ (Firebase) |
| **Design Control** | ✅ 100% | ❌ ~20% | ✅ 100% |
| **Brand Consistency** | ✅ | ❌ | ✅ |
| **Code Maintenance** | Low | None | Medium |

---

## Step-by-Step: Integrating Your Existing UI (Option 1)

Here's exactly what to change in your existing code:

### Step 1: Update TierCard Component

```typescript
// In PremiumBenefitsScreen.tsx

function TierCard({ 
  title, 
  monthlyPrice, 
  monthlyPeriod, 
  annualPrice, 
  annualPeriod, 
  annualTotal,
  annualBilling,
  purchaseText,
  benefits, 
  isHighlighted = false,
  onPurchase,
  loading = false,  // ADD THIS
}: TierCardProps) {
  const [isAnnual, setIsAnnual] = useState(false);
  
  return (
    <View>
      {/* ... existing UI ... */}
      
      {/* Update Purchase Button to show loading state */}
      <TouchableOpacity
        onPress={() => onPurchase(isAnnual ? 'annual' : 'monthly')}  // PASS billing period
        disabled={loading}  // DISABLE when loading
        className="bg-primary rounded-xl py-5 items-center"
        activeOpacity={0.8}
      >
        {loading ? (  // ADD loading indicator
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">
            {purchaseText}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
```

### Step 2: Update Main Screen Component

```typescript
// In PremiumBenefitsScreen.tsx (replace entire function)

import { useState, useEffect } from 'react';
import { Alert, ActivityIndicator } from 'react-native';
import { getOfferings, purchasePackage } from '../utils/subscriptions';
import { trackEvent } from '../utils/analytics';

export default function PremiumBenefitsScreen({ route }: Props) {
  const navigation = useNavigation();
  const theme = useThemeClasses();
  const { t } = useTranslation();
  
  // Add new state
  const [offerings, setOfferings] = useState(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [confirmationModal, setConfirmationModal] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'default' as const,
    onConfirm: undefined as (() => void) | undefined,
  });

  // Load offerings on mount
  useEffect(() => {
    loadOfferings();
    trackEvent('paywall_viewed', {
      source: route.params?.source || 'settings',
    });
  }, []);

  const loadOfferings = async () => {
    try {
      const current = await getOfferings();
      setOfferings(current);
      
      if (!current) {
        Alert.alert('Error', 'Unable to load subscription options. Please try again.');
      }
    } catch (error) {
      console.error('Load offerings error:', error);
      Alert.alert('Error', 'Unable to load subscription options.');
    }
  };

  // REPLACE the handlePurchase function
  const handlePurchase = async (
    tier: 'premium' | 'premiumPlus',
    billingPeriod: 'monthly' | 'annual'
  ) => {
    if (!offerings) {
      Alert.alert('Error', 'Subscription options not loaded yet.');
      return;
    }

    setLoadingTier(`${tier}_${billingPeriod}`);
    
    trackEvent('paywall_purchase_initiated', {
      tier,
      billingPeriod,
      source: route.params?.source || 'settings',
    });

    try {
      // Map to RevenueCat package identifiers
      const packageId = `${tier === 'premium' ? 'premium' : 'premium_plus'}_${billingPeriod}`;
      const packageToPurchase = offerings.availablePackages.find(
        pkg => pkg.identifier === packageId
      );

      if (!packageToPurchase) {
        throw new Error(`Package ${packageId} not found`);
      }

      // Make the purchase
      const result = await purchasePackage(packageToPurchase);
      
      setLoadingTier(null);

      if (result.success) {
        trackEvent('purchase_success', {
          tier,
          billingPeriod,
          product_id: packageToPurchase.product.identifier,
          price: packageToPurchase.product.price,
        });
        
        // Show success message
        setConfirmationModal({
          visible: true,
          title: t('premium.successTitle') || 'Welcome to Premium!',
          message: t('premium.successMessage') || 'Your subscription is now active. Enjoy!',
          type: 'success',
          onConfirm: () => {
            setConfirmationModal(prev => ({ ...prev, visible: false }));
            navigation.goBack();
          },
        });
      } else if (result.error !== 'cancelled') {
        throw new Error(result.error || 'Unknown error');
      } else {
        // User cancelled - just track it
        trackEvent('purchase_cancelled', { tier, billingPeriod });
      }
    } catch (error: any) {
      setLoadingTier(null);
      
      trackEvent('purchase_failed', {
        tier,
        billingPeriod,
        error: error.message,
      });
      
      Alert.alert(
        'Purchase Failed',
        error.message || 'An error occurred. Please try again.'
      );
    }
  };

  // Keep your existing benefits arrays
  const premiumBenefits = [
    { text: t('premium.premium.benefits.history') },
    { text: t('premium.premium.benefits.studyMode') },
    { text: t('premium.premium.benefits.games'), isComingSoon: true },
    { text: t('premium.premium.benefits.requests') },
    { text: t('premium.premium.benefits.noAds') },
  ];

  const premiumPlusBenefits = [
    { text: t('premium.premiumPlus.benefits.history') },
    { text: t('premium.premiumPlus.benefits.studyMode') },
    { text: t('premium.premiumPlus.benefits.games'), isComingSoon: true },
    { text: t('premium.premiumPlus.benefits.requests') },
    { text: t('premium.premiumPlus.benefits.noAds') },
  ];

  // Show loading state while offerings load
  if (!offerings) {
    return (
      <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' mt-4'}>
            Loading subscription options...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={theme.bg('bg-background', 'bg-[#0F172A]')} style={{ flex: 1 }}>
      {/* Keep your existing header */}
      <View className={theme.bg('bg-surface', 'bg-[#1E293B]') + ' ' + theme.border('border-border', 'border-[#334155]') + ' border-b px-5 py-4 flex-row items-center'}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mr-4"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-2xl'}>←</Text>
        </TouchableOpacity>
        <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-lg font-semibold flex-1'}>
          {t('premium.title')}
        </Text>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 20, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Keep your existing heading */}
        <View className="items-center mb-6">
          <Text className={theme.text('text-text-primary', 'text-[#F1F5F9]') + ' text-3xl font-bold mb-2 text-center'}>
            {t('premium.heading')}
          </Text>
          <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base text-center px-4'}>
            {t('premium.description')}
          </Text>
        </View>

        {/* Update TierCard calls */}
        <TierCard
          title={t('premium.premium.title')}
          monthlyPrice={t('premium.premium.monthlyPrice')}
          monthlyPeriod={t('premium.premium.monthlyPeriod')}
          annualPrice={t('premium.premium.annualPrice')}
          annualPeriod={t('premium.premium.annualPeriod')}
          annualTotal={t('premium.premium.annualTotal')}
          annualBilling={t('premium.premium.annualBilling')}
          purchaseText={t('premium.premium.purchase')}
          benefits={premiumBenefits}
          loading={loadingTier?.startsWith('premium_')}
          onPurchase={(billingPeriod) => handlePurchase('premium', billingPeriod)}
        />

        <TierCard
          title={t('premium.premiumPlus.title')}
          monthlyPrice={t('premium.premiumPlus.monthlyPrice')}
          monthlyPeriod={t('premium.premiumPlus.monthlyPeriod')}
          annualPrice={t('premium.premiumPlus.annualPrice')}
          annualPeriod={t('premium.premiumPlus.annualPeriod')}
          annualTotal={t('premium.premiumPlus.annualTotal')}
          annualBilling={t('premium.premiumPlus.annualBilling')}
          purchaseText={t('premium.premiumPlus.purchase')}
          benefits={premiumPlusBenefits}
          isHighlighted={true}
          loading={loadingTier?.startsWith('premiumPlus_')}
          onPurchase={(billingPeriod) => handlePurchase('premiumPlus', billingPeriod)}
        />
      </ScrollView>

      {/* Keep your existing modal */}
      <ConfirmationModal
        visible={confirmationModal.visible}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmText={t('common.confirm')}
        cancelText={t('common.cancel')}
        onConfirm={() => {
          if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm();
          }
          setConfirmationModal({ ...confirmationModal, visible: false });
        }}
        onCancel={() => setConfirmationModal({ ...confirmationModal, visible: false })}
      />
    </SafeAreaView>
  );
}
```

### Step 3: Configure Products in RevenueCat

In RevenueCat Dashboard, create these product identifiers:

```
Entitlements:
- "premium" (what users get)
- "premium_plus" (what premium plus users get)

Products (must match App Store/Play Store):
- premium_monthly → com.easysong.premium.monthly
- premium_annual → com.easysong.premium.annual
- premium_plus_monthly → com.easysong.premiumplus.monthly
- premium_plus_annual → com.easysong.premiumplus.annual

Packages (for easy access):
- premium_monthly
- premium_annual
- premium_plus_monthly
- premium_plus_annual
```

### Step 4: Add Restore Purchases Button (Optional)

```typescript
// Add to PremiumBenefitsScreen after the ScrollView

import { restorePurchases } from '../utils/subscriptions';

// Inside component:
const [restoring, setRestoring] = useState(false);

const handleRestore = async () => {
  setRestoring(true);
  
  const result = await restorePurchases();
  
  setRestoring(false);
  
  if (result.success) {
    Alert.alert('Success', 'Your purchases have been restored!');
    navigation.goBack();
  } else {
    Alert.alert('No Purchases Found', 'No active subscriptions found.');
  }
};

// Add button above the modal:
<TouchableOpacity
  onPress={handleRestore}
  disabled={restoring}
  className="py-4 items-center"
>
  {restoring ? (
    <ActivityIndicator color="#6366F1" />
  ) : (
    <Text className={theme.text('text-text-secondary', 'text-[#94A3B8]') + ' text-base'}>
      Restore Purchases
    </Text>
  )}
</TouchableOpacity>
```

---

## What Happens Behind the Scenes

When user taps purchase button:

```
1. User taps "Purchase Premium" button
   └─> Your handlePurchase() function called
   
2. RevenueCat SDK calls iOS/Android purchase API
   └─> Native purchase dialog appears
   
3. User enters password/biometric
   └─> Apple/Google processes payment
   
4. Receipt generated
   └─> RevenueCat validates receipt (server-side, secure)
   
5. RevenueCat webhook to your backend
   └─> Your backend updates user.subscriptionTier = 'PREMIUM'
   
6. RevenueCat sends event to Firebase
   └─> Firebase tracks 'rc_initial_purchase'
   
7. Your app receives purchase confirmation
   └─> Show success modal, navigate back
   
8. User now has premium access!
   └─> No ads, unlimited study mode ✨
```

**You write:** ~50 lines of code  
**RevenueCat handles:** ~2000 lines of complexity

---

## My Recommendation for Easy Song

### ⭐ Use Option 1: Keep Your Custom UI + RevenueCat SDK

**Why:**
1. ✅ **Your UI is beautiful** - Keep it! It matches your brand
2. ✅ **Already built** - Just connect purchase logic (~30 minutes work)
3. ✅ **Full control** - Design it exactly how you want
4. ✅ **RevenueCat handles the hard part** - Receipt validation, renewals, cross-platform
5. ✅ **Easy to iterate** - Change UI anytime without waiting for RevenueCat

**Don't Use Option 2** (RevenueCat's pre-built UI) because:
- ❌ You'd throw away your beautiful custom design
- ❌ Generic look that doesn't match your brand
- ❌ You already did the hard work!

**Save Option 3** (Hybrid) for later:
- Use it when you're ready for advanced pricing experiments
- For now, just get purchases working

---

## Implementation Timeline

**Today (30 minutes):**
1. Add RevenueCat SDK imports to `PremiumBenefitsScreen.tsx`
2. Replace `handlePurchase` function
3. Add `loadOfferings()` call
4. Add loading states

**Tomorrow (1 hour):**
1. Create products in App Store Connect / Play Console
2. Configure products in RevenueCat dashboard
3. Test purchase flow in sandbox

**Day 3 (30 minutes):**
1. Test on real device
2. Verify webhook to your backend
3. Verify subscription status updates

**Done!** 🎉

---

## Common Questions

### Q: Can I use the prices from my translation files?
**A**: Yes for display, but RevenueCat will provide the actual App Store prices:

```typescript
const loadOfferings = async () => {
  const current = await getOfferings();
  setOfferings(current);
  
  // Optional: Use real prices from App Store instead of hardcoded
  const premiumMonthlyPrice = current?.availablePackages
    .find(pkg => pkg.identifier === 'premium_monthly')
    ?.product.priceString; // e.g. "$9.99"
  
  // You can update your UI with real prices
  // This ensures prices match App Store exactly
};
```

### Q: What about the monthly/annual toggle?
**A**: Keep it! Just pass the billing period to `handlePurchase`:

```typescript
const [isAnnual, setIsAnnual] = useState(false);

// When purchase button tapped:
onPurchase={() => handlePurchase('premium', isAnnual ? 'annual' : 'monthly')}
```

### Q: Do I need to change my benefits list?
**A**: No! Keep your benefits exactly as they are. They're perfect.

### Q: What if user is already subscribed?
**A**: Check subscription status and hide purchase buttons:

```typescript
import { useUser } from '../contexts/UserContext';

export default function PremiumBenefitsScreen() {
  const { user } = useUser();
  
  const isAlreadyPremium = user?.subscriptionTier !== 'FREE';
  
  if (isAlreadyPremium) {
    return (
      <View>
        <Text>You're already a premium member! 🎉</Text>
        <Button onPress={() => navigation.goBack()}>
          Go Back
        </Button>
      </View>
    );
  }
  
  // ... show paywall
}
```

### Q: Can I still A/B test my UI?
**A**: Yes! Use Firebase Remote Config:

```typescript
// Test different headline copy
const headlineText = getRemoteValue('paywall_headline')?.asString() 
  ?? t('premium.heading');

// Test showing/hiding certain benefits
const showGamesFeature = getRemoteValue('paywall_show_games')?.asBoolean() 
  ?? true;
```

---

## Summary

**What You Keep:**
- ✅ Your beautiful two-tier card layout
- ✅ Your monthly/annual toggle
- ✅ Your benefits list styling  
- ✅ Your brand colors and design
- ✅ Full control over UI

**What RevenueCat Handles:**
- ✅ Purchase flow (iOS & Android)
- ✅ Receipt validation (secure)
- ✅ Subscription status tracking
- ✅ Renewals, cancellations, refunds
- ✅ Cross-platform syncing
- ✅ Webhook events to your backend

**What You Change:**
- ~50 lines in `PremiumBenefitsScreen.tsx`
- Connect buttons to RevenueCat SDK
- Add loading states
- That's it!

**Result:**
Your beautiful paywall that actually works! 🚀

---

Need help with the implementation? Let me know and I can update your `PremiumBenefitsScreen.tsx` file directly!

