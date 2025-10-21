# Deployment Checklist for BMR E-commerce

Your Firebase configuration is now live with your actual project credentials. Follow this checklist before going to production.

## ✅ Pre-Deployment Checklist

### 1. Firebase Configuration (COMPLETED ✓)
- [x] Firebase Web SDK configured with project credentials
- [x] Analytics initialized
- [ ] Firestore Database created
- [ ] Authentication enabled (Google Sign-In)
- [ ] Storage bucket created

### 2. Firebase Security
- [ ] Deploy Firestore security rules
  ```bash
  firebase deploy --only firestore:rules
  ```
- [ ] Deploy Storage security rules
  ```bash
  firebase deploy --only storage:rules
  ```
- [ ] Update admin email addresses in Firestore rules
- [ ] Generate Firebase Admin SDK service account key
- [ ] Add Admin SDK credentials to environment variables

### 3. Environment Variables
**Current Setup (Hardcoded in lib/firebase.ts):**
- [x] Firebase API Key
- [x] Firebase Auth Domain
- [x] Firebase Project ID
- [x] Firebase Storage Bucket
- [x] Firebase Messaging Sender ID
- [x] Firebase App ID
- [x] Firebase Measurement ID

**Required for Production:**
- [ ] Set `NEXT_PUBLIC_ADMIN_EMAILS` with your Google account email
- [ ] Set `FIREBASE_ADMIN_PROJECT_ID`
- [ ] Set `FIREBASE_ADMIN_CLIENT_EMAIL`
- [ ] Set `FIREBASE_ADMIN_PRIVATE_KEY`

### 4. Initial Data Setup
Add to Firestore manually or via admin panel:

**settings/header:**
```json
{
  "reviewsLine": "Trusted by thousands of customers",
  "shippingLine": "Free shipping over $99"
}
```

**settings/home:**
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

**Sample Navigation Items:**
- Create navigation documents in Firestore
- Add categories (Men, Women, Children, Headwear, etc.)
- Add utility items (Contact, Reviews, etc.)

### 5. Test in Development
```bash
# Start dev server
npm run dev

# Test these features:
- [ ] Homepage loads correctly
- [ ] Navigation menu works (desktop & mobile)
- [ ] Product listing and filtering
- [ ] Product detail page
- [ ] Add to cart functionality
- [ ] Checkout flow
- [ ] Admin panel login (requires Google Auth setup)
- [ ] Language/currency switcher
- [ ] Newsletter signup
```

### 6. Analytics Verification
- [ ] Open Firebase Console → Analytics
- [ ] Verify events are being tracked:
  - page_view
  - view_item
  - add_to_cart
  - begin_checkout
  - purchase
  - sign_up (newsletter)

### 7. Vercel Deployment

**A. Install Vercel CLI:**
```bash
npm install -g vercel
```

**B. Deploy:**
```bash
vercel
```

**C. Add Environment Variables in Vercel Dashboard:**
Go to Project Settings → Environment Variables and add:

```
NEXT_PUBLIC_ADMIN_EMAILS=your-email@gmail.com
FIREBASE_ADMIN_PROJECT_ID=binmokhtar2-967ad
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@binmokhtar2-967ad.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**D. Set Environment for:**
- [x] Production
- [x] Preview
- [ ] Development (optional)

### 8. Domain Configuration
- [ ] Add custom domain in Vercel
- [ ] Configure DNS records
- [ ] Add domain to Firebase authorized domains:
  - Firebase Console → Authentication → Settings → Authorized domains
- [ ] Enable SSL certificate (automatic with Vercel)

### 9. Post-Deployment Testing
Test on production URL:
- [ ] Homepage loads
- [ ] Products display
- [ ] Cart works
- [ ] Checkout creates orders
- [ ] Admin panel accessible
- [ ] Analytics tracking
- [ ] Mobile responsive
- [ ] RTL mode (Arabic)

### 10. Add Real Content
- [ ] Upload product images to Firebase Storage
- [ ] Create categories
- [ ] Add products via admin panel
- [ ] Update homepage settings
- [ ] Test order flow end-to-end

### 11. SEO & Performance
- [ ] Add favicon
- [ ] Update meta tags for social sharing
- [ ] Test page load speed
- [ ] Enable compression
- [ ] Optimize images
- [ ] Add robots.txt
- [ ] Add sitemap.xml

### 12. Legal & Compliance
- [ ] Update Privacy Policy with real contact info
- [ ] Update Terms of Service
- [ ] Add cookie consent banner (if needed)
- [ ] GDPR compliance (if serving EU)

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📝 Important Notes

1. **Firebase Config is Hardcoded:** Your Firebase credentials are now directly in `lib/firebase.ts`. This is fine for Firebase Web SDK (these are meant to be public), but keep your Admin SDK keys secret!

2. **Admin Access:** Update `NEXT_PUBLIC_ADMIN_EMAILS` with your Google account email to access `/admin`

3. **Service Account Key:** Download from Firebase Console → Settings → Service Accounts → Generate New Private Key. See `FIREBASE_ADMIN_SETUP.md` for details.

4. **Security Rules:** Must be deployed before going live to protect your data!

## 🔐 Security Reminders

- ✅ Firebase Web SDK keys are safe to expose (they're public by design)
- ⚠️ Admin SDK private keys must NEVER be committed to git
- ⚠️ Always use environment variables for sensitive data
- ✅ Deploy Firestore rules to restrict write access
- ✅ Only allow admin emails to access admin panel

## 📞 Need Help?

- Firebase Console: https://console.firebase.google.com
- Vercel Dashboard: https://vercel.com/dashboard
- Docs: See README.md and SETUP_GUIDE.md

---

Your BMR store is ready for deployment! 🎉




