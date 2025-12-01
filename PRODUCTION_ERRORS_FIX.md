# Production Errors Fix Guide

## 🐛 **Errors You're Seeing:**

1. **React Error #425** - Hydration mismatch
2. **React Error #418** - useLayoutEffect issue  
3. **React Error #423** - useInsertionEffect issue
4. **Google Maps API Key Not Found** - Environment variable missing in production

---

## ✅ **Fixes Applied:**

### **1. Fixed Hydration Mismatches**

**Problem:** Components accessing `localStorage` during server-side rendering caused hydration mismatches.

**Fixed:**
- ✅ `contexts/LocaleContext.tsx` - Added proper client-side guards
- ✅ `components/layout/LocaleCurrencySwitch.tsx` - Added window checks
- ✅ All localStorage access now guarded with `typeof window !== 'undefined'`

---

### **2. Google Maps API Key - Production Setup**

**Problem:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` is not set in Render environment variables.

**Fix Required:**

1. **Go to Render Dashboard**
2. **Click your Web Service**
3. **Go to "Environment" tab**
4. **Add this variable:**

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
```

5. **Also add (if not already set):**

```bash
GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989
DELIVERY_RADIUS_MILES=15
```

6. **Save and wait for redeploy**

---

## 🔍 **What These React Errors Mean:**

### **React Error #425 - Hydration Mismatch**
- **Cause:** Server-rendered HTML doesn't match client-rendered HTML
- **Common causes:** localStorage, Date.now(), Math.random(), window/document access
- **Fixed:** Added proper client-side guards

### **React Error #418 - useLayoutEffect**
- **Cause:** useLayoutEffect called during SSR
- **Fixed:** Components now check `typeof window !== 'undefined'`

### **React Error #423 - useInsertionEffect**
- **Cause:** useInsertionEffect called during SSR
- **Fixed:** Proper client-side guards added

---

## 📋 **Complete Render Environment Variables Checklist**

Make sure ALL of these are set in Render:

### **Required:**
```bash
# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989
DELIVERY_RADIUS_MILES=15

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend (for emails)
RESEND_API_KEY=re_...

# Firebase (all your Firebase variables)
FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_API_KEY=...
# ... etc
```

---

## 🧪 **Testing After Fix:**

1. **Wait for Render to redeploy** (after adding env vars)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Check browser console** - should see:
   - ✅ No React errors
   - ✅ `✅ Google Maps API key found, loading script...`
4. **Test address autocomplete** - should work
5. **Test checkout** - should work without errors

---

## 🚨 **If Errors Persist:**

### **1. Clear Build Cache on Render:**
- Go to Render Dashboard
- Click "Manual Deploy"
- Select "Clear build cache & deploy"

### **2. Check Render Logs:**
- Look for any build errors
- Check for missing environment variables
- Verify all variables are set correctly

### **3. Verify Environment Variables:**
- Make sure variable names are EXACT (case-sensitive)
- No extra spaces around `=`
- No quotes around values
- Values are correct

---

## ✅ **Summary:**

**Fixed:**
- ✅ Hydration mismatches (localStorage access)
- ✅ Client-side guards added
- ✅ Import errors fixed

**Action Required:**
- ⚠️ Add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to Render environment variables
- ⚠️ Redeploy after adding variables

**After adding the Google Maps API key to Render and redeploying, all errors should be resolved!** 🎉

