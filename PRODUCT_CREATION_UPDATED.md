# Product Creation Form - Updated

## Overview
The admin product creation form at `/admin/products/create` has been updated with the following changes:

## Changes Made

### 1. Image Upload
- **Before**: Text input for image URL
- **After**: File upload button with drag-and-drop support
- Features:
  - Upload images directly from PC
  - Drag and drop support
  - Image preview before submission
  - File validation (max 5MB, image types only)
  - Visual feedback during upload
  - Remove/replace functionality

### 2. Category System
- **Before**: Single category dropdown
- **After**: Two-tier category system (Category → Subcategory)
- Categories and Subcategories:
  - **Thobes**: Long Sleeve, Short Sleeve
  - **Shemagh**: Traditional, Modern, Premium
  - **Accessories**: Caps, Belts, Fragrance, Other
  - **Women**: Abayas, Hijabs, Modest Wear
  - **Children**: Boys, Girls, Toddler
- Subcategory dropdown is disabled until a category is selected

### 3. Brand Field
- **Removed**: Brand field has been removed from the form

### 4. Sale Price
- **Added**: New optional "Sale Price" field
- Appears next to the regular price field
- Optional field for discounted pricing

### 5. Size Selection
- **Before**: Not present
- **After**: Multi-select dropdown for sizes
- Options: XS, S, M, L, XL, XXL, 3XL, 4XL
- Required field (at least 1 size must be selected)
- Selected sizes appear as chips/badges
- Click outside to close dropdown

### 6. Color Selection
- **Before**: Not present
- **After**: Multi-select dropdown for colors
- Options: White, Black, Beige, Brown, Navy, Grey, Cream, Olive
- Required field (at least 1 color must be selected)
- Selected colors appear as chips/badges
- Click outside to close dropdown

## Components Created

### ImageUpload.tsx
- Handles file upload from PC
- Shows upload progress
- Displays image preview
- Integrates with `/api/admin/upload` endpoint

### MultiSelect.tsx
- Reusable multi-select dropdown component
- Shows selected items as chips
- Click to toggle selection
- Used for both sizes and colors

## Form Validation

Updated validation rules:
- Title: min 4 characters (required)
- Price: must be > 0 (required)
- Sale Price: must be > 0 (optional)
- Image: required (uploaded file)
- Category: required
- Subcategory: required
- Sizes: at least 1 required
- Colors: at least 1 required
- Tags: at least 2 required
- Orders/Views: default to 0
- Stock: optional, non-negative
- Rating: optional, 0-5
- Reviews: optional, non-negative

## Firestore Schema

Products are saved with this structure:
```typescript
{
  title: string;
  price: number;
  salePrice?: number;        // NEW
  image: string;             // Now a Firebase Storage URL
  category: string;
  subcategory: string;       // NEW
  sizes: string[];           // NEW
  colors: string[];          // NEW
  tags: string[];
  orders: number;
  views: number;
  rating?: number;
  numReviews?: number;
  stock?: number;
  createdAt: Timestamp;
}
```

## Usage

1. Navigate to `/admin/products/create`
2. Fill in the required fields:
   - Product title
   - Price (and optionally sale price)
   - Select category and subcategory
   - Upload product image from PC
   - Select at least 1 size
   - Select at least 1 color
   - Add at least 2 tags
3. Optionally fill in metrics (orders, views, stock, rating, reviews)
4. Click "Create Product"
5. Success message will appear and form will reset after 2 seconds

## File Structure

```
components/admin/
├── CreateProductForm.tsx      (main form component)
├── ImageUpload.tsx           (file upload component)
├── MultiSelect.tsx           (multi-select dropdown)
├── ProductFormField.tsx      (text/number inputs)
└── TagsInput.tsx             (tag management)
```

## API Integration

The form uses:
- `/api/admin/upload` - For image file uploads
- Firestore `products` collection - For storing product data

## Next Steps

To extend this form:
1. Add more categories/subcategories in `SUBCATEGORIES` object
2. Add more size options in `SIZE_OPTIONS` array
3. Add more color options in `COLOR_OPTIONS` array
4. Customize validation rules in `productSchema`
5. Add additional fields as needed


