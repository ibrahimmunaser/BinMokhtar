# 🚨 CART PRICE ISSUE - $2,999 INVESTIGATION

## Problem
Cart showing $2,999.00 for a product that should be much cheaper (likely $19.99-$39.99).

## Root Cause Analysis

### Where the price comes from:
1. **Product page** (`app/product/[slug]/page.tsx` line 304-305):
   ```typescript
   priceAtAdd: selectedVariant?.price || product.price || product.basePrice,
   price: selectedVariant?.price || product.price || product.basePrice,
   ```

2. **Cart display** (`components/cart/CartTable.tsx` line 187-188):
   ```typescript
   const itemTotal = (item.price || item.priceAtAdd) * item.qty;
   const unitPrice = item.price || item.priceAtAdd;
   ```

### The Issue:
- **Price in Firestore is likely set to 299900 cents** (which equals $2,999.00)
- This is either:
  - A. **Data entry error** in admin panel
  - B. **Old corrupted data** from before our fixes
  - C. **Product variant price** set incorrectly

### Why our sanitization didn't catch it:
- Our cart store caps prices at **1,000,000 cents** ($10,000)
- **299,900 cents is UNDER that limit**, so it passed through
- But it's still way too high for a thobe!

---

## 🔧 IMMEDIATE FIX

### Step 1: Clear Cart (Right Now)
Open browser console (F12) and run:
```javascript
localStorage.removeItem('bmr-cart-storage')
```
Then refresh the page.

### Step 2: Check Which Product Has Wrong Price
Before clearing, run this to see the problem:
```javascript
JSON.parse(localStorage.getItem('bmr-cart-storage')).state.items
```

Look for the `productId` and `priceAtAdd` values.

---

## 🔍 INVESTIGATION NEEDED

### Check Product in Firestore:
1. Go to Firebase Console → Firestore Database
2. Navigate to `products` collection
3. Find the product with ID from cart (from Step 2 above)
4. Check these fields:
   - `price` (should be in cents, e.g., 1999 = $19.99)
   - `basePrice` (should be in cents)
   - `compareAtPrice` (if on sale)

### Check Product Variants:
1. In same product document
2. Open `variants` subcollection
3. Check each variant's `price` field
4. **Look for any variant with price = 299900**

---

## 🛠️ PERMANENT FIX

I'll add smarter price validation that catches unrealistic prices for thobes:

```typescript
// Maximum reasonable price for a thobe: $500 (50000 cents)
const MAX_REASONABLE_PRICE = 50000;

// In cart store:
const sanitizedPrice = Math.min(
  item.priceAtAdd || item.price || 0,
  MAX_REASONABLE_PRICE
);
```

This will prevent any thobe from being added to cart above $500, which catches the $2,999 price.

---

## 📝 ACTION ITEMS

1. ✅ **You**: Clear cart with `localStorage.removeItem('bmr-cart-storage')`
2. ✅ **You**: Tell me which product has the $2,999 price (check localStorage first)
3. ✅ **Me**: Check that product in Firestore
4. ✅ **Me**: Fix the price in database
5. ✅ **Me**: Add better price validation

---

## 🎯 NEXT STEPS

**Please run these two commands in browser console and send me the output:**

```javascript
// Command 1: See cart contents
console.log(JSON.parse(localStorage.getItem('bmr-cart-storage')).state.items);

// Command 2: See which product
console.log(JSON.parse(localStorage.getItem('bmr-cart-storage')).state.items.map(i => ({
  name: i.name || i.title,
  price: i.price,
  priceAtAdd: i.priceAtAdd,
  productId: i.productId,
  size: i.size,
  color: i.color
})));
```

This will tell me exactly which product needs fixing in Firestore.