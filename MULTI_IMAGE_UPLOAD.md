# Multi-Image Upload Feature

## 🎉 Overview

The product creation form now supports **unlimited image uploads** for each product!

---

## ✨ New Features

### 1. **Multiple Image Upload**
- Upload as many images as you want for a single product
- No limit on the number of images
- Each image can be up to 5MB

### 2. **Drag to Reorder**
- Reorder images using arrow buttons
- First image is automatically set as the main product image
- Visual "Main" badge on the first image

### 3. **Image Management**
- Remove individual images
- Move images left or right
- See image count at a glance
- Preview all images in a grid

### 4. **Batch Upload**
- Select multiple files at once
- Upload progress indicator
- Shows "Uploading X of Y..."

### 5. **Visual Feedback**
- Image grid with thumbnails
- Hover effects with controls
- Image numbers for easy reference
- Main image clearly marked

---

## 🎯 How It Works

### Uploading Images

**Option 1: Click to Upload**
1. Click the upload area
2. Select one or multiple images
3. Wait for upload to complete
4. Images appear in the grid

**Option 2: Drag and Drop**
1. Drag image files from your computer
2. Drop them onto the upload area
3. Wait for upload to complete
4. Images appear in the grid

**Option 3: Upload More**
- After uploading, click the upload area again
- Add more images to the existing ones
- No limit on total images

### Managing Images

**Reordering Images**
- Hover over an image
- Click the left arrow (←) to move left
- Click the right arrow (→) to move right
- First image is always the main image

**Removing Images**
- Hover over an image
- Click the red X button
- Image is removed immediately

**Main Image**
- The first image is the main product image
- Shows a "Main" badge
- This is the image shown in product listings
- Reorder images to change the main image

---

## 📐 Visual Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Product Images *                              (3 images)   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         📤 Upload Icon                                │ │
│  │                                                       │ │
│  │    Click to upload or drag and drop                  │ │
│  │    PNG, JPG, GIF up to 5MB (multiple files allowed)  │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  Uploaded Images                                            │
│  Drag to reorder • First image is the main image           │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │
│  │ [Main]  │  │         │  │         │  │         │       │
│  │         │  │         │  │         │  │         │       │
│  │ Image 1 │  │ Image 2 │  │ Image 3 │  │ Image 4 │       │
│  │         │  │         │  │         │  │         │       │
│  │    1    │  │    2    │  │    3    │  │    4    │       │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
│  On hover: [←] [X] [→] buttons appear                      │
│                                                             │
│  💡 Tip: The first image will be used as the main product  │
│     image. Use the arrow buttons to reorder.               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 Features in Detail

### Upload Area
- **State**: Default / Uploading / Error
- **Multiple Files**: Yes, select as many as you want
- **Drag & Drop**: Fully supported
- **File Types**: PNG, JPG, GIF
- **Max Size**: 5MB per image
- **Progress**: Shows "Uploading X of Y..."

### Image Grid
- **Layout**: Responsive grid (2-4 columns)
- **Aspect Ratio**: 3:4 (portrait)
- **Main Badge**: Shows on first image
- **Image Number**: Shows on each image
- **Hover Controls**: Arrow buttons + Remove button

### Controls
- **Move Left (←)**: Available on all except first
- **Move Right (→)**: Available on all except last
- **Remove (X)**: Available on all images
- **Reorder**: Instant, no save needed

### Validation
- **Required**: At least 1 image
- **File Type**: Must be image
- **File Size**: Max 5MB per image
- **Error Messages**: Clear and helpful

---

## 💾 Data Storage

### Firestore Schema
```typescript
{
  images: string[];        // Array of all image URLs
  image: string;           // First image (main) for backward compatibility
  thumbnail: string;       // First image (main) for backward compatibility
  // ... other fields
}
```

### Example
```json
{
  "images": [
    "https://storage.googleapis.com/.../image1.jpg",
    "https://storage.googleapis.com/.../image2.jpg",
    "https://storage.googleapis.com/.../image3.jpg"
  ],
  "image": "https://storage.googleapis.com/.../image1.jpg",
  "thumbnail": "https://storage.googleapis.com/.../image1.jpg"
}
```

---

## 🔄 Workflow

```
1. User clicks upload area or drags files
   ↓
2. Files are validated (type, size)
   ↓
3. Each file is uploaded to Firebase Storage
   ↓
4. Progress shown: "Uploading 1 of 3..."
   ↓
5. URLs are added to images array
   ↓
6. Images appear in grid
   ↓
7. User can reorder or remove images
   ↓
8. First image is set as main image
   ↓
9. Form submits with all image URLs
```

---

## ✅ Benefits

### For Admins
- ✅ Upload multiple product photos at once
- ✅ Show different angles and details
- ✅ Easy to reorder images
- ✅ Quick to remove unwanted images
- ✅ Clear visual feedback

### For Customers
- ✅ See multiple product views
- ✅ Better understanding of product
- ✅ More confidence in purchase
- ✅ Gallery view on product page

### For Business
- ✅ Professional product presentation
- ✅ Reduced returns (better expectations)
- ✅ Increased conversions
- ✅ Better product showcase

---

## 🎯 Best Practices

### Image Quality
- Use high-resolution images (800x1000px or larger)
- Consistent lighting across all images
- Clean, professional backgrounds
- Clear product visibility

### Image Order
1. **Main Image**: Front view, best angle
2. **Second Image**: Side or back view
3. **Third Image**: Detail shot (fabric, buttons, etc.)
4. **Fourth Image**: Model wearing product (if applicable)
5. **Additional Images**: Other angles, close-ups, etc.

### Number of Images
- **Minimum**: 1 image (required)
- **Recommended**: 3-5 images
- **Maximum**: No limit, but 5-8 is ideal
- **Too Many**: Can overwhelm customers

### File Optimization
- Compress images before upload
- Use JPEG for photos
- Use PNG for graphics with transparency
- Keep file size under 2MB when possible (max 5MB)

---

## 🔧 Technical Details

### Component
- **File**: `components/admin/MultiImageUpload.tsx`
- **Type**: React functional component
- **Props**: label, name, required, error, value, onChange
- **State**: uploading, uploadError, uploadProgress

### Features
- Multiple file selection
- Drag and drop support
- Upload progress tracking
- Image reordering (move left/right)
- Image removal
- Visual feedback (hover states)
- Error handling
- Empty state

### API Integration
- **Endpoint**: `/api/admin/upload`
- **Method**: POST
- **Body**: FormData with file
- **Response**: `{ success: true, url: string }`
- **Storage**: Firebase Storage

---

## 📱 Responsive Design

### Desktop (≥1024px)
- 4 images per row
- Larger thumbnails
- Hover controls

### Tablet (768px - 1023px)
- 3 images per row
- Medium thumbnails
- Touch-friendly controls

### Mobile (<768px)
- 2 images per row
- Smaller thumbnails
- Touch-optimized

---

## 🎨 UI States

### Empty State
```
┌─────────────────────────────┐
│      📷 Icon                │
│                             │
│  No images uploaded yet     │
│  Upload one or more images  │
│  to get started             │
└─────────────────────────────┘
```

### Uploading State
```
┌─────────────────────────────┐
│      ⏳ Spinner             │
│                             │
│  Uploading 2 of 5...        │
└─────────────────────────────┘
```

### Error State
```
┌─────────────────────────────┐
│  ❌ File is too large.      │
│     Maximum size is 5MB     │
└─────────────────────────────┘
```

### Success State
```
Grid of uploaded images with:
- Main badge on first image
- Image numbers
- Hover controls
- Helper text
```

---

## 🚀 Usage Example

### Creating a Product with Multiple Images

1. **Fill in basic info** (title, price, etc.)
2. **Click upload area**
3. **Select 5 product images** from your computer
4. **Wait for upload** (shows progress)
5. **Images appear in grid**
6. **Reorder if needed** (move best image to first position)
7. **Remove any unwanted images**
8. **Continue with rest of form**
9. **Submit**

Result: Product saved with 5 images, first one as main image!

---

## 💡 Tips & Tricks

### Quick Upload
- Select all images at once for faster upload
- Use Ctrl+Click (Windows) or Cmd+Click (Mac) to select multiple files

### Reordering
- Move your best image to the first position
- Customers see the first image in listings
- Other images show in product gallery

### Removing
- Remove blurry or low-quality images
- Keep only the best product shots
- Quality over quantity

### Organizing
- Upload images in order if possible
- Less reordering needed
- Faster workflow

---

## 🔍 Troubleshooting

### Images won't upload
- Check file size (max 5MB each)
- Verify file type (PNG, JPG, GIF only)
- Check internet connection
- Try uploading one at a time

### Can't reorder images
- Hover over image to see controls
- First image can't move left
- Last image can't move right
- Click arrow buttons to move

### Images not showing
- Wait for upload to complete
- Check for error messages
- Refresh the page
- Try uploading again

---

## ✅ Comparison: Before vs After

### Before (Single Image)
- ❌ Only 1 image per product
- ❌ No way to show multiple angles
- ❌ Limited product presentation
- ❌ Customers couldn't see details

### After (Multiple Images)
- ✅ Unlimited images per product
- ✅ Show all angles and details
- ✅ Professional presentation
- ✅ Better customer experience
- ✅ Easy to manage and reorder

---

## 🎉 Summary

The multi-image upload feature provides:
- ✅ **Unlimited images** per product
- ✅ **Easy reordering** with arrow buttons
- ✅ **Batch upload** for efficiency
- ✅ **Visual management** with grid view
- ✅ **Professional presentation** for products

**Your products can now shine with multiple high-quality images!** 📸✨


