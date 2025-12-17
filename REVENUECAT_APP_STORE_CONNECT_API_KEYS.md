# How to Get App Store Connect API Key ID and Issuer ID

RevenueCat needs App Store Connect API credentials to connect to your iOS app. Here's how to get them.

---

## Quick Steps

1. Go to App Store Connect → Users and Access → Keys
2. Create a new API key with "App Manager" or "Admin" role
3. Download the `.p8` key file
4. Copy the Key ID and Issuer ID
5. Upload the `.p8` file to RevenueCat

---

## Detailed Step-by-Step Guide

### Step 1: Access App Store Connect

1. Go to [https://appstoreconnect.apple.com/](https://appstoreconnect.apple.com/)
2. Sign in with your Apple Developer account
3. Make sure you have **Admin** or **App Manager** access to your app

### Step 2: Navigate to Keys Section

1. Click on your **user icon** (top right)
2. Select **"Users and Access"** from the dropdown
3. In the left sidebar, click **"Keys"** (under "Integrations")
4. You'll see a section called **"App Store Connect API"**

### Step 3: Create a New API Key

1. Click the **"+"** button (or **"Generate API Key"** button) next to "App Store Connect API"
2. Fill in the details:
   - **Name:** `RevenueCat API Key` (or any name you prefer)
   - **Access:** Select **"App Manager"** or **"Admin"**
     - **App Manager** is recommended (has access to in-app purchases)
     - **Admin** works but has more permissions than needed
3. Click **"Generate"**

### Step 4: Download the Key File

**⚠️ IMPORTANT: You can only download this file ONCE!**

1. After clicking "Generate", a dialog will appear
2. Click **"Download API Key"** button
3. A `.p8` file will download (e.g., `AuthKey_XXXXXXXXXX.p8`)
4. **Save this file in a secure location** - you cannot download it again!

**If you lose this file:**
- You'll need to create a new API key
- The old key will be revoked

### Step 5: Copy Key ID and Issuer ID

In the same dialog (or in the Keys list), you'll see:

1. **Key ID:** A 10-character string (e.g., `ABC123DEF4`)
   - Click the copy icon or manually copy it
   - This is what RevenueCat calls "In App Purchase Key ID"

2. **Issuer ID:** A UUID (e.g., `12345678-1234-1234-1234-123456789012`)
   - Found at the top of the Keys page (under "App Store Connect API" heading)
   - Or in your user profile → "Issuer ID"
   - Copy this value

### Step 6: Upload to RevenueCat

Now go back to RevenueCat dashboard:

1. Go to **"Apps"** → Select your iOS app
2. Scroll to **"App Store Connect"** section
3. You'll see fields for:
   - **In App Purchase Key ID** → Paste the Key ID from Step 5
   - **Issuer ID** → Paste the Issuer ID from Step 5
   - **Private Key File** → Upload the `.p8` file from Step 4

4. Click **"Save"** or **"Connect"**

**Result:** RevenueCat should now be connected to App Store Connect! ✅

---

## Alternative: Using Shared Secret (Older Method)

If you prefer to use the older Shared Secret method instead:

1. In App Store Connect, go to **My Apps** → Select your app
2. Go to **General** → **App Information**
3. Scroll to **"App-Specific Shared Secret"**
4. Click **"Generate"** (or reveal if already generated)
5. Copy the shared secret

Then in RevenueCat:
1. Look for **"Shared Secret"** field (instead of API key fields)
2. Paste the shared secret
3. Click **"Save"**

**Note:** Some RevenueCat projects may only show the API key method. If you don't see a "Shared Secret" option, you must use the API key method.

---

## Troubleshooting

### Issue: "Invalid Key ID"
**Solution:**
- Verify you copied the full Key ID (10 characters)
- Make sure there are no extra spaces
- Try creating a new API key

### Issue: "Invalid Issuer ID"
**Solution:**
- Verify you copied the full UUID (with dashes)
- Check that it's from the correct Apple Developer account
- The Issuer ID is account-wide, not per-app

### Issue: "Invalid Private Key"
**Solution:**
- Make sure you uploaded the `.p8` file (not a `.p12` or other format)
- Verify the file wasn't corrupted during download
- Try downloading a new API key if needed

### Issue: "Access Denied"
**Solution:**
- Verify your Apple Developer account has access to the app
- Make sure the API key has "App Manager" or "Admin" role
- Check that the app exists in App Store Connect

### Issue: "Cannot Fetch Products"
**Solution:**
- Wait a few minutes after connecting (Apple's API can be slow)
- Verify your products are created in App Store Connect
- Make sure products are approved/ready for sale
- Try clicking "Fetch from App Store" again in RevenueCat

---

## Security Best Practices

### ✅ DO:
- Store the `.p8` file securely (password manager, encrypted storage)
- Use "App Manager" role (minimum permissions needed)
- Name the key descriptively (e.g., "RevenueCat Production")
- Revoke old keys if compromised

### ❌ DON'T:
- Commit the `.p8` file to Git (add to `.gitignore`)
- Share the key file publicly
- Use "Admin" role unless necessary
- Delete the `.p8` file after uploading (keep a backup!)

---

## Where to Find Each Value

### Key ID
**Location:** App Store Connect → Users and Access → Keys → [Your Key Name]
**Format:** 10 characters (e.g., `ABC123DEF4`)
**What RevenueCat calls it:** "In App Purchase Key ID"

### Issuer ID
**Location:** 
- Top of the Keys page (under "App Store Connect API" heading)
- Or: User icon → Your name → Issuer ID
**Format:** UUID with dashes (e.g., `12345678-1234-1234-1234-123456789012`)
**What RevenueCat calls it:** "Issuer ID"

### Private Key File
**Location:** Downloaded `.p8` file from Step 4
**Format:** `.p8` file (e.g., `AuthKey_XXXXXXXXXX.p8`)
**What RevenueCat calls it:** "Private Key File" or "API Key File"

---

## Visual Guide

```
App Store Connect
    ↓
Users and Access (top right user icon)
    ↓
Keys (left sidebar)
    ↓
App Store Connect API section
    ↓
[+] Generate API Key
    ↓
Name: "RevenueCat API Key"
Access: "App Manager"
    ↓
[Generate]
    ↓
Dialog appears with:
    - Key ID: ABC123DEF4 ← Copy this
    - [Download API Key] ← Click this
    ↓
.p8 file downloads ← Save this
    ↓
Copy Issuer ID from top of page ← Copy this
    ↓
Go to RevenueCat → Apps → iOS App
    ↓
Paste Key ID, Issuer ID, upload .p8 file
    ↓
[Save]
    ↓
✅ Connected!
```

---

## Quick Reference

| What You Need | Where to Find It | Format |
|---------------|------------------|--------|
| **Key ID** | Keys page → Your API key | 10 characters |
| **Issuer ID** | Top of Keys page | UUID |
| **Private Key** | Downloaded `.p8` file | `.p8` file |

---

## Next Steps

After connecting:
1. ✅ RevenueCat can now fetch your products from App Store Connect
2. ✅ Click **"Fetch from App Store"** in RevenueCat to load your products
3. ✅ Verify products appear correctly
4. ✅ Continue with the rest of the setup guide

---

**Still having issues?** 
- Make sure you have Admin or App Manager access to your Apple Developer account
- Verify your app exists in App Store Connect
- Check that you're using the correct Apple Developer account
- Try creating a new API key if the first one doesn't work

