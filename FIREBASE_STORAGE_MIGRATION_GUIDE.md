# Firebase Storage Migration Guide

## Overview

This guide will help you migrate all images from local `/public/images` to Firebase Storage and update your application to load them from there.

## Benefits of Using Firebase Storage

- ✅ **CDN**: Images served from Google's global CDN (faster)
- ✅ **Scalability**: No need to deploy images with each update
- ✅ **Bandwidth**: Offload bandwidth from your main server
- ✅ **Reliability**: 99.95% uptime SLA
- ✅ **Optimization**: Automatic image optimization available

---

## Step 1: Enable Firebase Storage

### 1.1 Go to Firebase Console

Open your Firebase project:
```
https://console.firebase.google.com/project/binmokhtar2-967ad/storage
```

### 1.2 Initialize Storage

1. Click **"Get Started"** button
2. Review the security rules (we'll customize them next)
3. Click **"Next"**
4. **Choose location**: Select same region as your Firestore (recommended)
   - Example: `us-central1` or `us-east1`
5. Click **"Done"**

### 1.3 Set Security Rules

After initialization, go to the **Rules** tab and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Public read access for images folder (served to website visitors)
    match /images/{allPaths=**} {
      allow read: if true;  // Anyone can read
      allow write: if false; // Only server-side can write
    }
    
    // Admin-only product images
    match /products/{allPaths=**} {
      allow read: if true;
      allow write: if false; // Only server-side can write
    }
    
    // Default: deny all other access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Click **"Publish"** to save the rules.

---

## Step 2: Upload All Images

Once Firebase Storage is enabled, run the upload script:

```bash
node scripts/upload-images-to-firebase.js
```

**What this does:**
1. Scans all images in `/public/images`
2. Uploads them to Firebase Storage
3. Makes them publicly accessible
4. Saves URLs to `firebase-image-urls.json`

**Expected output:**
```
═══════════════════════════════════════════════
📸 Firebase Storage Image Upload
═══════════════════════════════════════════════

✅ Uploaded: images/hero.png
✅ Uploaded: images/hero-emirati.png
...

═══════════════════════════════════════════════
✅ Upload Complete!
═══════════════════════════════════════════════
📊 Total files uploaded: 35
📦 Total size: 12.45 MB
⏱️  Duration: 15.23s
```

---

## Step 3: Update Code to Use Firebase URLs

### 3.1 Check Generated URLs

Open `firebase-image-urls.json` to see all uploaded images and their URLs:

```json
{
  "uploadedAt": "2025-12-06T...",
  "bucket": "binmokhtar2-967ad.appspot.com",
  "files": [
    {
      "path": "images/hero.png",
      "url": "https://storage.googleapis.com/binmokhtar2-967ad.appspot.com/images/hero.png",
      "size": 123456
    }
  ]
}
```

### 3.2 Update Image Paths in Code

I'll help you update the code to use Firebase Storage URLs. You have two options:

**Option A: Direct URLs (Simple)**
Replace local paths with Firebase URLs directly in your code.

**Option B: Environment Variable (Recommended)**
Add a base URL to environment variables and prepend it to image paths.

Add to `.env.local` and Render:
```env
NEXT_PUBLIC_IMAGE_BASE_URL=https://storage.googleapis.com/binmokhtar2-967ad.appspot.com
```

Then update image components:
```tsx
// Before:
<Image src="/images/hero.png" />

// After:
const imageBaseUrl = process.env.NEXT_PUBLIC_IMAGE_BASE_URL || '';
<Image src={`${imageBaseUrl}/images/hero.png`} />
```

---

## Step 4: Update Specific Files

Files that need updating:

### Homepage (`app/page.tsx`)
```tsx
// Update hero slide image
src: `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/images/home-page-mens-thobe.png`
```

### Category Pages (`app/category/[slug]/page.tsx`)
```tsx
const CATEGORY_HERO_CONFIG = {
  'men': { 
    image: `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/images/home-page-mens-thobe.png`,
    position: 'center 20%' 
  },
  // ... other categories
}
```

### Product Images
When uploading product images through admin panel, they'll automatically go to Firebase Storage.

---

## Step 5: Deploy to Production

1. **Add environment variable to Render:**
   ```
   NEXT_PUBLIC_IMAGE_BASE_URL=https://storage.googleapis.com/binmokhtar2-967ad.appspot.com
   ```

2. **Commit and push changes:**
   ```bash
   git add .
   git commit -m "Migrate images to Firebase Storage"
   git push origin main
   ```

3. **Render will auto-deploy**

---

## Step 6: Verify Everything Works

1. **Check image loading:**
   - Visit your website
   - Open DevTools → Network tab
   - Verify images load from `storage.googleapis.com`

2. **Check performance:**
   - Images should load faster (served from CDN)
   - No 404 errors

---

## Rollback Plan

If something goes wrong, you can quickly rollback:

1. **Remove environment variable** from Render
2. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

Images will load from local `/public/images` again.

---

## Next Steps After Migration

### Optimize Images (Optional)

Consider using Firebase Image Resize extension:
```
https://console.firebase.google.com/project/binmokhtar2-967ad/extensions
```

Search for: **Resize Images**

This automatically creates optimized versions (thumbnails, webp format, etc.)

### Monitor Storage Usage

Check your storage usage:
```
https://console.firebase.google.com/project/binmokhtar2-967ad/storage/usage
```

Firebase free tier includes:
- 5 GB storage
- 1 GB/day download bandwidth

If you exceed this, you'll need to upgrade to Blaze (pay-as-you-go) plan.

---

## Troubleshooting

### Issue: "Bucket does not exist"
**Solution:** Make sure you completed Step 1 (Enable Firebase Storage)

### Issue: Images not loading
**Solution:** 
1. Check storage rules allow public read
2. Verify URLs in `firebase-image-urls.json`
3. Check browser console for errors

### Issue: CORS errors
**Solution:** Add CORS configuration to bucket:
```bash
# Create cors.json:
[
  {
    "origin": ["https://binmukhtarretail.com", "https://*.onrender.com"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]

# Apply:
gsutil cors set cors.json gs://binmokhtar2-967ad.appspot.com
```

---

## Summary Checklist

- [ ] Step 1: Enable Firebase Storage in console
- [ ] Step 2: Run upload script
- [ ] Step 3: Verify all images uploaded (check firebase-image-urls.json)
- [ ] Step 4: Add NEXT_PUBLIC_IMAGE_BASE_URL to environment
- [ ] Step 5: Update code to use Firebase URLs
- [ ] Step 6: Deploy to production
- [ ] Step 7: Test website - verify images load correctly
- [ ] Step 8: (Optional) Remove old images from /public/images

---

**Ready to start?** Enable Firebase Storage first (Step 1), then let me know and I'll help with the rest!

