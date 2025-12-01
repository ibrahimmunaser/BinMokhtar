# Google Maps Autocomplete - Troubleshooting Guide

## 🐛 Common Issues & Solutions

---

## Issue 1: No Dropdown Suggestions Appear

### **Symptoms:**
- You type in the address field
- No dropdown list appears
- No suggestions show up

### **Possible Causes & Fixes:**

#### **1. Missing API Key**

**Check your `.env.local` file:**

```bash
# Make sure BOTH of these are present:
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE  ← This one is REQUIRED
```

**⚠️ IMPORTANT:** Both should have the **SAME VALUE** (your Google Maps API key)

**Fix:**
1. Open `.env.local`
2. Add the line: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE`
3. **Restart your dev server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

---

#### **2. Places API Not Enabled**

**Check Google Cloud Console:**

1. Go to: https://console.cloud.google.com/
2. Select your project
3. Go to: **APIs & Services** → **Library**
4. Search for: **"Places API"**
5. Click on it
6. Click **"ENABLE"** if not already enabled

**Also enable:**
- ✅ **Maps JavaScript API**
- ✅ **Places API**
- ✅ **Geocoding API**

---

#### **3. API Key Restrictions**

**If your key has restrictions:**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your API key
3. Check **"Application restrictions":**
   - If set to "HTTP referrers": Add `localhost:3000/*`
   - If set to "IP addresses": Change to "HTTP referrers" for development
4. Check **"API restrictions":**
   - Make sure these are allowed:
     - ✅ Maps JavaScript API
     - ✅ Places API
     - ✅ Geocoding API
5. Click **"Save"**

---

## Issue 2: "undefined" Error When Selecting Address

### **Symptoms:**
- You select an address from dropdown
- Get "undefined" error
- No delivery check happens

### **Possible Causes & Fixes:**

#### **1. Pressing Enter Instead of Clicking**

**The Problem:**
- You type an address
- Press **Enter** key
- Instead of clicking a suggestion from the dropdown

**The Fix:**
- ✅ **Always click/tap a suggestion** from the dropdown list
- ❌ **Don't press Enter** without selecting

**Why:** Google's Autocomplete API only returns full address data when you select from the dropdown.

---

#### **2. Check Browser Console**

**Open browser console:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click **"Console"** tab
3. Look for error messages

**What to look for:**

✅ **Good messages:**
```
✅ Google Maps API key found, loading script...
✅ Google Maps script loaded successfully
🔧 Initializing Google Places Autocomplete...
✅ Autocomplete initialized successfully
📝 Start typing an address - suggestions should appear
```

❌ **Error messages:**
```
❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set
❌ Failed to load Google Maps script
❌ Error initializing autocomplete
```

---

## Issue 3: Script Loading Failures

### **Symptoms:**
- "Loading address search..." never goes away
- Input field stays disabled
- Red error banner appears

### **Possible Causes & Fixes:**

#### **1. Invalid API Key**

**Check:**
1. Copy your API key from `.env.local`
2. Go to: https://console.cloud.google.com/apis/credentials
3. Verify the key matches exactly
4. Check if key is enabled (not disabled/deleted)

#### **2. Billing Not Enabled**

**Check Google Cloud Console:**
1. Go to: **Billing** section
2. Make sure billing is enabled for your project
3. Google Maps APIs require billing (but have free tier)

**Free Tier:**
- First $200/month is free
- Plenty for development and small sites

#### **3. CORS/Network Issues**

**Check:**
1. Open browser console → **Network** tab
2. Look for failed requests to `maps.googleapis.com`
3. Check if they're blocked or returning errors

---

## Issue 4: Autocomplete Stops Working After Typing

### **Symptoms:**
- You can type first character
- Then input freezes/resets

### **Fix:**
✅ **Already fixed in latest version**

The component now uses `useCallback` and prevents re-initialization.

**If still happening:**
1. Make sure you have the latest code
2. Clear browser cache
3. Restart dev server

---

## Debugging Checklist

### **Step 1: Check Environment Variable**

Open terminal in project root:

```bash
# Windows PowerShell
Get-Content .env.local | Select-String "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"

# Mac/Linux
cat .env.local | grep "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"
```

**Expected output:**
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-key-here
```

**If empty/not found:**
- Add the line to `.env.local`
- Restart dev server

---

### **Step 2: Check Browser Console**

1. Open checkout page: `http://localhost:3000/checkout`
2. Click "Delivery"
3. Open browser console (F12)
4. Look for these messages:

**✅ Success:**
```
✅ Google Maps API key found, loading script...
✅ Google Maps script loaded successfully
🔧 Initializing Google Places Autocomplete...
✅ Autocomplete initialized successfully
```

**❌ Errors:**
```
❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set
```
→ Add to `.env.local` and restart

```
❌ Failed to load Google Maps script
```
→ Check API key validity and billing

```
❌ Error initializing autocomplete: ...
```
→ Check Places API is enabled

---

### **Step 3: Test Address Input**

1. Click in the address field
2. Type: **"1600 Amphitheatre"**
3. **Expected:** Dropdown appears with "1600 Amphitheatre Parkway, Mountain View, CA" and similar addresses

**If dropdown appears:**
✅ Autocomplete is working!

**If no dropdown:**
1. Check console for errors
2. Verify Places API is enabled
3. Check API key restrictions

---

### **Step 4: Test Address Selection**

1. Type an address
2. **Click** one of the suggestions (don't press Enter)
3. **Expected:** 
   - Input fills with full address
   - Loading spinner appears briefly
   - Green or red status message appears

**If "undefined" error:**
- You pressed Enter instead of clicking
- Try again and **click** the suggestion

---

## Quick Fix Commands

### **Restart Everything:**

```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clear Next.js cache
rm -rf .next

# 3. Restart
npm run dev
```

### **Verify Environment Variables:**

```bash
# Show all NEXT_PUBLIC_ variables
# Windows PowerShell:
Get-Content .env.local | Select-String "NEXT_PUBLIC"

# Mac/Linux:
cat .env.local | grep "NEXT_PUBLIC"
```

---

## Expected Behavior

### **1. Initial Load:**
```
⏳ Loading address search...
```

### **2. Ready State:**
```
✓ Ready! Type your address and select from the dropdown list
```

### **3. While Typing:**
- Dropdown appears below input
- Shows matching addresses
- Updates as you type

### **4. After Selecting:**
- Input filled with full address
- Loading spinner appears
- Delivery check runs
- Green or red message appears

---

## Still Not Working?

### **Check These:**

1. **API Key Format:**
   - Should start with `AIza`
   - Should be ~39 characters long
   - No spaces or quotes

2. **Project Root:**
   - `.env.local` should be in project root
   - Not in subdirectories

3. **File Name:**
   - Exactly `.env.local`
   - Not `.env` or `env.local`

4. **Server Restart:**
   - Environment variable changes require restart
   - Stop and restart dev server

5. **Browser Cache:**
   - Clear cache or use incognito mode
   - Hard refresh: `Ctrl+Shift+R` (or `Cmd+Shift+R`)

---

## Test API Key Directly

### **Quick Test:**

Open browser console and run:

```javascript
// Test if API key is available
console.log('API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

// If undefined: API key not set
// If shows key: API key is loaded
```

---

## Contact Information

If still having issues:

1. Check browser console for specific error messages
2. Check Google Cloud Console for API status
3. Verify billing is enabled
4. Check API quotas haven't been exceeded

---

## Summary

### **Most Common Fix:**

```bash
# 1. Add to .env.local:
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE

# 2. Restart dev server:
npm run dev

# 3. Refresh browser
```

**That fixes 90% of issues!** 🎉

