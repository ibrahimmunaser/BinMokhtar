# Product Creation Form - Structure Diagram

## 📐 Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                     CREATE NEW PRODUCT                          │
│                 Add a new product to your store                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📋 BASIC INFORMATION                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product Title *                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ e.g., Premium White Thobe                                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Price *                          Sale Price                   │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐  │
│  │ 99.99                       │ │ 79.99 (Optional)        │  │
│  └─────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
│  Category *                       Subcategory *                │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐  │
│  │ Thobes                   ▼  │ │ Long Sleeve          ▼  │  │
│  └─────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📸 PRODUCT IMAGE                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product Image *                                                │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                                                           │ │
│  │                    📤 Upload Icon                         │ │
│  │                                                           │ │
│  │            Click to upload or drag and drop               │ │
│  │              PNG, JPG, GIF up to 5MB                      │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Preview                                                        │
│  ┌─────────────────┐                                           │
│  │                 │                                           │
│  │  [Image shows   │  🗑️ Remove image                          │
│  │   here after    │                                           │
│  │   upload]       │                                           │
│  │                 │                                           │
│  └─────────────────┘                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🎨 PRODUCT VARIANTS                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Available Sizes *                Available Colors *           │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐  │
│  │ [S] [M] [L] [XL]         ▼  │ │ [White] [Black]      ▼  │  │
│  └─────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
│  When clicked:                    When clicked:                │
│  ┌─────────────────────────────┐ ┌─────────────────────────┐  │
│  │ ☑ XS                        │ │ ☑ White                 │  │
│  │ ☑ S                         │ │ ☑ Black                 │  │
│  │ ☑ M                         │ │ ☐ Beige                 │  │
│  │ ☑ L                         │ │ ☐ Brown                 │  │
│  │ ☑ XL                        │ │ ☐ Navy                  │  │
│  │ ☐ XXL                       │ │ ☐ Grey                  │  │
│  │ ☐ 3XL                       │ │ ☐ Cream                 │  │
│  │ ☐ 4XL                       │ │ ☐ Olive                 │  │
│  └─────────────────────────────┘ └─────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🏷️ TAGS & CLASSIFICATION                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Product Tags *                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ [traditional ×] [formal ×] [premium ×]                    │ │
│  │ Type and press Enter to add...                            │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📊 METRICS & INVENTORY                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Initial Orders Count         Initial Views Count              │
│  ┌─────────────────────────┐ ┌─────────────────────────────┐  │
│  │ 0                       │ │ 0                           │  │
│  └─────────────────────────┘ └─────────────────────────────┘  │
│                                                                 │
│  Stock Quantity               Rating                           │
│  ┌─────────────────────────┐ ┌─────────────────────────────┐  │
│  │ Optional                │ │ 0-5 (Optional)              │  │
│  └─────────────────────────┘ └─────────────────────────────┘  │
│                                                                 │
│  Number of Reviews                                              │
│  ┌─────────────────────────┐                                   │
│  │ Optional                │                                   │
│  └─────────────────────────┘                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    [ Clear Form ]  [ Create Product ]           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Component Hierarchy

```
CreateProductPage
│
├── Header
│   ├── Logo
│   ├── Navigation
│   └── Logout Button
│
└── CreateProductForm
    │
    ├── Success/Error Banners
    │
    ├── Section 1: Basic Information
    │   ├── ProductFormField (Title)
    │   ├── ProductFormField (Price)
    │   ├── ProductFormField (Sale Price)
    │   ├── Select (Category)
    │   └── Select (Subcategory)
    │
    ├── Section 2: Product Image
    │   └── ImageUpload
    │       ├── Upload Area
    │       ├── Preview
    │       └── Remove Button
    │
    ├── Section 3: Product Variants
    │   ├── MultiSelect (Sizes)
    │   └── MultiSelect (Colors)
    │
    ├── Section 4: Tags & Classification
    │   └── TagsInput
    │
    ├── Section 5: Metrics & Inventory
    │   ├── ProductFormField (Orders)
    │   ├── ProductFormField (Views)
    │   ├── ProductFormField (Stock)
    │   ├── ProductFormField (Rating)
    │   └── ProductFormField (Reviews)
    │
    └── Action Buttons
        ├── Clear Form
        └── Create Product
```

---

## 📦 Component Dependencies

```
CreateProductForm.tsx
├── react-hook-form
├── zod
├── @hookform/resolvers/zod
├── firebase/firestore
├── lucide-react (icons)
│
├── ProductFormField.tsx
│   └── (text/number inputs)
│
├── ImageUpload.tsx
│   ├── lucide-react (Upload, X, Loader2)
│   └── /api/admin/upload
│
├── MultiSelect.tsx
│   ├── lucide-react (Check)
│   └── (dropdown with checkboxes)
│
└── TagsInput.tsx
    ├── lucide-react (X)
    └── (chip input)
```

---

## 🔀 Data Flow

```
User Input
    ↓
React Hook Form
    ↓
Zod Validation
    ↓
Form Submit Handler
    ↓
    ├─→ Image Upload → Firebase Storage → Get URL
    │
    └─→ Prepare Data Object
            ↓
        Firestore Save
            ↓
        Success/Error Response
            ↓
        Update UI
            ↓
        Reset Form (on success)
```

---

## 🎯 Field Validation Flow

```
Title Input
    ↓
onChange → Validate (min 4 chars)
    ↓
    ├─→ Valid: Remove error
    └─→ Invalid: Show error message

Price Input
    ↓
onChange → Validate (> 0)
    ↓
    ├─→ Valid: Remove error
    └─→ Invalid: Show error message

Category Select
    ↓
onChange → Validate (not empty)
    ↓
    ├─→ Valid: Enable subcategory dropdown
    └─→ Invalid: Keep subcategory disabled

Image Upload
    ↓
File Selected → Validate (type, size)
    ↓
    ├─→ Valid: Upload to Firebase
    │       ↓
    │   Show preview
    │       ↓
    │   Store URL
    │
    └─→ Invalid: Show error message

Sizes/Colors Select
    ↓
onChange → Validate (min 1 selected)
    ↓
    ├─→ Valid: Remove error
    └─→ Invalid: Show error message

Tags Input
    ↓
onChange → Validate (min 2 tags)
    ↓
    ├─→ Valid: Remove error
    └─→ Invalid: Show error message

All Fields Valid?
    ↓
    ├─→ Yes: Enable submit button
    └─→ No: Keep submit button disabled
```

---

## 🎨 State Management

```typescript
Form State (react-hook-form)
├── title: string
├── price: number
├── salePrice?: number
├── image: string (URL)
├── category: string
├── subcategory: string
├── sizes: string[]
├── colors: string[]
├── tags: string[]
├── orders: number
├── views: number
├── stock?: number
├── rating?: number
└── numReviews?: number

Component State
├── isSubmitting: boolean
├── submitStatus: 'idle' | 'success' | 'error'
├── errorMessage: string
└── selectedCategory: string

ImageUpload State
├── uploading: boolean
└── uploadError: string

MultiSelect State
└── isOpen: boolean
```

---

## 🔐 Security & Validation

```
Client-Side Validation (Zod)
    ↓
Form Submit
    ↓
Admin Authentication Check
    ↓
Image Upload Validation
├── File type check
├── File size check
└── Server-side validation
    ↓
Firestore Write
├── Authentication required
└── Security rules applied
```

---

## 📱 Responsive Behavior

```
Desktop (≥768px)
├── Two-column grid for price/category
├── Two-column grid for sizes/colors
├── Two-column grid for metrics
└── Full-width sections

Mobile (<768px)
├── Single column layout
├── Stacked fields
├── Full-width dropdowns
└── Scrollable form
```

---

## 🎬 User Interaction Flow

```
1. Page Load
   ↓
2. Check Authentication
   ↓
3. Show Form
   ↓
4. User Fills Fields
   ↓
5. Real-time Validation
   ↓
6. Upload Image
   ↓
7. Select Variants
   ↓
8. Add Tags
   ↓
9. Submit Button Enabled
   ↓
10. Click Submit
    ↓
11. Show Loading State
    ↓
12. Save to Firestore
    ↓
13. Show Success Message
    ↓
14. Reset Form
    ↓
15. Ready for Next Product
```

---

## 🎉 Complete!

This diagram shows the complete structure and flow of the new product creation form.


