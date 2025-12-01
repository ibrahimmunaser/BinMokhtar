# Google Sign-In Troubleshooting Guide

## Error: "The requested action is invalid"

This error typically occurs when there's a configuration mismatch between your app and Firebase Console.

---

## 🔍 Step-by-Step Fix

### Step 1: Verify Google Sign-In is Enabled

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: **binmokhtar2-967ad**
3. Click **Authentication** → **Sign-in method** tab
4. Verify **Google** shows as "Enabled" (not just "Added")
5. Click on **Google** to see its configuration

**Check these settings:**
- ✅ Status toggle should be **ON/Enabled**
- ✅ Web SDK configuration should show your **Web client ID**
- ✅ Support email should be filled in

---

### Step 2: Check Authorized Domains

1. In Firebase Console → **Authentication** → **Settings** tab
2. Scroll to **Authorized domains** section
3. **Verify these domains are listed:**
   - ✅ `localhost` (should be there by default)
   - ✅ `binmokhtar2-967ad.firebaseapp.com` (your Firebase domain)

**If `localhost` is missing:**
1. Click **"Add domain"**
2. Type: `localhost`
3. Click **"Add"**

---

### Step 3: Verify OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the same project (binmokhtar2-967ad)
3. Navigate to **APIs & Services** → **OAuth consent screen**

**Required Settings:**
- **User Type**: Either "Internal" or "External" (External for public apps)
- **App name**: Bin Mukhtar Retail
- **Support email**: Your email
- **Authorized domains**: Add your domain (if External)

**If not configured:**
1. Click **"CONFIGURE CONSENT SCREEN"**
2. Choose **"External"** user type
3. Fill in the required fields
4. Click **"SAVE AND CONTINUE"**
5. Skip scopes (default is fine)
6. Click **"SAVE AND CONTINUE"**
7. Click **"BACK TO DASHBOARD"**

---

### Step 4: Check OAuth Client ID

1. In [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Look for **"Web client (Auto-created by Google Service)"**
4. Click on it to edit

**Verify these settings:**
- **Authorized JavaScript origins**:
  - `http://localhost:3000` ✅
  - `http://localhost` ✅
  - Your production domain (when ready)

- **Authorized redirect URIs**:
  - `http://localhost:3000/__/auth/handler` ✅
  - `https://binmokhtar2-967ad.firebaseapp.com/__/auth/handler` ✅

**If missing, add them:**
1. Click **"ADD URI"** under Authorized JavaScript origins
2. Add: `http://localhost:3000`
3. Add: `http://localhost`
4. Click **"ADD URI"** under Authorized redirect URIs
5. Add: `http://localhost:3000/__/auth/handler`
6. Click **"SAVE"**

---

### Step 5: Clear Browser Cache

Sometimes the error persists due to cached authentication state:

1. **Clear your browser cache**:
   - Chrome: Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

2. **Or use Incognito/Private mode**:
   - Test the sign-in in an incognito window
   - This bypasses any cached authentication state

---

### Step 6: Check Firebase API Restrictions

1. In [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Find **"Browser key (auto created by Firebase)"**
4. Click on it

**Application restrictions:**
- Should be set to **"HTTP referrers (web sites)"**
- Should have your domains listed:
  - `localhost/*`
  - `*.firebaseapp.com/*`

**API restrictions:**
- Should have these APIs enabled:
  - Identity Toolkit API ✅
  - Token Service API ✅

---

## 🐛 Common Issues & Solutions

### Issue 1: "This domain is not authorized"
**Solution:**
1. Add your domain to Authorized domains in Firebase Console
2. Add domain to OAuth client's Authorized JavaScript origins

### Issue 2: "The requested action is invalid"
**Solutions:**
- Enable Google Sign-In in Firebase Console (it might just be "Added" not "Enabled")
- Configure OAuth consent screen in Google Cloud Console
- Check that Web client ID is properly configured
- Verify all redirect URIs are correct

### Issue 3: Popup doesn't open
**Solutions:**
- Check browser popup blocker
- Try in incognito mode
- Disable ad blockers temporarily
- Try a different browser

### Issue 4: "Configuration not found"
**Solution:**
- Google provider not enabled in Firebase Console
- Go to Authentication → Sign-in method → Enable Google

---

## 🔧 Quick Fix Commands

### Reset Authentication State (Browser Console)
```javascript
// Open browser console (F12) and run:
localStorage.clear();
sessionStorage.clear();
location.reload();
```

### Check Firebase Configuration (Browser Console)
```javascript
// Verify Firebase is initialized:
console.log('Firebase App:', firebase?.app()?.name);
console.log('Auth Domain:', firebase?.app()?.options?.authDomain);
```

---

## 📋 Checklist

Go through this checklist to ensure everything is configured:

- [ ] Google provider is **Enabled** (not just added) in Firebase Console
- [ ] Support email is set in Google provider configuration
- [ ] `localhost` is in Authorized domains list
- [ ] OAuth consent screen is configured in Google Cloud Console
- [ ] OAuth client has `http://localhost:3000` in JavaScript origins
- [ ] OAuth client has `http://localhost:3000/__/auth/handler` in redirect URIs
- [ ] Browser cache is cleared
- [ ] Tried in incognito mode
- [ ] No browser extensions blocking the popup

---

## 🔍 Debug Mode

To get more information about what's failing, check:

1. **Browser Console** (F12):
   - Look for red error messages
   - Check the "Network" tab for failed requests
   - Look for CORS errors

2. **Firebase Console Logs**:
   - Go to Firebase Console → Authentication → Users
   - Check if any sign-in attempts are showing up

3. **Google Cloud Console Logs**:
   - Go to Google Cloud Console → Logging
   - Search for OAuth-related errors

---

## 📞 Still Not Working?

If you've tried everything above and it's still not working:

1. **Recreate the OAuth Client:**
   - In Google Cloud Console → Credentials
   - Delete the auto-created OAuth client
   - Go to Firebase Console → Authentication
   - Disable Google provider
   - Re-enable Google provider (this creates a new OAuth client)
   - Reconfigure the authorized domains

2. **Check Project Settings:**
   - Ensure you're working in the correct Firebase project
   - Verify the project ID matches in Firebase Console and your code

3. **Test with Email/Password First:**
   - Verify basic Firebase Auth is working
   - Try creating an account with email/password
   - If that works, the issue is specific to Google Sign-In configuration

---

## ✅ Verification Steps

Once configured correctly, you should:

1. Click "Sign in with Google"
2. See a Google popup window open
3. See your Google accounts listed
4. Select an account
5. Be redirected to `/account` page
6. Be logged in (check Firebase Console → Authentication → Users)

---

## 🎯 Most Common Fix

**90% of the time, the issue is:**

1. Go to Firebase Console → Authentication → Sign-in method
2. Click on **Google** provider
3. Make sure the toggle at the top is **ENABLED** (blue/on)
4. Scroll down and click **"Save"** if you made any changes
5. Wait 30 seconds for changes to propagate
6. Clear browser cache
7. Try again

---

## 📝 Example Working Configuration

Your OAuth client should look like this:

**Authorized JavaScript origins:**
```
http://localhost
http://localhost:3000
https://binmokhtar2-967ad.firebaseapp.com
```

**Authorized redirect URIs:**
```
http://localhost:3000/__/auth/handler
https://binmokhtar2-967ad.firebaseapp.com/__/auth/handler
```

**Authorized domains (in Firebase):**
```
localhost
binmokhtar2-967ad.firebaseapp.com
```

Once everything matches this configuration, Google Sign-In should work! 🎉



