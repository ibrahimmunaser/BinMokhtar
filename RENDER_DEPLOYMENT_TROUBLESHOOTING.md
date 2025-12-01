# Render Deployment - 404 Errors for Next.js Files

## 🐛 Problem

Getting 404 errors for Next.js internal JavaScript files:
- `main-app.js` - 404
- `page.js` - 404  
- `app-pages-internals.js` - 404

This causes the page to render but JavaScript doesn't execute, so client-side features don't work.

---

## ✅ Solution

### **Step 1: Verify Build Output**

The build should generate these files in `.next/static/`. Check Render build logs:

```
✓ Generating static pages (46/46)
✓ Collecting build traces
✓ Finalizing page optimization
```

If build completes successfully, the files should be generated.

---

### **Step 2: Check Render Service Configuration**

In your Render dashboard:

1. **Go to your Web Service**
2. **Check "Static Publish Directory"** - Should be **EMPTY** (not set)
3. **Check "Build Command"** - Should be: `npm ci && npm run build`
4. **Check "Start Command"** - Should be: `npm start`

**⚠️ IMPORTANT:** 
- Do NOT set a "Static Publish Directory"
- Next.js serves static files automatically via `npm start`

---

### **Step 3: Verify Environment Variables**

Make sure these are set in Render:

**Required:**
- `NODE_ENV=production` (usually set automatically)
- `STRIPE_SECRET_KEY` (your Stripe key)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (your Stripe publishable key)
- `GOOGLE_MAPS_API_KEY` (for geocoding)
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (for autocomplete)
- Firebase config variables

**Optional but recommended:**
- `RESEND_API_KEY` (for emails)
- `STRIPE_WEBHOOK_SECRET` (for webhooks)

---

### **Step 4: Check Next.js Configuration**

Your `next.config.js` should NOT have:
- ❌ `basePath` (unless you need a subdirectory)
- ❌ `assetPrefix` (unless you're using a CDN)
- ❌ `output: 'export'` (this disables server-side features)

**Current config is correct** ✅

---

### **Step 5: Verify File Structure**

After build, `.next` folder should contain:
```
.next/
├── static/
│   ├── chunks/
│   │   ├── main-app.js ✅
│   │   ├── page.js ✅
│   │   └── app-pages-internals.js ✅
│   └── ...
├── server/
└── ...
```

---

### **Step 6: Check Render Logs**

Look for these in Render logs:

**✅ Good signs:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Generating static pages
```

**❌ Bad signs:**
```
✗ Failed to compile
✗ Error: Cannot find module
✗ Build failed
```

---

### **Step 7: Manual Fix - Rebuild**

If files are still 404ing:

1. **In Render Dashboard:**
   - Go to your service
   - Click "Manual Deploy"
   - Select "Clear build cache & deploy"

2. **Or via Render CLI:**
   ```bash
   render services:deploy --clear-cache
   ```

---

### **Step 8: Check Network Tab**

In browser DevTools → Network tab:

1. Look for requests to `/_next/static/...`
2. Check if they're returning 404 or being blocked
3. Check the request URL - should be relative, not absolute

**Expected:**
```
GET /_next/static/chunks/main-app.js ✅
```

**Problem:**
```
GET https://yourdomain.com/_next/static/chunks/main-app.js → 404 ❌
```

---

## 🔍 Common Causes

### **1. Static Publish Directory Set**

**Problem:** Render is trying to serve static files from a directory instead of using Next.js server.

**Fix:** Remove "Static Publish Directory" setting in Render dashboard.

---

### **2. Wrong Start Command**

**Problem:** Using `npm run dev` or `next dev` instead of `npm start`.

**Fix:** Set start command to `npm start` (runs `next start`).

---

### **3. Build Cache Corruption**

**Problem:** Cached build files are corrupted.

**Fix:** Clear build cache and rebuild.

---

### **4. Missing Environment Variables**

**Problem:** Build fails or behaves incorrectly without required env vars.

**Fix:** Add all required environment variables in Render dashboard.

---

### **5. Node Version Mismatch**

**Problem:** Using wrong Node.js version.

**Fix:** Set `NODE_VERSION=20` in Render environment variables.

---

## 📋 Quick Checklist

- [ ] Build completes successfully (check logs)
- [ ] "Static Publish Directory" is NOT set
- [ ] Start command is `npm start`
- [ ] Build command is `npm ci && npm run build`
- [ ] All environment variables are set
- [ ] Node version is 20
- [ ] `.next` folder exists after build
- [ ] No `basePath` or `assetPrefix` in `next.config.js`

---

## 🚀 Still Not Working?

1. **Check Render Status Page:** https://status.render.com
2. **Check Build Logs:** Look for any errors or warnings
3. **Try Local Build:** Run `npm run build && npm start` locally to verify
4. **Contact Render Support:** They can check server configuration

---

## 📝 Notes

- Next.js automatically serves static files from `/_next/static/`
- The server (`npm start`) handles routing and static file serving
- Don't use `output: 'export'` - it disables server features
- Static files are generated during `npm run build`

---

## ✅ After Fix

Once fixed, you should see:
- ✅ No 404 errors in console
- ✅ JavaScript executes properly
- ✅ Client-side features work
- ✅ Products load correctly
- ✅ Navigation works

