# Quick Setup Guide for BMR E-commerce

Follow these steps to get your BMR store running:

## 1. Install Dependencies
```bash
npm install
```

## 2. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Click "Add project"
3. Name it "BMR Retail" (or your choice)
4. Enable Google Analytics (optional)

## 3. Enable Firebase Services

### Firestore Database
1. Go to Firestore Database in sidebar
2. Click "Create database"
3. Choose "Start in production mode"
4. Select your region

### Authentication
1. Go to Authentication in sidebar
2. Click "Get started"
3. Enable "Google" sign-in method
4. Add authorized domain if deploying (e.g., your-domain.com)

### Storage
1. Go to Storage in sidebar
2. Click "Get started"
3. Start in production mode
4. Choose same region as Firestore

## 4. Get Firebase Config
1. Go to Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click web icon (</>)
4. Register app as "BMR Web"
5. Copy the config object

## 5. Set Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com

# Firebase Admin SDK (for server-side admin operations)
FIREBASE_ADMIN_PROJECT_ID=your-project-id
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**📖 To get Admin SDK credentials**: See [FIREBASE_ADMIN_SETUP.md](./FIREBASE_ADMIN_SETUP.md) for detailed instructions on generating service account keys.

## 6. Deploy Firebase Rules
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (choose existing project)
firebase init

# Deploy rules
firebase deploy --only firestore:rules,storage:rules
```

## 7. Add Initial Data to Firestore

### Create "settings" collection:

**Document: `settings/header`**
```json
{
  "reviewsLine": "4.8/5 from 1,247 verified reviews",
  "shippingLine": "Free shipping over $99"
}
```

**Document: `settings/home`**
```json
{
  "heroHeadline": "Timeless Elegance in Traditional Attire",
  "heroSub": "Discover premium thobes and shaals crafted with excellence",
  "heroCtaLabel": "Shop Thobes",
  "heroCtaHref": "/shop",
  "usp": [
    "Free shipping over $99",
    "Easy 30-day returns",
    "Premium tailoring"
  ],
  "featuredCategoryIds": [],
  "featuredProductIds": []
}
```

### Create sample navigation:

**Collection: `navigation`**

Document 1:
```json
{
  "label": "Men",
  "position": "primary",
  "children": [
    {"id": "men-signature", "label": "Signature Thobes", "href": "/category/men-signature"},
    {"id": "men-omani", "label": "Omani Style", "href": "/category/men-omani"},
    {"id": "men-emirati", "label": "Emirati Style", "href": "/category/men-emirati"}
  ]
}
```

Document 2:
```json
{
  "label": "Shop",
  "href": "/shop",
  "position": "primary"
}
```

Document 3:
```json
{
  "label": "Contact",
  "href": "/contact",
  "position": "utility"
}
```

### Create sample category:

**Collection: `categories`**
```json
{
  "name": "Men's Thobes",
  "slug": "men-thobes",
  "sort": 1,
  "active": true,
  "description": "Premium thobes for men"
}
```

### Create sample product:

**Collection: `products`**
```json
{
  "name": "Classic White Thobe",
  "slug": "classic-white-thobe",
  "subtitle": "Timeless elegance",
  "categoryId": "YOUR_CATEGORY_ID",
  "price": 12900,
  "compareAtPrice": 15900,
  "colors": ["white", "black"],
  "sizes": ["52", "54", "56", "58", "60"],
  "stock": 50,
  "images": ["https://via.placeholder.com/600x800"],
  "thumbnail": "https://via.placeholder.com/600x800",
  "descriptionHtml": "<p>Premium cotton thobe with traditional cut.</p>",
  "fabricHtml": "<p>100% Egyptian cotton. Machine washable.</p>",
  "badges": ["New"],
  "published": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## 8. Run Development Server
```bash
npm run dev
```
Visit http://localhost:3000

## 9. Access Admin Panel
1. Go to http://localhost:3000/admin
2. Sign in with your Google account (must match ADMIN_EMAILS)
3. Start managing products!

## 10. Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
```

## Need Help?

- Firebase docs: https://firebase.google.com/docs
- Next.js docs: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

---

Your BMR store is ready! 🎉

