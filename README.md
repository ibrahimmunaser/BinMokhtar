# Bin Mukhtar Retail (BMR) E-Commerce Platform

A production-ready, Firebase-powered e-commerce platform for luxury thobes, shemaghs, and kufis. Built with Next.js 14 App Router, TypeScript, Tailwind CSS, and comprehensive i18n support (EN/AR with RTL).

## 🎯 Project Overview

**Stack**: Next.js 14 (App Router) • TypeScript • Tailwind CSS • Firebase • Stripe • Resend

**Status**: **Foundation Complete** — Core architecture, data models, Firebase integration, homepage components, and auth system are production-ready. Product catalog, cart/checkout, admin dashboard, and full i18n remain to be implemented.

---

## ✅ **Completed (Tasks 1-4)**

### 1. **Setup & Infrastructure** ✅

- ✅ Complete dependency management (`package.json`) with all required libraries
- ✅ BMR design tokens system (`styles/tokens.css`) with exact color palette
- ✅ Tailwind config with custom tokens, fonts, animations, and utilities
- ✅ Firebase Client SDK (`lib/firebase/client.ts`) with analytics and App Check
- ✅ Firebase Admin SDK (`lib/firebase/server.ts`) for server-side operations
- ✅ Font loading with `next/font`: Playfair Display, Inter, Amiri, Tajawal

### 2. **Firestore Data Model** ✅

**Comprehensive TypeScript types** (`types/index.ts`):
- Products, Variants, Categories
- Cart, Orders, OrderItems  
- Reviews, Collections, Pages
- Home sections (Hero, Mosaic, Tabs)
- Settings, Menus, Navigation
- Leads, Stripe events

**Firestore Security Rules** (`firestore.rules`):
- Public read for products, variants, settings, content
- Admin-only writes (via custom claims `role='ADMIN'`)
- Session-based cart access
- User-scoped order reads

**Storage Rules** (`storage.rules`):
- Public read for product/content images
- Admin-only writes with validation (image type, 10MB limit)

**Composite Indexes** (`firestore.indexes.json`):
- Variants by category + active + price/stock
- Products by status + featured/created
- Reviews by productId + approved
- Orders by status/userId + createdAt

### 3. **Core Libraries** ✅

**Auth** (`lib/auth.ts`):
- Client: signIn, signUp, signOut, password reset
- Server: verifyAdmin, setAdminRole, requireAdmin guard

**Currency** (`lib/currency.ts`):
- formatPrice (cents to localized currency)
- centsToDollars, dollarsToCents
- Currency symbols (USD, EUR, GBP, AED)

**SEO** (`lib/seo.ts`):
- defaultMetadata with OpenGraph + Twitter cards
- generateProductMetadata, generateProductJsonLd
- generateBreadcrumbJsonLd, generateOrganizationJsonLd

**Revalidation** (`lib/revalidate.ts`):
- Path-based: revalidateHomepage, revalidateProduct, etc.
- Tag-based: revalidateTag('products'), etc.

**Utils** (`lib/utils.ts`):
- cn (className merge), slugify, truncate, formatDate
- debounce, randomId, clamp, sleep

### 4. **Homepage Components** ✅

All components support EN/AR locales:

- **HeroCarousel** (`components/home/HeroCarousel.tsx`):  
  Video/image slides with overlay content, autoplay, keyboard nav, dots

- **CategoryMosaic** (`components/home/CategoryMosaic.tsx`):  
  3×3 editorial grid with variable tile spans, hover effects

- **BestSellers** (`components/home/BestSellers.tsx`):  
  4-8 product cards with "Shop Best Sellers" link

- **PromoBand** (`components/home/PromoBand.tsx`):  
  Asymmetrical layout (wide image left + text + portrait right)

- **ReviewsCarousel** (`components/home/ReviewsCarousel.tsx`):  
  3-up carousel with star ratings, keyboard accessible

- **ShemaghTabs** (`components/home/ShemaghTabs.tsx`):  
  Tab navigation for product collections (Yemeni, Saudi, Kufis)

- **BrandStory** (`components/home/BrandStory.tsx`):  
  Multi-paragraph story blocks with links to Size Guide & Care

- **IconRow** (`components/home/IconRow.tsx`):  
  3-column USP icons (Worldwide Delivery, 14-Day Exchange, etc.)

- **Footer** (`components/layout/Footer.tsx`):  
  Dark theme (BMR Night), newsletter signup, 3-column links, payment icons

- **ProductCard** (`components/products/ProductCard.tsx`):  
  Sale badge, Sold Out badge, Quick Add on hover, price display

---

## 📋 **Remaining Work (12 Large Tasks)**

This is a **2-4 week production build** for a full team. The foundation is solid; here's what remains:

### 5. **Catalog Pages** (2-3 days)
- [ ] `/shop` - PLP with filters (category, size, length, color, price, inStock)
- [ ] `/category/[slug]` - Category-specific PLPs
- [ ] `/category/thobes/[sleeve]` - Sleeve-specific routes
- [ ] Faceted filtering with Firestore queries
- [ ] Sort options (featured, new, priceAsc, priceDesc, popular)
- [ ] FilterRail (desktop sticky) + MobileFilterSheet

### 6. **Product Detail Page** (2 days)
- [ ] ProductGallery with zoom & thumbnails
- [ ] Variant pickers (Size, Length, Color) with stock validation
- [ ] Add to Cart Server Action (writes to Firestore `/carts/{id}/items`)
- [ ] Accordions (Details, Fabric & Care, Shipping & Returns)
- [ ] Cross-sell "Complete the Look" (2 related products)
- [ ] JSON-LD structured data (Product, Offer, AggregateRating)

### 7. **Cart & Checkout** (3 days)
- [ ] Cart page with CartTable + OrderSummary
- [ ] Stripe Checkout Server Action
- [ ] `/api/stripe/webhook` route handler:
  - Create order in Firestore
  - Decrement variant stock atomically
  - Send Resend confirmation email
  - Clear cart
  - Idempotency with `/stripeEvents/{id}`
- [ ] `/orders/[id]` confirmation page

### 8. **Admin Dashboard** (5-7 days)
- [ ] Auth guard middleware (check `role='ADMIN'`)
- [ ] `/admin` - Overview (revenue, orders, AOV, low stock)
- [ ] `/admin/products` - Products CRUD:
  - Form with titleEn/Ar, category, basePrice, status, featured, tags
  - Options editor → Generate variant matrix
  - Inline variant editing (sku, price, compareAt, stock, active)
  - Media manager (Firebase Storage upload, drag-sort, alt text)
  - Publish guard (≥1 active variant with stock + cover image + alt)
- [ ] `/admin/orders` - List, filter by status, mark fulfilled/cancelled, export CSV
- [ ] `/admin/reviews` - Approve/deny, pin to homepage, edit
- [ ] `/admin/content` - Edit hero slides, mosaic tiles, shemagh tabs, story blocks, settings
- [ ] `/admin/menus` - Header/Footer JSON editor with drag-order

### 9. **Content Pages** (2 days)
- [ ] `/size-guide` - MDX with height ↔ thobe length table
- [ ] `/care` - MDX for thobes & shaals care instructions
- [ ] `/about` - Brand story & values (MDX)
- [ ] `/bulk-orders` - Lead form (saves to Firestore `/bulkLeads`)
- [ ] `/gift-cards` - Stripe product stub
- [ ] `/reviews` - List approved reviews + submit form (moderated)
- [ ] `/legal/privacy`, `/legal/terms`, `/legal/returns` - MDX

### 10. **i18n (EN/AR + RTL)** (2-3 days)
- [ ] `next-intl` setup with `[locale]` routes
- [ ] Locale switcher (EN ↔ AR toggle)
- [ ] RTL layout (`dir="rtl"`, mirrored icons/chevrons)
- [ ] Font switching (Playfair/Inter → Amiri/Tajawal for AR)
- [ ] Translate all UI strings to AR
- [ ] Number/date formatting per locale

### 11. **SEO & Performance** (1 day)
- [ ] `/api/og` - Dynamic OG images with `@vercel/og`
- [ ] JSON-LD on all pages
- [ ] `sitemap.xml`, `robots.txt`
- [ ] Image optimization (AVIF/WebP, `remotePatterns` for Firebase Storage)
- [ ] Font preloading, code splitting
- [ ] LCP < 2.5s on 4G

### 12. **Search** (1 day)
- [ ] `/search?q=` route
- [ ] Firestore prefix match on `searchTitleEn/searchTitleAr`
- [ ] Search overlay (CMD+K shortcut)
- [ ] Return Products + Categories

### 13. **Email Templates** (1 day)
- [ ] Resend integration (`lib/email.ts`)
- [ ] OrderConfirmation (EN/AR)
- [ ] NewsletterWelcome
- [ ] Send from Stripe webhook

### 14. **Seed Script** (1 day)
- [ ] `scripts/seed.ts` using Admin SDK
- [ ] Populate: settings, menus, home sections
- [ ] 4 thobes (S-XXL, lengths 52-60)
- [ ] 3 shaals, 2 kufis
- [ ] 3 approved/pinned reviews

### 15. **Tests** (2-3 days)
- [ ] Vitest units (currency, variant resolver, facet parser)
- [ ] Playwright E2E:
  - Home → Shop → PDP → Add to Cart → Checkout
  - Admin login → Create product → Publish
  - Reviews carousel keyboard nav
  - AR/RTL toggle
- [ ] axe a11y smoke tests (/, /shop, /product/*)

### 16. **FIVE STRESS-TEST PASSES** (1 day)
1. **Commerce**: Add to cart → Stripe → webhook → stock decrement → email
2. **Admin**: Product CRUD, variants, media upload, publish
3. **A11y/RTL**: Keyboard nav, ARIA, AR layout flip
4. **Performance**: LCP < 2.5s, JS < 180KB gzip
5. **Visual Parity**: Homepage matches reference screenshots

---

## 🏗 **Architecture**

### File Structure

```
bin-mukhtar-retail-2/
├── app/
│   ├── (home)/                   # Homepage route group
│   ├── (shop)/                   # Shop, category routes
│   ├── (product)/                # Product detail routes
│   ├── (cart)/                   # Cart route
│   ├── (checkout)/               # Checkout route
│   ├── (orders)/                 # Order confirmation
│   ├── (info)/                   # About, Size Guide, etc.
│   ├── (legal)/                  # Privacy, Terms, Returns
│   ├── admin/                    # Admin dashboard (guarded)
│   ├── api/
│   │   ├── og/route.ts           # Dynamic OG images
│   │   └── stripe/webhook/       # Stripe webhook handler
│   ├── layout.tsx                # Root layout with fonts
│   └── globals.css               # Global styles + tokens
├── components/
│   ├── home/                     # Homepage sections
│   ├── layout/                   # Header, Footer, Nav
│   ├── products/                 # Product cards, filters, gallery
│   ├── cart/                     # Cart table, order summary
│   └── checkout/                 # Checkout form
├── lib/
│   ├── firebase/
│   │   ├── client.ts             # Firebase Client SDK
│   │   └── server.ts             # Firebase Admin SDK
│   ├── auth.ts                   # Auth helpers
│   ├── currency.ts               # Price formatting
│   ├── seo.ts                    # SEO utilities & JSON-LD
│   ├── revalidate.ts             # Next.js revalidation
│   └── utils.ts                  # Common utilities
├── styles/
│   └── tokens.css                # BMR design tokens
├── types/
│   └── index.ts                  # TypeScript types
├── scripts/
│   └── seed.ts                   # Seed script (Admin SDK)
├── firestore.rules               # Firestore security rules
├── storage.rules                 # Firebase Storage rules
├── firestore.indexes.json        # Composite indexes
└── README.md                     # This file
```

### Data Flow

**Client → Firestore**:
- Public reads: products, variants, settings, menus, home, pages
- Writes: Only via Server Actions (using Admin SDK)

**Cart**:
- Stored in `/carts/{sessionId or userId}/items`
- Persisted to localStorage client-side
- Server Actions for add/update/remove

**Orders**:
- Created via Stripe webhook (Admin SDK)
- Stock decrement is atomic (batched write)
- Email sent via Resend

**Admin**:
- Custom claim `role='ADMIN'` set via Firebase Admin SDK
- All writes go through Server Actions with admin guard
- Media uploads to Firebase Storage with admin-only rules

---

## 🔥 **Firebase Setup**

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: **"Bin Mukhtar Retail"**
3. Enable **Authentication** (Email/Password)
4. Enable **Firestore Database** (production mode)
5. Enable **Storage**
6. Enable **Analytics** (optional)

### 2. Get Firebase Credentials

**Client SDK** (public):
- Project Settings → Your apps → Web app → Copy config

**Admin SDK** (server, secret):
- Project Settings → Service accounts → Generate new private key
- Download JSON, then base64 encode:
  ```bash
  cat service-account.json | base64 -w 0  # Linux/Mac
  # Or use online tool for Windows
  ```

### 3. Set Environment Variables

Create `.env.local`:
```bash
# Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Admin (secret)
FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded-json>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Resend
RESEND_API_KEY=re_...

# Site
SITE_URL=http://localhost:3000
DEFAULT_CURRENCY=USD
```

### 4. Deploy Firebase Rules & Indexes

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (select Firestore, Storage)
firebase init

# Deploy rules
firebase deploy --only firestore:rules
firebase deploy --only storage
firebase deploy --only firestore:indexes
```

### 5. Create Admin User

```javascript
// Run this once via Node.js or Firebase Functions
import { adminAuth } from './lib/firebase/server';

async function createAdmin() {
  const user = await adminAuth().createUser({
    email: 'admin@bmr.local',
    password: 'your-secure-password',
  });
  
  await adminAuth().setCustomUserClaims(user.uid, { role: 'ADMIN' });
  console.log('✅ Admin user created:', user.uid);
}

createAdmin();
```

---

## 🚀 **Getting Started**

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Lint code
npm run typecheck    # TypeScript check
npm run test         # Vitest unit tests
npm run test:e2e     # Playwright E2E tests
npm run seed         # Seed Firestore (when implemented)
```

---

## 🎨 **Design System**

### Colors (BMR Palette)

```css
--bmr-bg: #F5F2EE          /* Parchment background */
--bmr-fg: #111111          /* Near-black foreground */
--bmr-muted: #8B8277       /* Muted text */
--bmr-stone: #756B5B       /* Stone accent */
--bmr-ink: #2B2B2B         /* Ink dark */
--bmr-night: #2F3A4A       /* Night blue (footer) */
--bmr-keffiyeh: #111111    /* Keffiyeh black */
--bmr-acc-red: #C62828     /* Sale/error accent */
--bmr-acc-green: #1E7F51   /* Success accent */

--surface-1: #F5F2EE       /* Primary surface */
--surface-2: #FFFFFF       /* White cards */
--surface-3: #EFECE7       /* Subtle surface */
--line: #DDD6CE            /* Border color */
```

### Typography

**English**:
- Display/Headings: **Playfair Display** (serif)
- Body/UI: **Inter** (sans-serif)

**Arabic**:
- Display/Headings: **Amiri** (serif)
- Body/UI: **Tajawal** (sans-serif)

### Button Styles

```html
<button class="btn-primary">Primary</button>   <!-- Ink bg, white text -->
<button class="btn-secondary">Secondary</button> <!-- Ink outline -->
<button class="btn-ghost">Ghost</button>       <!-- Transparent, underline on hover -->
```

---

## 📦 **Deployment (Vercel)**

### 1. Connect to Vercel

```bash
vercel
```

### 2. Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:
- All `NEXT_PUBLIC_*` variables
- `FIREBASE_SERVICE_ACCOUNT_JSON`
- Stripe keys, Resend key

### 3. Configure Next.js Image Domains

In `next.config.js`:
```js
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'firebasestorage.googleapis.com',
    },
  ],
},
```

### 4. Deploy

```bash
vercel --prod
```

---

## 🧪 **Testing Strategy**

### Unit Tests (Vitest)
- `lib/currency.ts` - formatPrice, centsToDollars
- `lib/utils.ts` - slugify, truncate
- Variant price resolver
- Facet query builder

### E2E Tests (Playwright)
- **Commerce Flow**: Home → Shop → PDP → Add to Cart → Checkout → Success
- **Admin Flow**: Login → Create Product → Upload Image → Publish
- **Reviews**: Carousel keyboard navigation
- **RTL**: Toggle to Arabic, verify layout flip

### Accessibility (axe)
- Run on: `/`, `/shop`, `/product/*`
- Check for: ARIA labels, focus order, contrast, alt text

---

## 📝 **Next Steps (Recommended Order)**

1. **Implement seed script** (`scripts/seed.ts`) to populate test data
2. **Build catalog pages** (`/shop`, `/category/*`) with filters
3. **Build PDP** with variant selection and Add to Cart
4. **Implement cart & Stripe checkout** with webhook
5. **Build basic admin** for Products CRUD
6. **Add content pages** (Size Guide, About, etc.)
7. **Implement i18n** (next-intl with EN/AR)
8. **Add search** functionality
9. **Write tests** (Vitest + Playwright)
10. **Run stress tests** and optimize

---

## 🤝 **Contributing**

This is a production build for Bin Mukhtar Retail. For questions or issues:

1. Check Firestore rules and indexes are deployed
2. Verify environment variables are set
3. Ensure admin user has `role='ADMIN'` custom claim
4. Check Firebase Storage rules for image uploads

---

## 📄 **License**

Proprietary - Bin Mukhtar Retail © 2025

---

## 🙏 **Acknowledgments**

Built with:
- [Next.js 14](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Stripe](https://stripe.com/)
- [Resend](https://resend.com/)
- [shadcn/ui](https://ui.shadcn.com/) components
- [Lucide Icons](https://lucide.dev/)

---

**Status**: **Foundation Complete** — Ready for catalog, cart, checkout, and admin implementation.

For the full specification, see the original requirements document.
