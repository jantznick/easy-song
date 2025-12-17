# A/B Testing Custom Paywalls: Firebase + RevenueCat Integration

## TL;DR - Yes, You Can Do Everything You Want! 🎉

✅ **A/B test your custom paywall UIs** using Firebase Remote Config  
✅ **RevenueCat handles all subscription logic** (no paywall UI restrictions)  
✅ **RevenueCat automatically sends purchase events to Firebase**  
✅ **You track which paywall variants convert better** in Firebase Analytics  
✅ **Full control over design, testing, and optimization**  

---

## How The Integration Works

### Automatic Data Flow

```
Your Custom Paywall (A/B tested with Firebase)
    ↓
User taps purchase button
    ↓
RevenueCat SDK handles purchase
    ↓
┌──────────────────────────────────────────────┐
│ RevenueCat AUTOMATICALLY sends to Firebase:  │
│                                              │
│ Event: rc_initial_purchase                   │
│ Parameters:                                  │
│   - product_id: "premium_monthly"            │
│   - price: 9.99                              │
│   - currency: "USD"                          │
│   - period: "monthly"                        │
│   - intro_price: 0 (if trial)                │
└──────────────────────────────────────────────┘
    ↓
Firebase Analytics Dashboard
```

### What RevenueCat Sends Automatically

Once you enable the Firebase integration in RevenueCat dashboard:

| RevenueCat Event | Firebase Event | When It Fires |
|------------------|----------------|---------------|
| Initial Purchase | `rc_initial_purchase` | First time user subscribes |
| Trial Started | `rc_trial_started` | User starts free trial |
| Trial Converted | `rc_trial_converted` | Trial converts to paid |
| Trial Cancelled | `rc_trial_cancelled` | User cancels during trial |
| Renewal | `rc_renewal` | Subscription renews |
| Cancellation | `rc_cancellation` | User cancels subscription |
| Billing Issue | `rc_billing_issue` | Payment fails |

**Important:** These events have NO context about your paywall design or A/B test variants. RevenueCat only knows about the purchase itself, not how the user got there.

---

## Adding Your Custom Paywall Context

To track which paywall variant converted, you need to **add your own events** that include the variant information:

### Step 1: Track Paywall View with Variant

```typescript
// In PremiumBenefitsScreen.tsx

import { trackEvent } from '../utils/analytics';
import { getRemoteValue } from '../utils/analytics';

export default function PremiumBenefitsScreen({ route }: Props) {
  // Get A/B test variant from Firebase Remote Config
  const headlineVariant = getRemoteValue('paywall_headline_test')?.asString() ?? 'control';
  const showAnnualFirst = getRemoteValue('paywall_annual_first')?.asBoolean() ?? false;
  const pricePosition = getRemoteValue('paywall_price_position')?.asString() ?? 'top';

  useEffect(() => {
    // Track which paywall variant the user sees
    trackEvent('paywall_viewed', {
      source: route.params?.source || 'settings',
      headline_variant: headlineVariant,
      annual_first: showAnnualFirst,
      price_position: pricePosition,
      screen: 'premium_benefits',
    });
  }, []);

  // ... rest of component
}
```

### Step 2: Track Purchase Intent with Variant

```typescript
// In usePurchase.ts hook

export function usePurchase() {
  const makePurchase = async (options: PurchaseOptions) => {
    const { tier, billingPeriod, source, paywallVariant } = options; // Add paywallVariant

    // Track purchase attempt WITH paywall variant context
    trackEvent('purchase_initiated', {
      tier,
      billingPeriod,
      source,
      paywall_variant: paywallVariant, // YOUR custom context
    });

    // RevenueCat makes the purchase
    const result = await purchasePackage(packageToPurchase);
    
    if (result.success) {
      // Track success WITH paywall variant context
      trackEvent('purchase_success', {
        tier,
        billingPeriod,
        source,
        paywall_variant: paywallVariant, // YOUR custom context
        product_id: packageToPurchase.product.identifier,
        price: packageToPurchase.product.price,
      });
      
      // RevenueCat ALSO automatically sends 'rc_initial_purchase' to Firebase
      // (but without your custom variant info)
    }
    
    return result;
  };

  return { makePurchase };
}
```

### Step 3: Pass Variant Info When Purchasing

```typescript
// In PremiumBenefitsScreen.tsx

export default function PremiumBenefitsScreen({ route }: Props) {
  const headlineVariant = getRemoteValue('paywall_headline_test')?.asString() ?? 'control';
  
  const handlePurchase = async (tier, billingPeriod) => {
    const result = await makePurchase({
      tier,
      billingPeriod,
      source: route.params?.source || 'settings',
      paywallVariant: headlineVariant, // Include variant info
    });
  };

  return (
    <ScrollView>
      {/* Render different UI based on variant */}
      {headlineVariant === 'control' ? (
        <Text>Upgrade to Premium</Text>
      ) : (
        <Text>Unlock Your Learning Superpower!</Text>
      )}
      
      {/* Purchase button */}
      <TierCard onPurchase={handlePurchase} />
    </ScrollView>
  );
}
```

---

## Complete A/B Testing Example

### Example Test: Paywall Headline Copy

**Hypothesis:** Emotional headline converts better than functional headline

**Setup in Firebase Remote Config:**
```javascript
{
  "paywall_headline_test": {
    "control": "Upgrade to Premium", // 50% of users
    "variant_a": "Unlock Your Learning Superpower!", // 50% of users
  }
}
```

**Implementation:**

```typescript
// PremiumBenefitsScreen.tsx

import { trackEvent } from '../utils/analytics';
import { getRemoteValue } from '../utils/analytics';

export default function PremiumBenefitsScreen({ route }: Props) {
  const { t } = useTranslation();
  const headlineVariant = getRemoteValue('paywall_headline_test')?.asString() ?? 'control';
  
  // Define headline text based on variant
  const headline = headlineVariant === 'variant_a' 
    ? 'Unlock Your Learning Superpower!'
    : t('premium.heading'); // "Upgrade to Premium"

  useEffect(() => {
    // Track paywall view with variant
    trackEvent('paywall_viewed', {
      source: route.params?.source || 'settings',
      headline_variant: headlineVariant,
      screen: 'premium_benefits',
    });
  }, []);

  const handlePurchase = async (tier: string, billingPeriod: string) => {
    // Include variant in purchase tracking
    const result = await makePurchase({
      tier,
      billingPeriod,
      source: route.params?.source || 'settings',
      paywallVariant: headlineVariant,
    });
  };

  return (
    <ScrollView>
      {/* Use variant-specific headline */}
      <Text className="text-3xl font-bold text-center">
        {headline}
      </Text>
      
      <TierCard 
        onPurchase={(billingPeriod) => handlePurchase('premium', billingPeriod)}
      />
    </ScrollView>
  );
}
```

---

## Analyzing Results in Firebase

### View Conversion Funnel

**Firebase Console → Analytics → Funnels**

Create a funnel:
```
Step 1: paywall_viewed (where headline_variant = 'control')
Step 2: purchase_initiated (where headline_variant = 'control')
Step 3: purchase_success (where headline_variant = 'control')

Conversion: 3.2%
```

vs.

```
Step 1: paywall_viewed (where headline_variant = 'variant_a')
Step 2: purchase_initiated (where headline_variant = 'variant_a')
Step 3: purchase_success (where headline_variant = 'variant_a')

Conversion: 4.8%
```

**Result:** Variant A wins! 50% higher conversion rate.

### View Revenue by Variant

**Firebase Console → Analytics → Events → purchase_success**

Filter by parameter `paywall_variant`:

| Variant | Purchases | Total Revenue | Avg Revenue per View | Winner? |
|---------|-----------|---------------|---------------------|---------|
| control | 150 | $1,498.50 | $0.32 | ❌ |
| variant_a | 150 | $2,247.75 | $0.48 | ✅ |

**Insight:** Variant A generates 50% more revenue per paywall view!

### Cross-Reference with RevenueCat Events

You can also query both your custom events AND RevenueCat's automatic events:

**BigQuery SQL:**
```sql
-- Combine your custom tracking with RevenueCat's automatic events
SELECT 
  custom.paywall_variant,
  COUNT(DISTINCT custom.user_id) as views,
  COUNT(DISTINCT rc.user_id) as purchases,
  COUNT(DISTINCT rc.user_id) / COUNT(DISTINCT custom.user_id) as conversion_rate,
  SUM(rc.price) as total_revenue
FROM 
  (SELECT user_pseudo_id as user_id, 
          event_params.value.string_value as paywall_variant
   FROM `project.analytics_*.events_*`
   WHERE event_name = 'paywall_viewed') as custom
LEFT JOIN
  (SELECT user_pseudo_id as user_id,
          event_params.value.double_value as price
   FROM `project.analytics_*.events_*`
   WHERE event_name = 'rc_initial_purchase') as rc
  ON custom.user_id = rc.user_id
GROUP BY custom.paywall_variant
ORDER BY conversion_rate DESC
```

This gives you:
- Your custom paywall variant tracking (which UI they saw)
- RevenueCat's automatic purchase tracking (actual revenue)
- Complete picture of variant performance

---

## Multiple Simultaneous A/B Tests

You can test multiple things at once:

```typescript
// Get multiple A/B test variants
const headlineVariant = getRemoteValue('paywall_headline_test')?.asString() ?? 'control';
const showAnnualFirst = getRemoteValue('paywall_annual_first')?.asBoolean() ?? false;
const priceEmphasis = getRemoteValue('paywall_price_emphasis')?.asString() ?? 'monthly';
const showTestimonials = getRemoteValue('paywall_show_testimonials')?.asBoolean() ?? false;

// Track ALL variants
trackEvent('paywall_viewed', {
  source: 'settings',
  headline_variant: headlineVariant,
  annual_first: showAnnualFirst,
  price_emphasis: priceEmphasis,
  show_testimonials: showTestimonials,
});

// Render UI based on variants
return (
  <ScrollView>
    {/* Headline test */}
    <Text>{headlineVariant === 'control' ? 'Upgrade' : 'Unlock Superpower'}</Text>
    
    {/* Order test */}
    {showAnnualFirst ? (
      <>
        <TierCard tier="annual" />
        <TierCard tier="monthly" />
      </>
    ) : (
      <>
        <TierCard tier="monthly" />
        <TierCard tier="annual" />
      </>
    )}
    
    {/* Price emphasis test */}
    <Text className={priceEmphasis === 'large' ? 'text-6xl' : 'text-4xl'}>
      $9.99
    </Text>
    
    {/* Testimonials test */}
    {showTestimonials && (
      <View>
        <Text>"This app changed my life!" - User</Text>
      </View>
    )}
  </ScrollView>
);
```

Firebase will track all combinations:
- `control + monthly_first + small_price + no_testimonials`
- `variant_a + annual_first + large_price + testimonials`
- etc.

You can then analyze which **combination** converts best.

---

## A/B Test Ideas for Your Paywalls

### 1. Headline Copy Test
```typescript
const headline = getRemoteValue('paywall_headline')?.asString();

// Control: "Upgrade to Premium"
// Variant A: "Unlock Unlimited Learning"
// Variant B: "Learn Spanish Faster"
// Variant C: "Remove Ads & Learn More"
```

### 2. Price Display Test
```typescript
const priceDisplay = getRemoteValue('paywall_price_display')?.asString();

// Control: "$9.99/month"
// Variant A: "$9.99/month - Less than a coffee!"
// Variant B: "Only $9.99/month"
// Variant C: "$0.33/day"
```

### 3. Benefit Order Test
```typescript
const benefitOrder = getRemoteValue('paywall_benefit_order')?.asString();

// Control: [Unlimited Study, No Ads, History, Requests, Games]
// Variant A: [No Ads, Unlimited Study, History, Requests, Games]
// Variant B: [Unlimited Study, History, Requests, No Ads, Games]
```

### 4. Social Proof Test
```typescript
const showSocialProof = getRemoteValue('paywall_social_proof')?.asBoolean();

// Control: No social proof
// Variant A: "Join 10,000+ learners"
// Variant B: "4.8★ rated by students"
// Variant C: User testimonials
```

### 5. Urgency Test
```typescript
const showUrgency = getRemoteValue('paywall_urgency')?.asBoolean();

// Control: No urgency
// Variant A: "Limited time: First week free"
// Variant B: "Only 3 spots left at this price"
// Variant C: "Sale ends in 24 hours"
```

### 6. Monthly vs Annual Default
```typescript
const defaultPeriod = getRemoteValue('paywall_default_period')?.asString();

// Control: Monthly selected by default
// Variant A: Annual selected by default
```

### 7. Visual Layout Test
```typescript
const layout = getRemoteValue('paywall_layout')?.asString();

// Control: Vertical cards
// Variant A: Horizontal cards
// Variant B: Table comparison
// Variant C: Single highlighted option
```

### 8. CTA Button Text
```typescript
const ctaText = getRemoteValue('paywall_cta_text')?.asString();

// Control: "Upgrade to Premium"
// Variant A: "Start Free Trial"
// Variant B: "Unlock Now"
// Variant C: "Get Premium"
```

---

## Implementation Checklist

### ✅ Setup (One-time)
- [ ] Enable Firebase Integration in RevenueCat Dashboard
  - Go to RevenueCat Dashboard → Integrations → Firebase
  - Click "Connect"
  - No code changes needed
- [ ] Create Remote Config parameters in Firebase
  - e.g., `paywall_headline_test`, `paywall_annual_first`, etc.
- [ ] Define A/B test variants in Remote Config
  - Set control vs variant values
  - Set user percentage splits (50/50, 33/33/33, etc.)

### ✅ Code Changes
- [ ] Update `usePurchase.ts` to accept `paywallVariant` parameter
- [ ] Add `paywall_viewed` tracking with variant info
- [ ] Add `purchase_initiated` tracking with variant info
- [ ] Add `purchase_success` tracking with variant info
- [ ] Fetch Remote Config values in paywall components
- [ ] Render different UI based on variant values

### ✅ Testing
- [ ] Force Remote Config variant in debug mode
- [ ] Verify `paywall_viewed` event in Firebase DebugView
- [ ] Complete test purchase
- [ ] Verify both your custom events AND RevenueCat's `rc_*` events appear
- [ ] Confirm variant info is in your custom events

### ✅ Monitoring
- [ ] Create conversion funnel in Firebase for each variant
- [ ] Set up custom dashboard with conversion rates
- [ ] Monitor for 2-4 weeks (need statistical significance)
- [ ] Analyze results
- [ ] Roll out winning variant to 100%

---

## Example: Complete Integrated Flow

### 1. User Opens Paywall
```typescript
// Firebase Remote Config assigns user to variant
const headlineVariant = getRemoteValue('paywall_headline_test')?.asString(); 
// Returns: "variant_a" (user in test group)

// Track view
trackEvent('paywall_viewed', {
  source: 'study_limit',
  headline_variant: 'variant_a',
});
```

### 2. User Taps Purchase
```typescript
// Your code tracks attempt
trackEvent('purchase_initiated', {
  tier: 'premiumPlus',
  billingPeriod: 'annual',
  source: 'study_limit',
  paywall_variant: 'variant_a', // Your tracking
});

// RevenueCat processes purchase
const result = await purchasePackage(pkg);
```

### 3. Purchase Succeeds
```typescript
// Your code tracks success with context
trackEvent('purchase_success', {
  tier: 'premiumPlus',
  billingPeriod: 'annual',
  source: 'study_limit',
  paywall_variant: 'variant_a', // Your tracking
  price: 79.99,
});

// RevenueCat ALSO automatically tracks (no code needed)
// Firebase receives: 'rc_initial_purchase' event
// Parameters: { product_id, price, currency, period }
```

### 4. View in Firebase Analytics

**Your Custom Event:**
```
Event: purchase_success
Parameters:
  tier: "premiumPlus"
  billingPeriod: "annual"
  source: "study_limit"
  paywall_variant: "variant_a"  ← Your A/B test context
  price: 79.99
```

**RevenueCat's Automatic Event:**
```
Event: rc_initial_purchase
Parameters:
  product_id: "premium_plus_annual"
  price: 79.99
  currency: "USD"
  period: "P1Y"
  intro_price: 0
```

**Combined Insights:**
- Your event tells you: Which paywall variant converted
- RevenueCat's event tells you: Actual revenue and product details
- Together: Complete picture of variant performance and revenue

---

## Why This Approach is Powerful

### Full Control
✅ **Design Freedom** - Your UI, your rules  
✅ **Testing Freedom** - Test anything (copy, layout, colors, order)  
✅ **Analytics Freedom** - Track whatever matters to you  

### Best of Both Worlds
✅ **RevenueCat** - Handles complex subscription logic  
✅ **Firebase** - Tracks user behavior and experiments  
✅ **Your Paywalls** - Custom design optimized for your users  

### Data-Driven Optimization
✅ **See what works** - Compare conversion rates  
✅ **Understand why** - Track user journey through paywall  
✅ **Optimize continuously** - Test, learn, improve, repeat  

---

## What RevenueCat Paywall Components Give You (If You Want Them)

RevenueCat's pre-built paywall components (`RevenueCatUI`) offer:

**Built-in A/B Testing:**
- Test pricing in RevenueCat Dashboard (no code)
- Test paywall templates (limited options)
- RevenueCat tracks conversions automatically

**Limitations:**
- ❌ Generic designs (not your custom UI)
- ❌ Limited customization
- ❌ Can't test arbitrary UI changes
- ❌ Lose your beautiful paywalls

**Your Approach (Custom + Firebase + RevenueCat SDK):**
- ✅ Keep your custom designs
- ✅ Test anything you want
- ✅ Full analytics control
- ✅ RevenueCat still handles subscriptions

**Verdict:** Stick with your custom approach! You get more flexibility.

---

## Advanced: Multi-Armed Bandit Testing

Once you have data, implement dynamic variant selection:

```typescript
// Instead of 50/50 split, dynamically adjust based on performance
const getOptimalVariant = async () => {
  // Fetch conversion rates from your analytics
  const variants = [
    { id: 'control', conversionRate: 0.032 },
    { id: 'variant_a', conversionRate: 0.048 },
    { id: 'variant_b', conversionRate: 0.041 },
  ];
  
  // Weight variants by performance
  const weights = variants.map(v => v.conversionRate);
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  // Randomly select, but favor higher-performing variants
  const random = Math.random() * totalWeight;
  let sum = 0;
  
  for (let i = 0; i < variants.length; i++) {
    sum += weights[i];
    if (random <= sum) {
      return variants[i].id;
    }
  }
  
  return 'control';
};

// Show best-performing variant more often
const variant = await getOptimalVariant();
// Result: variant_a shown ~51% of time, variant_b shown ~43%, control shown ~6%
```

This maximizes revenue while still exploring new variants.

---

## Summary

### The Perfect Setup

```
┌─────────────────────────────────────────────┐
│          Firebase Remote Config             │
│   (A/B test: headlines, layouts, etc.)      │
│                                             │
│   Assigns user to variant: "variant_a"      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         Your Custom Paywall UI              │
│   (Render based on variant)                 │
│                                             │
│   Shows: "Unlock Your Learning Superpower!" │
└─────────────────────────────────────────────┘
                    ↓
         User taps purchase button
                    ↓
┌─────────────────────────────────────────────┐
│         Your Analytics Tracking             │
│   trackEvent('purchase_initiated', {        │
│     paywall_variant: 'variant_a'            │
│   })                                        │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         RevenueCat SDK                      │
│   (Handles subscription purchase)           │
│                                             │
│   Validates receipt, activates subscription │
└─────────────────────────────────────────────┘
                    ↓
         ┌─────────────────────┐
         │                     │
         ↓                     ↓
┌────────────────┐    ┌────────────────┐
│ Your Tracking  │    │ RevenueCat →   │
│                │    │ Firebase Auto  │
│ Event:         │    │                │
│ purchase_      │    │ Event:         │
│ success        │    │ rc_initial_    │
│                │    │ purchase       │
│ Params:        │    │                │
│ - variant: a   │    │ Params:        │
│ - source       │    │ - product_id   │
│ - tier         │    │ - price        │
│ - price        │    │ - currency     │
└────────────────┘    └────────────────┘
         │                     │
         └──────────┬──────────┘
                    ↓
         ┌────────────────────┐
         │ Firebase Analytics │
         │                    │
         │ Both events stored │
         │ Complete picture   │
         └────────────────────┘
                    ↓
         ┌────────────────────┐
         │ Your Dashboard     │
         │                    │
         │ Variant A: 4.8%    │
         │ Control: 3.2%      │
         │                    │
         │ Winner: Variant A! │
         └────────────────────┘
```

### Key Takeaways

1. ✅ **YES - A/B test your custom paywalls** with Firebase Remote Config
2. ✅ **YES - RevenueCat drives subscriptions** (no UI restrictions)
3. ✅ **YES - RevenueCat feeds into Firebase automatically** (purchase events)
4. ✅ **YES - You track which variants convert** (add your own events with variant context)
5. ✅ **BEST OF BOTH WORLDS** - Full design control + robust subscription infrastructure

**You don't have to choose between custom paywalls and RevenueCat. You get both!** 🎉

---

Want me to implement a specific A/B test in your paywall code to show you exactly how it works?

