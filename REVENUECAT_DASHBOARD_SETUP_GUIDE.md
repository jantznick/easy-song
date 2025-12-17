# RevenueCat Dashboard Setup Guide

## Complete Step-by-Step Guide to Configure RevenueCat Web Interface

This guide walks you through every step in the RevenueCat web dashboard to get your subscription system ready.

**Time Required:** 30-45 minutes (one-time setup)

---

## Part 1: Account & Project Setup

### Step 1: Create RevenueCat Account

1. Go to [https://www.revenuecat.com/](https://www.revenuecat.com/)
2. Click **"Get Started Free"** or **"Sign Up"**
3. Sign up with:
   - Email (recommended for work)
   - Or Google/GitHub SSO
4. Verify your email address

### Step 2: Create a New Project

1. After logging in, you'll see the dashboard
2. Click **"Create New Project"** (or click the dropdown if you have existing projects)
3. Enter project details:
   - **Project Name:** `Easy Song` (or your preferred name)
   - **Platform:** Select **"Mobile"**
4. Click **"Create Project"**

**Result:** You now have a RevenueCat project!

---

## Part 2: Add Your Apps

You need to add both iOS and Android apps to your project.

### Step 3: Add iOS App

1. In your project dashboard, click **"Apps"** in the left sidebar
2. Click **"+ New"** button (top right)
3. Select **"iOS"** as the platform
4. Fill in the details:
   - **App Name:** `Easy Song iOS` (display name in RevenueCat)
   - **Bundle ID:** `com.easysong.mobile` (must match your Expo app.json)
     - Find this in `/mobile/app.json` under `expo.ios.bundleIdentifier`
5. Click **"Save"**

**You'll see:** "Connect to App Store Connect" section (we'll do this next)

### Step 4: Add Android App

1. Still in **"Apps"** section, click **"+ New"** again
2. Select **"Android"** as the platform
3. Fill in the details:
   - **App Name:** `Easy Song Android`
   - **Package Name:** `com.easysong.mobile` (must match your Expo app.json)
     - Find this in `/mobile/app.json` under `expo.android.package`
4. Click **"Save"**

**Result:** You now have both iOS and Android apps configured!

---

## Part 3: Connect to App Stores

Before creating products in RevenueCat, you need to create them in App Store Connect and Google Play Console, then connect RevenueCat to these stores.

### Step 5: Create Products in App Store Connect (iOS)

**Before doing this step, you must have:**
- ✅ An Apple Developer account ($99/year)
- ✅ Your app created in App Store Connect

**Steps in App Store Connect:**

1. Go to [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
2. Navigate to **My Apps** → Select your app (or create it if you haven't)
3. Go to **Features** → **In-App Purchases**
4. Click **"+"** to create a new in-app purchase
5. Select **"Auto-Renewable Subscription"**

**Create these 4 subscription products:**

#### Product 1: Premium Monthly
```
Reference Name: Premium Monthly
Product ID: com.easysong.premium.monthly (IMPORTANT: write this down!)
Subscription Group: Premium (create new group if needed)

Subscription Duration: 1 Month
Price: $9.99 (or your preferred price)

Localization (English):
- Display Name: Premium Monthly
- Description: Monthly subscription to Easy Song Premium

Review Information:
- Screenshot: (add a screenshot of your app)
- Review Notes: Monthly subscription for premium features
```

#### Product 2: Premium Annual
```
Reference Name: Premium Annual
Product ID: com.easysong.premium.annual (IMPORTANT: write this down!)
Subscription Group: Premium

Subscription Duration: 1 Year
Price: $79.99 (or your preferred price - typically 17-33% discount)

Localization (English):
- Display Name: Premium Annual
- Description: Annual subscription to Easy Song Premium (save 33%!)
```

#### Product 3: Premium Plus Monthly
```
Reference Name: Premium Plus Monthly
Product ID: com.easysong.premiumplus.monthly (IMPORTANT: write this down!)
Subscription Group: Premium Plus (create new group)

Subscription Duration: 1 Month
Price: $14.99 (or your preferred price)

Localization (English):
- Display Name: Premium Plus Monthly
- Description: Monthly subscription to Easy Song Premium Plus
```

#### Product 4: Premium Plus Annual
```
Reference Name: Premium Plus Annual
Product ID: com.easysong.premiumplus.annual (IMPORTANT: write this down!)
Subscription Group: Premium Plus

Subscription Duration: 1 Year
Price: $119.99 (or your preferred price)

Localization (English):
- Display Name: Premium Plus Annual
- Description: Annual subscription to Easy Song Premium Plus (save 33%!)
```

**Optional: Add Free Trial**

For each product, you can add a free trial:
1. Click on the subscription
2. Scroll to **"Subscription Prices"**
3. Click **"Add Introductory Offer"**
4. Select **"Free Trial"**
5. Set duration: **7 days** (recommended)
6. Eligibility: **New Subscribers Only**
7. Click **"Done"**

**Save each product and submit for review.**

### Step 6: Get App Store Connect Shared Secret (iOS)

RevenueCat needs this to validate receipts.

1. In App Store Connect, go to **My Apps**
2. Select your app
3. Go to **General** → **App Information**
4. Scroll to **"App-Specific Shared Secret"**
5. Click **"Generate"** (or reveal if already generated)
6. **Copy the shared secret** (looks like: `1234567890abcdef1234567890abcdef`)

**Keep this safe - you'll need it in Step 8!**

### Step 7: Create Products in Google Play Console (Android)

**Before doing this step, you must have:**
- ✅ A Google Play Developer account ($25 one-time fee)
- ✅ Your app created in Google Play Console

**Steps in Google Play Console:**

1. Go to [https://play.google.com/console](https://play.google.com/console)
2. Select your app
3. Navigate to **Monetize** → **Subscriptions** (in the left sidebar)
4. Click **"Create subscription"**

**Create these 4 subscription products:**

#### Product 1: Premium Monthly
```
Product ID: premium_monthly (IMPORTANT: write this down!)
Name: Premium Monthly
Description: Monthly subscription to Easy Song Premium

Billing period: 1 Month
Price: $9.99 USD (set prices for all countries)

Free trial: 7 days (optional)
Grace period: 3 days (recommended)
```

#### Product 2: Premium Annual
```
Product ID: premium_annual
Name: Premium Annual
Description: Annual subscription to Easy Song Premium (save 33%!)

Billing period: 1 Year
Price: $79.99 USD
```

#### Product 3: Premium Plus Monthly
```
Product ID: premium_plus_monthly
Name: Premium Plus Monthly
Description: Monthly subscription to Easy Song Premium Plus

Billing period: 1 Month
Price: $14.99 USD
```

#### Product 4: Premium Plus Annual
```
Product ID: premium_plus_annual
Name: Premium Plus Annual
Description: Annual subscription to Easy Song Premium Plus (save 33%!)

Billing period: 1 Year
Price: $119.99 USD
```

**Click "Activate" for each subscription after creating it.**

### Step 8: Create Google Play Service Account (Android)

RevenueCat needs API access to validate Android subscriptions.

1. In Google Play Console, go to **Setup** → **API access**
2. Click **"Choose a project to link"** or **"Create new service account"**
3. Follow the link to Google Cloud Console
4. In Google Cloud Console:
   - Click **"Create Service Account"**
   - Name: `RevenueCat Service Account`
   - Click **"Create and Continue"**
   - Role: **"Owner"** (or minimum: "Viewer" role on Google Play Developer API)
   - Click **"Done"**
5. Click on the service account you just created
6. Go to **"Keys"** tab
7. Click **"Add Key"** → **"Create new key"**
8. Select **JSON** format
9. Click **"Create"**
10. **A JSON file will download** - keep this safe!

**Go back to Google Play Console:**
1. Refresh the API access page
2. You should see the service account listed
3. Click **"Grant access"**
4. Under **Permissions**, grant:
   - ✅ **"View financial data"**
   - ✅ **"Manage orders and subscriptions"**
5. Click **"Invite user"**

**Now you can connect RevenueCat to Google Play!**

---

## Part 4: Connect RevenueCat to App Stores

### Step 9: Connect iOS App to App Store Connect

1. In RevenueCat dashboard, go to **"Apps"** (left sidebar)
2. Click on your **iOS app** (`Easy Song iOS`)
3. Scroll to **"App Store Connect"** section
4. Paste the **Shared Secret** from Step 6
5. Click **"Save"**

**Status should show:** ✅ Connected

### Step 10: Connect Android App to Google Play

1. In RevenueCat dashboard, still in **"Apps"**
2. Click on your **Android app** (`Easy Song Android`)
3. Scroll to **"Google Play"** section
4. Click **"Upload JSON Key File"**
5. Upload the JSON file downloaded in Step 8
6. Click **"Save"**

**Status should show:** ✅ Connected

---

## Part 5: Create Entitlements & Products in RevenueCat

Now we configure what subscriptions unlock in your app.

### Step 11: Create Entitlements

Entitlements are what users get access to (not the products themselves).

1. Go to **"Entitlements"** in the left sidebar
2. Click **"+ New"** (top right)

**Create Entitlement 1: Premium**
```
Identifier: premium (lowercase, no spaces)
Description: Premium tier features (up to 10 history items, limited study mode)
```
3. Click **"Save"**

**Create Entitlement 2: Premium Plus**
1. Click **"+ New"** again
```
Identifier: premium_plus (lowercase, no spaces)
Description: Premium Plus tier features (unlimited history, unlimited study mode)
```
2. Click **"Save"**

**Result:** You now have 2 entitlements defined!

### Step 12: Create Products in RevenueCat

Now we map App Store/Play Store products to RevenueCat.

1. Go to **"Products"** in the left sidebar
2. Click **"+ New"** (top right)

**Create Product 1: Premium Monthly**
```
Product Identifier: premium_monthly
Type: Subscription
```

3. Under **"App Store Product ID"** section:
   - **iOS:** `com.easysong.premium.monthly` (from Step 5)
   - Click **"Fetch from App Store"** - it should load the product details

4. Under **"Google Play Product ID"** section:
   - **Android:** `premium_monthly` (from Step 7)
   - Click **"Fetch from Google Play"** - it should load the product details

5. Under **"Attach to Entitlement"**:
   - Select **"premium"** from dropdown

6. Click **"Save"**

**Repeat for Product 2: Premium Annual**
```
Product Identifier: premium_annual
iOS: com.easysong.premium.annual
Android: premium_annual
Entitlement: premium
```

**Repeat for Product 3: Premium Plus Monthly**
```
Product Identifier: premium_plus_monthly
iOS: com.easysong.premiumplus.monthly
Android: premium_plus_monthly
Entitlement: premium_plus
```

**Repeat for Product 4: Premium Plus Annual**
```
Product Identifier: premium_plus_annual
iOS: com.easysong.premiumplus.annual
Android: premium_plus_annual
Entitlement: premium_plus
```

**Result:** You now have 4 products configured!

### Step 13: Create Offerings

Offerings group products together for display to users.

1. Go to **"Offerings"** in the left sidebar
2. You'll see a **"default"** offering already exists (or click **"+ New"** to create one)
3. Click on **"default"** to edit it
4. Set:
   ```
   Identifier: default
   Description: Standard subscription offerings
   ```

5. Under **"Packages"**, click **"Add Package"** for each product:

**Package 1: Premium Monthly**
```
Package Identifier: premium_monthly
Product: premium_monthly (select from dropdown)
```

**Package 2: Premium Annual**
```
Package Identifier: premium_annual
Product: premium_annual
```

**Package 3: Premium Plus Monthly**
```
Package Identifier: premium_plus_monthly
Product: premium_plus_monthly
```

**Package 4: Premium Plus Annual**
```
Package Identifier: premium_plus_annual
Product: premium_plus_annual
```

6. **Make this offering "Current"** - toggle the switch to enable it
7. Click **"Save"**

**Result:** Your offering is live and will be fetched by your app!

---

## Part 6: Get API Keys for Your App

Your mobile app needs API keys to communicate with RevenueCat.

### Step 14: Get Public API Keys

1. Go to **"API Keys"** in the left sidebar (under Project Settings)
2. You'll see two keys:

**Copy these keys:**
```
iOS (Apple) API Key: appl_xxxxxxxxxxxxxxxxxxxxx
Android (Google) API Key: goog_xxxxxxxxxxxxxxxxxxxxx
```

**You'll use these in your mobile app code:**

```typescript
// mobile/src/utils/subscriptions.ts

const API_KEYS = {
  ios: 'appl_xxxxxxxxxxxxxxxxxxxxx',        // Paste here
  android: 'goog_xxxxxxxxxxxxxxxxxxxxx',     // Paste here
};
```

**⚠️ IMPORTANT:** These are public API keys (safe to include in your app). Do NOT use the secret API keys in your mobile app.

---

## Part 7: Enable Firebase Integration

This sends subscription events automatically to Firebase Analytics.

### Step 15: Connect Firebase

1. In RevenueCat dashboard, go to **"Integrations"** (left sidebar)
2. Scroll down to **"Firebase"**
3. Click **"Connect"** or **"Configure"**
4. You'll need your **Firebase project ID**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Click the gear icon → **Project settings**
   - Copy the **Project ID** (not the Project number)
5. Paste the **Firebase Project ID** in RevenueCat
6. Click **"Save"** or **"Enable Integration"**

**That's it!** RevenueCat will now automatically send these events to Firebase:
- `rc_initial_purchase`
- `rc_trial_started`
- `rc_trial_converted`
- `rc_trial_cancelled`
- `rc_renewal`
- `rc_cancellation`

**No code changes needed** - events appear automatically in Firebase Analytics!

---

## Part 8: Set Up Webhooks (Optional but Recommended)

Webhooks notify your backend when subscription events occur.

### Step 16: Configure Webhook to Your Backend

1. In RevenueCat dashboard, go to **"Integrations"** → **"Webhooks"**
2. Click **"+ Add Webhook"**
3. Enter your webhook URL:
   ```
   https://your-backend.com/webhooks/revenuecat
   ```
   - Replace with your actual backend URL
   - This endpoint will receive POST requests from RevenueCat

4. Select events to receive:
   - ✅ **INITIAL_PURCHASE** - User subscribes for first time
   - ✅ **RENEWAL** - Subscription renews
   - ✅ **CANCELLATION** - User cancels subscription
   - ✅ **EXPIRATION** - Subscription expires
   - ✅ **BILLING_ISSUE** - Payment fails
   - ✅ **PRODUCT_CHANGE** - User upgrades/downgrades

5. **Authorization** (recommended):
   - Select **"Bearer Token"**
   - Generate a secret token (use a password generator)
   - Save this token - you'll verify it in your backend

6. Click **"Save"**

**Result:** Your backend will receive real-time subscription events!

**Backend Implementation** (you'll create this later):
```typescript
// backend/src/routes/webhooks.ts
router.post('/revenuecat', async (req, res) => {
  // Verify webhook is from RevenueCat
  const token = req.headers.authorization;
  if (token !== 'Bearer YOUR_SECRET_TOKEN') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Handle event
  const event = req.body;
  console.log('RevenueCat event:', event.type);
  
  // Update your database based on event
  // ... (see REVENUECAT_MULTIPLE_PAYWALLS.md for full implementation)
  
  res.status(200).json({ received: true });
});
```

---

## Part 9: Configure Sandbox Testing

Before going live, test with sandbox accounts.

### Step 17: Enable Sandbox Testing

RevenueCat automatically detects sandbox purchases - no configuration needed!

**To test on iOS:**
1. Go to **Settings** → **App Store** → **Sandbox Account** on your iPhone
2. Sign in with a sandbox test account (create in App Store Connect → Users and Access → Sandbox Testers)

**To test on Android:**
1. Add your Google account as a license tester in Google Play Console
2. Install your app via internal testing track

**Testing in RevenueCat:**
1. Go to **"Customers"** in RevenueCat dashboard
2. After making a sandbox purchase, you'll see the test user appear
3. Click on the user to see their subscription status
4. Verify the entitlement is active

---

## Part 10: Pricing & Experiment Setup (Optional - For Later)

You can set up pricing experiments in RevenueCat.

### Step 18: Create Pricing Experiment (Optional)

1. Go to **"Experiments"** in the left sidebar
2. Click **"+ New Experiment"**
3. Configure:
   ```
   Experiment Name: Premium Plus Trial Duration
   Offering: default
   
   Control Group (50%):
     - Use current offering (7-day trial)
   
   Variant A (50%):
     - Create new offering with 14-day trial
   ```

4. Set **Duration:** 2-4 weeks
5. Set **Primary Metric:** Revenue per user
6. Click **"Start Experiment"**

**RevenueCat will:**
- Automatically split users 50/50
- Track conversion rates
- Show which variant performs better

**Note:** You can also do this with Firebase Remote Config for more flexibility!

---

## Part 11: Review & Go Live Checklist

### Step 19: Final Checklist

Before going live, verify everything is set up:

**Apps:**
- [x] iOS app added with correct Bundle ID
- [x] Android app added with correct Package Name
- [x] App Store Connect connected (shared secret)
- [x] Google Play connected (service account JSON)

**Products:**
- [x] 4 products created in App Store Connect
- [x] 4 products created in Google Play Console
- [x] 4 products created in RevenueCat
- [x] All products fetched successfully (green checkmarks)

**Entitlements:**
- [x] "premium" entitlement created
- [x] "premium_plus" entitlement created
- [x] Products attached to correct entitlements

**Offerings:**
- [x] "default" offering created
- [x] 4 packages added to offering
- [x] Offering set as "Current"

**Integrations:**
- [x] Firebase integration enabled
- [x] Webhook configured (optional)

**API Keys:**
- [x] iOS API key copied
- [x] Android API key copied
- [x] Keys ready to paste in mobile app code

**Testing:**
- [x] Sandbox test account ready (iOS)
- [x] License tester added (Android)

### Step 20: Test Purchase Flow

1. Build your app with RevenueCat SDK integrated
2. Run on physical device (simulators don't support in-app purchases)
3. Navigate to your paywall
4. Attempt a purchase using sandbox account
5. Verify in RevenueCat dashboard:
   - User appears in "Customers"
   - Entitlement shows as active
   - Event appears in Firebase Analytics (if integration enabled)

**If successful:** 🎉 You're ready to go live!

**If not working:**
- Check API keys are correct
- Verify product IDs match exactly between stores and RevenueCat
- Check App Store Connect / Play Console status (products must be approved)
- Look at RevenueCat logs in dashboard under "Activity"

---

## Common Issues & Solutions

### Issue 1: "Unable to fetch products"
**Solution:**
- Verify Bundle ID / Package Name matches exactly
- Check that products are approved in App Store Connect / Play Console
- Wait 24 hours after creating products (Apple can be slow)
- Try "Fetch from App Store" again in RevenueCat dashboard

### Issue 2: "Receipt validation failed"
**Solution:**
- Verify Shared Secret is correct (iOS)
- Verify Service Account has correct permissions (Android)
- Check that app is signed correctly

### Issue 3: Firebase events not appearing
**Solution:**
- Verify Firebase Project ID is correct in integration
- Wait up to 24 hours for first events
- Check Firebase DebugView for real-time events
- Verify integration is "Connected" status in RevenueCat

### Issue 4: Webhook not receiving events
**Solution:**
- Verify webhook URL is publicly accessible (not localhost)
- Check authorization token matches
- Look at webhook logs in RevenueCat dashboard
- Test with webhook testing tools (webhook.site)

---

## Summary: What You've Set Up

After completing this guide, you have:

### In App Store Connect (iOS):
✅ 4 subscription products created  
✅ Shared secret generated  
✅ Free trials configured (optional)  

### In Google Play Console (Android):
✅ 4 subscription products created  
✅ Service account created with API access  
✅ Subscriptions activated  

### In RevenueCat Dashboard:
✅ Project created  
✅ iOS and Android apps added  
✅ Connected to both app stores  
✅ 2 entitlements created (premium, premium_plus)  
✅ 4 products configured  
✅ 1 offering created with 4 packages  
✅ Firebase integration enabled  
✅ Webhook configured (optional)  
✅ API keys obtained  

### Ready for:
✅ Mobile app integration  
✅ Sandbox testing  
✅ Production launch  

---

## Next Steps

1. **Copy your API keys** from Step 14
2. **Integrate RevenueCat SDK** in your mobile app (see `REVENUECAT_MULTIPLE_PAYWALLS.md`)
3. **Test with sandbox accounts**
4. **Implement webhook handler** in your backend
5. **Launch!** 🚀

---

## Reference: Quick Links

- **RevenueCat Dashboard:** [https://app.revenuecat.com/](https://app.revenuecat.com/)
- **App Store Connect:** [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
- **Google Play Console:** [https://play.google.com/console](https://play.google.com/console)
- **Firebase Console:** [https://console.firebase.google.com/](https://console.firebase.google.com/)
- **RevenueCat Docs:** [https://docs.revenuecat.com/](https://docs.revenuecat.com/)

---

## Quick Reference: Product ID Mapping

Keep this handy when integrating in your app:

| Display Name | iOS Product ID | Android Product ID | RevenueCat Product ID | Package ID | Entitlement |
|--------------|----------------|--------------------|-----------------------|------------|-------------|
| Premium Monthly | `com.easysong.premium.monthly` | `premium_monthly` | `premium_monthly` | `premium_monthly` | `premium` |
| Premium Annual | `com.easysong.premium.annual` | `premium_annual` | `premium_annual` | `premium_annual` | `premium` |
| Premium Plus Monthly | `com.easysong.premiumplus.monthly` | `premium_plus_monthly` | `premium_plus_monthly` | `premium_plus_monthly` | `premium_plus` |
| Premium Plus Annual | `com.easysong.premiumplus.annual` | `premium_plus_annual` | `premium_plus_annual` | `premium_plus_annual` | `premium_plus` |

---

**Questions?** Check the RevenueCat documentation or let me know if you get stuck on any step!

