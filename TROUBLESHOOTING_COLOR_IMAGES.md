# Troubleshooting: Color Images Not Updating

## The Root Cause

When you edited products **before** the fix was implemented, the `colorImageMappings` field was not being saved to Firestore. This means:

- Your new images were uploaded ✓
- But the color-to-image associations were lost ✗

## Quick Fix Steps

### 1. Wait for Dev Server to Build
The dev server is currently rebuilding. Wait until you see:
```
✓ Ready in X.Xs
```

### 2. Re-Edit the Product in Admin

1. Go to `http://localhost:3001/admin/products`
2. Click **Edit** on the product with image issues
3. Scroll down to **"Color Image Mapper"** section
4. For each color, select which images should show:
   - Click the color button (e.g., "White", "Black")
   - Select the correct images from your uploaded images
   - Repeat for each color
5. Click **Update Product**
6. Wait for success message

### 3. View Product Page

1. Go to the product page (e.g., `http://localhost:3001/product/product-slug`)
2. You should see a blue **"🔄 Refresh Data"** button at the top
3. Click it to force reload the data
4. Open browser console (F12) and check the logs:
   ```
   Product colorImageMappings: [
     { color: "White", imageUrls: [...] },
     { color: "Black", imageUrls: [...] }
   ]
   ```
5. Now select different colors - should show correct images!

## What Changed in the Code

### Before Fix:
```typescript
// colorImageMappings was NOT included
const productData = {
  images: body.images,
  colors: colors,
  // colorImageMappings: ❌ MISSING!
};
```

### After Fix:
```typescript
// colorImageMappings is now saved
const productData = {
  images: body.images,
  colors: colors,
  colorImageMappings: body.colorImageMappings || [], // ✓ SAVED!
};
```

## Debug Console Output

### Good Output (Working):
```
Product colorImageMappings: [
  {
    color: "White",
    imageUrls: [
      "https://firebasestorage.googleapis.com/.../image1.jpg",
      "https://firebasestorage.googleapis.com/.../image2.jpg"
    ]
  },
  {
    color: "Black",
    imageUrls: [
      "https://firebasestorage.googleapis.com/.../image3.jpg"
    ]
  }
]
Selected color: "White"
```

### Bad Output (Needs Re-Edit):
```
Product colorImageMappings: []  // Empty!
Selected color: "White"
```

If you see empty `[]`, the product needs to be re-edited in admin.

## Why This Happens

1. **First time editing** → colorImageMappings not saved (old code bug)
2. **Code fixed** → Now saves colorImageMappings
3. **But database still has old data** → Need to re-edit to save new mappings
4. **After re-edit** → Mappings saved, colors work correctly

## Future Edits

All future product edits will work correctly without this issue since the code is now fixed!

---

**Current Status**: 
- ✓ Code Fixed
- ✓ Cache Invalidation Added  
- ✓ Auto-refresh Enabled
- ⚠️ Need to re-edit existing products that were edited before the fix



