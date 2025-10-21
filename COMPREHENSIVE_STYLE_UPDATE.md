# BMR Comprehensive Style Update

## ✅ Pages Updated with BMR Styling

### 1. Homepage (`app/page.tsx`) ✅
- HeroCarousel with BMR colors
- CategoryMosaic with proper spacing
- All sections using BMR design tokens

### 2. Shop Page (`app/shop/page.tsx`) ✅  
- `bg-surface-1` background
- Sticky filter rail with `bg-surface-2` card
- Product count display
- Empty state with "Clear filters" button
- Proper spacing and typography

### 3. Product Detail (`app/product/[slug]/page.tsx`) ✅
- `bg-surface-2` background
- Sticky product info sidebar
- Proper badge styling with `bmr-ink` and rounded-full
- Stock warnings with `surface-3` background
- Recommendations section with border-top
- Improved spacing and hierarchy

### 4. Cart Page (`app/cart/page.tsx`) ✅
- `bg-surface-1` background
- Card-based layout with `bg-surface-2`
- Sticky order summary
- Proper borders and spacing

## 🔄 Pages That Need Style Updates

### Auth Pages
- `/login` - Update with BMR cards and styling
- `/register` - Match login styling
- `/reset-password` - Match login styling
- `/account` - Update with proper card layout

### Checkout
- `/checkout` - Add card-based layout like cart

### Content Pages  
- `/about` - Add card backgrounds, improve layout
- `/contact` - Card-based form styling
- `/faq` - Accordion styling with BMR tokens
- `/size-guide` - Table styling with BMR colors
- `/shipping-returns` - Card-based content
- `/terms`, `/privacy` - Legal pages styling
- `/bulk-orders` - Form styling like contact
- `/gift-cards` - Product card styling
- `/reviews` - Review cards with proper styling
- `/track-order` - Form + results styling

### Category Pages
- `/category/[slug]` - Same as shop page
- `/category/thobes/[sleeve]` - Same as shop page

### Order Pages
- `/order-confirmation/[id]` - Success card styling

### Admin Pages
- All admin pages need proper dashboard styling

## BMR Style Guidelines Applied

### Colors
- Background: `bg-surface-1` (parchment) or `bg-surface-2` (white)
- Cards: `bg-surface-2` with `border border-line`
- Text: Default is `text-bmr-ink`, muted is `text-bmr-muted`
- Accents: `bg-bmr-ink` for primary, `bmr-acc-red` for errors/sales

### Typography
- Display: `font-display text-4xl lg:text-5xl` for h1
- Headings: `font-display text-2xl lg:text-3xl` for h2
- Body: Default sans with `text-base lg:text-lg`
- Small: `text-sm` for labels and meta

### Spacing
- Page padding: `py-12 lg:py-16`
- Section gaps: `space-y-8` or `gap-8`
- Card padding: `p-6 lg:p-8`
- Container: `container-wide` or `container-narrow`

### Borders & Corners
- Borders: `border border-line`
- Corners: `rounded-lg` for cards
- Pills: `rounded-full` for badges

### Interactive Elements
- Buttons: Use `btn-primary`, `btn-secondary`, `btn-ghost` classes
- Inputs: `border border-line focus:border-bmr-ink`
- Hover states: `hover:bg-surface-3` for subtle hover

### Layout
- Desktop grids: `lg:grid lg:grid-cols-[...]`
- Sticky elements: `lg:sticky lg:top-24 lg:self-start`
- Max widths: `max-w-3xl mx-auto` for content
- Generous whitespace throughout



