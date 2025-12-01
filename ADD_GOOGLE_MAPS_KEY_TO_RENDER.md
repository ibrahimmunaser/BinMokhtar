# Add Google Maps API Key to Render - Step by Step

## 🎯 **Problem:**
- ✅ Works locally (Cursor/browser) - API key is in `.env.local`
- ❌ Doesn't work on production (Render) - API key not set in Render

---

## ✅ **Solution: Add to Render Environment Variables**

### **Step 1: Get Your API Key**

Your API key is: `AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM`

(You can also find it in your `.env.local` file)

---

### **Step 2: Go to Render Dashboard**

1. **Open:** https://dashboard.render.com
2. **Sign in** to your account
3. **Click** on your Web Service (the one hosting your site)

---

### **Step 3: Add Environment Variable**

1. **Click** the **"Environment"** tab (in the left sidebar)
2. **Click** the **"Add Environment Variable"** button
3. **Fill in:**
   - **Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM`
4. **Click** "Save Changes"

---

### **Step 4: Also Add Backend Key (if not already added)**

1. **Click** "Add Environment Variable" again
2. **Fill in:**
   - **Key:** `GOOGLE_MAPS_API_KEY`
   - **Value:** `AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM`
   - (Same value, different variable name)
3. **Click** "Save Changes"

---

### **Step 5: Add Store Location (if not already added)**

Add these three variables:

```bash
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989
DELIVERY_RADIUS_MILES=15
```

---

### **Step 6: Wait for Redeploy**

- Render will **automatically redeploy** after you save environment variables
- Wait **1-2 minutes** for deployment to complete
- You'll see a notification when it's done

---

### **Step 7: Test**

1. **Go to your production site** (the Render URL)
2. **Navigate to checkout page**
3. **Click "Delivery"**
4. **Type an address** - autocomplete should work now! ✅

---

## 📋 **Complete List of Google Maps Variables for Render**

Make sure ALL of these are set:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989
DELIVERY_RADIUS_MILES=15
```

---

## 🔍 **How to Verify It's Set**

### **In Render Dashboard:**
1. Go to **Environment** tab
2. Look for `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. Value should show as `•••••` (hidden for security)
4. If you see it listed = ✅ Set correctly

### **After Deployment:**
1. Go to your production site
2. Open browser console (F12)
3. You should see: `✅ Google Maps API key found, loading script...`
4. If you see: `❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set` = Not set correctly

---

## ⚠️ **Important Notes**

### **Why Two Variables?**

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Used by **frontend** (browser) for autocomplete
- `GOOGLE_MAPS_API_KEY` - Used by **backend** (server) for geocoding

**Both should have the SAME value** (your Google Maps API key)

### **Why It Works Locally But Not in Production?**

- **Local:** Reads from `.env.local` file ✅
- **Production:** Must be set in Render environment variables ❌ (if not set)

**They are separate!** Setting it locally doesn't automatically set it in Render.

---

## 🐛 **Troubleshooting**

### **Still Not Working After Adding?**

1. **Check variable name** - Must be EXACT: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
2. **Check for typos** - No extra spaces around `=`
3. **Wait for redeploy** - Can take 1-2 minutes
4. **Clear browser cache** - Ctrl+Shift+R
5. **Check Render logs** - Look for any errors

### **Check Render Logs:**

1. Go to Render Dashboard
2. Click **"Logs"** tab
3. Look for:
   - ✅ `✅ Google Maps API key found` = Working!
   - ❌ `❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set` = Not set correctly

---

## ✅ **Quick Checklist**

- [ ] Opened Render Dashboard
- [ ] Went to Environment tab
- [ ] Added `NEXT_PUBLE_MAPS_API_KEY` (with correct value)
- [ ] Added `GOOGLE_MAPS_API_KEY` (with correct value)
- [ ] Added `STORE_LAT`, `STORE_LNG`, `DELIVERY_RADIUS_MILES`
- [ ] Saved changes
- [ ] Waited for redeploy (1-2 minutes)
- [ ] Tested on production site
- [ ] Address autocomplete works ✅

---

## 🎉 **That's It!**

Once you add `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` to Render and it redeploys, the Google Maps autocomplete will work on your production site just like it does locally!

