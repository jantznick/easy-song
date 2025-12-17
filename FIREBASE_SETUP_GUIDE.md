# Firebase Analytics Setup Guide

## Overview
This guide walks you through the **pre-implementation setup** for Firebase Analytics, Remote Config, and AdMob integration. Complete these steps **before writing any code**.

**Time Required**: 20-30 minutes  
**Prerequisites**: Google account, Easy Song app bundle identifiers

---

## Part 1: Create Firebase Project

### Step 1: Access Firebase Console
1. Go to [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Sign in with your Google account (or create one)
3. Click **"Create a project"** or **"Add project"**

### Step 2: Create Project
1. **Project name**: Enter `Easy Song` (or `EasySong-Prod`)
   - Firebase will auto-generate a unique project ID (e.g., `easysong-abc123`)
   - You can customize the project ID if you want

2. **Google Analytics**: ✅ **Enable** (toggle should be ON)
   - This is critical - don't skip this step
   - Click **Continue**

3. **Configure Google Analytics**:
   - **Account**: Select "Default Account for Firebase" (or create new)
   - **Analytics location**: Select your country (e.g., United States)
   - ✅ Accept terms and conditions
   - Click **Create project**

4. Wait 30-60 seconds for project creation
5. Click **Continue** when ready

### Step 3: Verify Analytics is Enabled
1. In left sidebar, click **Analytics** → **Dashboard**
2. You should see an empty dashboard (no data yet - that's normal)
3. If you see "Get started with Google Analytics", click it and enable

---

## Part 2: Add iOS App to Firebase

### Step 1: Register iOS App
1. In Firebase Console, click the **⚙️ gear icon** (Project settings) in top-left
2. Click **"Add app"** or the **iOS icon** 
3. Fill out the form:

**iOS bundle ID**: `com.easysong.mobile` (or your actual bundle ID)
   - ⚠️ **IMPORTANT**: Must match exactly what's in your `app.json`:
   ```json
   "ios": {
     "bundleIdentifier": "com.easysong.mobile"
   }
   ```
   - To find yours: Check `mobile/app.json` → `expo.ios.bundleIdentifier`

**App nickname** (optional): `Easy Song iOS`

**App Store ID** (optional): Leave blank for now (add later when published)

4. Click **Register app**

### Step 2: Download iOS Config File
1. Click **Download GoogleService-Info.plist**
2. Save this file - you'll need it during implementation
3. **DO NOT** commit this file to Git (it contains API keys)
   - Add to `.gitignore`: `**/GoogleService-Info.plist`

**File Location (for later)**:
- Expo: You'll reference this in `app.json` plugin config
- Bare workflow: Place in `ios/` directory

4. Click **Next** (skip SDK setup for now - Expo handles this)
5. Click **Next** again (skip initialization - we'll do this in code)
6. Click **Continue to console**

---

## Part 3: Add Android App to Firebase

### Step 1: Register Android App
1. In Firebase Console, click **"Add app"** again
2. Click the **Android icon**
3. Fill out the form:

**Android package name**: `com.easysong.mobile` (or your actual package)
   - ⚠️ **IMPORTANT**: Must match exactly what's in your `app.json`:
   ```json
   "android": {
     "package": "com.easysong.mobile"
   }
   ```
   - To find yours: Check `mobile/app.json` → `expo.android.package`

**App nickname** (optional): `Easy Song Android`

**Debug signing certificate SHA-1** (optional): Leave blank for now
   - Only needed for advanced features (Google Sign-In, Dynamic Links)
   - Not required for Analytics

4. Click **Register app**

### Step 2: Download Android Config File
1. Click **Download google-services.json**
2. Save this file - you'll need it during implementation
3. **DO NOT** commit this file to Git
   - Add to `.gitignore`: `**/google-services.json`

**File Location (for later)**:
- Expo: You'll reference this in `app.json` plugin config
- Bare workflow: Place in `android/app/` directory

4. Click **Next** (skip SDK setup)
5. Click **Next** again (skip initialization)
6. Click **Continue to console**

---

## Part 4: Enable Required Firebase Services

### Enable Remote Config
1. In left sidebar, click **Build** → **Remote Config**
2. Click **Get started** or **Create configuration**
3. You should see an empty configuration screen
4. ✅ **Done** - Service is now active

### Verify Analytics is Active
1. In left sidebar, click **Analytics** → **Events**
2. You should see "No events yet" - that's normal
3. Leave this tab open - you'll use it later for testing

### Enable Crashlytics (Optional but Recommended)
1. In left sidebar, click **Build** → **Crashlytics**
2. Click **Get started**
3. Follow prompts to enable
4. ✅ Service activated (we'll implement later)

---

## Part 5: Link AdMob Account

**Why**: Automatically track ad revenue in Firebase Analytics

### Option A: You Already Have AdMob
1. In left sidebar, click **⚙️ Project settings**
2. Click **Integrations** tab
3. Find **AdMob** card, click **Link**
4. Select your existing AdMob account
5. Select which AdMob apps to link (choose your iOS/Android apps)
6. Click **Continue** → **Enable linking**
7. ✅ **Done** - Ad revenue will auto-track in Analytics

### Option B: You Don't Have AdMob Yet
1. In Firebase Console, click **⚙️ Project settings** → **Integrations**
2. Find **AdMob** card, click **Get started**
3. Follow prompts to create AdMob account
4. Link AdMob apps to Firebase (as above)
5. Create ad units in AdMob console (you may have already done this)

**Verify Link**:
- Go to **Analytics** → **Events**
- You should see `ad_impression`, `ad_click` events listed (with 0 counts for now)
- If you see these, linking worked! 🎉

---

## Part 6: Configure Data Settings

### Data Retention
1. In left sidebar, click **⚙️ Project settings**
2. Click **Integrations** tab → **Google Analytics**
3. Click **Manage Analytics settings** (opens new tab)
4. In Google Analytics, go to **Admin** (bottom-left)
5. Under **Property**, click **Data Settings** → **Data Retention**
6. Set event data retention: **14 months** (maximum for free tier)
7. ✅ **Save**

### Data Sharing Settings
1. In Google Analytics **Admin** → **Account Settings**
2. Review data sharing options:
   - ✅ **Google products & services** (for AdMob integration)
   - ✅ **Benchmarking** (optional - compare to industry)
   - ✅ **Technical support** (recommended)
   - ⚠️ **Account specialists** (optional - for sales/support contact)
3. Save settings

---

## Part 7: Set Up Debug Mode

**Why**: Test events in real-time without polluting production data

### Enable Debug View
1. In Firebase Console, go to **Analytics** → **DebugView**
2. You'll see: "No devices in debug mode"
3. **Note the instructions** - you'll need to enable debug mode in your app later

**What you'll do later** (during implementation):
```bash
# iOS - Enable debug mode on your test device
adb shell setprop debug.firebase.analytics.app com.easysong.mobile

# Android - Enable debug mode
adb shell setprop debug.firebase.analytics.app com.easysong.mobile
```

For now, just note that DebugView exists - you'll use it heavily during testing.

---

## Part 8: Get Your Firebase Config Values

You'll need these values when implementing the code.

### Get Web API Key (for reference)
1. Go to **⚙️ Project settings** → **General** tab
2. Scroll to **Your apps** section
3. Click on **iOS app** or **Android app**
4. Note these values (you may need them):
   - **App ID**: `1:123456789:ios:abcdef123456`
   - **API Key**: `AIzaSyAbc123...`
   - **Project ID**: `easysong-abc123`

### Get Ad Unit IDs (from AdMob)
You'll need to replace test IDs with real ones in production:

1. Go to [AdMob Console](https://apps.admob.com/)
2. Select your app
3. Go to **Ad units**
4. Note your ad unit IDs for:
   - Native ads: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`
   - Banner ads: `ca-app-pub-XXXXXXXXXXXXXXXX/YYYYYYYYYY`

**Save these for later** - you'll add them to `mobile/src/utils/ads.ts`

---

## Part 9: Create Test User Accounts (Optional)

For testing without affecting production data:

### Google Analytics Test Users
1. In Google Analytics **Admin** → **Property Access Management**
2. Click **+** → **Add users**
3. Add test email addresses with **Viewer** role
4. These users can view data but won't trigger events

### Firebase Test Users
1. In Firebase Console → **Authentication**
2. Click **Get started** if not enabled
3. Enable **Email/Password** provider
4. Go to **Users** tab → **Add user**
5. Create test accounts for QA

---

## Part 10: Security & API Restrictions (Important!)

### Restrict API Keys
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project (same name)
3. Go to **APIs & Services** → **Credentials**
4. Click on each API key:
   - **Android key**: Restrict to Android apps with your package name
   - **iOS key**: Restrict to iOS apps with your bundle ID
5. This prevents unauthorized use of your API keys

### Set Up App Check (Recommended)
Protects backend from abuse:

1. In Firebase Console → **Build** → **App Check**
2. Click **Get started**
3. Register iOS app:
   - Provider: **DeviceCheck** (for production)
   - Click **Save**
4. Register Android app:
   - Provider: **Play Integrity** (for production)
   - Click **Save**

---

## Part 11: Download Files Checklist

Before you start coding, make sure you have:

### Files to Download & Save
- [x] `GoogleService-Info.plist` (iOS config)
- [x] `google-services.json` (Android config)

### Where to Save Them (Temporarily)
```
/Downloads/
  ├── GoogleService-Info.plist
  └── google-services.json
```

**During implementation**, you'll either:
- **Expo**: Reference these in `app.json` plugin config
- **Bare React Native**: Place in `ios/` and `android/app/` directories

### Important: Don't Commit These Files!
Add to `.gitignore`:
```
# Firebase config files (contain API keys)
**/GoogleService-Info.plist
**/google-services.json
```

---

## Part 12: Firebase Console Bookmarks

Save these URLs for quick access:

1. **Main Console**: `https://console.firebase.google.com/project/YOUR-PROJECT-ID`
2. **Analytics Dashboard**: `https://console.firebase.google.com/project/YOUR-PROJECT-ID/analytics`
3. **DebugView**: `https://console.firebase.google.com/project/YOUR-PROJECT-ID/analytics/debugview`
4. **Remote Config**: `https://console.firebase.google.com/project/YOUR-PROJECT-ID/config`
5. **AdMob Console**: `https://apps.admob.com/`

Replace `YOUR-PROJECT-ID` with your actual project ID (e.g., `easysong-abc123`)

---

## Part 13: Pre-Implementation Checklist

Before you start coding, verify:

### Firebase Setup
- [x] Firebase project created
- [x] Google Analytics enabled for project
- [x] iOS app registered in Firebase
- [x] Android app registered in Firebase
- [x] `GoogleService-Info.plist` downloaded
- [x] `google-services.json` downloaded
- [x] Remote Config enabled
- [x] Analytics Dashboard accessible
- [x] DebugView accessible

### AdMob Integration
- [x] AdMob account exists
- [x] AdMob linked to Firebase project
- [x] Ad units created (native, banner, etc.)
- [x] Ad unit IDs noted/saved
- [x] `ad_impression` events visible in Analytics

### Security
- [x] API keys restricted (optional but recommended)
- [x] Config files added to `.gitignore`
- [x] App Check configured (optional)

### Ready for Code!
- [x] Firebase config files saved locally
- [x] Ad unit IDs ready to paste
- [x] Firebase Console URLs bookmarked
- [x] Test device/emulator ready

---

## What's Next?

Now that Firebase is set up, you can proceed with code implementation:

1. **Install Dependencies**:
   ```bash
   cd mobile
   npm install @react-native-firebase/app @react-native-firebase/analytics @react-native-firebase/remote-config
   ```

2. **Configure Expo** (if using Expo):
   ```json
   // mobile/app.json
   "plugins": [
     "@react-native-firebase/app",
     "@react-native-firebase/analytics"
   ]
   ```

3. **Add Config Files**:
   - Place `GoogleService-Info.plist` in project root
   - Place `google-services.json` in project root
   - Update `.gitignore`

4. **Follow Implementation Guide**:
   - Refer to `ANALYTICS_IMPLEMENTATION_PROPOSAL.md` Phase 1
   - Create `mobile/src/utils/analytics.ts`
   - Initialize Firebase in `App.tsx`

---

## Troubleshooting Common Setup Issues

### "Google Analytics not enabled"
- **Fix**: Go to Project Settings → Integrations → Google Analytics → Enable
- Must be done BEFORE adding apps

### "Can't find GoogleService-Info.plist"
- **Fix**: Download again from Project Settings → Your apps → iOS app
- Click the ⚙️ icon next to your iOS app

### "AdMob events not showing"
- **Fix**: Ensure AdMob is linked in Firebase Console → Integrations
- May take 24-48 hours for first events to appear

### "Invalid bundle ID / package name"
- **Fix**: Must match EXACTLY (case-sensitive)
- Check `mobile/app.json` → `expo.ios.bundleIdentifier` / `expo.android.package`
- Can't change after creation (must delete and re-add app)

### "API key restrictions breaking app"
- **Fix**: Double-check package name / bundle ID in restrictions
- Try temporarily removing restrictions to test

---

## Support & Resources

### Official Documentation
- [Firebase Console](https://console.firebase.google.com/)
- [Firebase Setup for iOS](https://firebase.google.com/docs/ios/setup)
- [Firebase Setup for Android](https://firebase.google.com/docs/android/setup)
- [React Native Firebase Docs](https://rnfirebase.io/)

### Need Help?
- [Firebase Support](https://firebase.google.com/support)
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)
- [React Native Firebase Discord](https://discord.gg/C9aK28N)

---

## Summary: What You Accomplished

✅ Created Firebase project with Analytics enabled  
✅ Registered iOS app and downloaded config  
✅ Registered Android app and downloaded config  
✅ Enabled Remote Config for A/B testing  
✅ Linked AdMob for automatic revenue tracking  
✅ Configured data retention and privacy settings  
✅ Set up DebugView for real-time testing  
✅ Secured API keys and added files to `.gitignore`  

**You're now ready to implement Firebase Analytics in your code!** 🚀

Proceed to `ANALYTICS_IMPLEMENTATION_PROPOSAL.md` → **Phase 1: Foundation** to start coding.

---

**Document Version**: 1.0  
**Last Updated**: December 2024  
**Estimated Setup Time**: 20-30 minutes

