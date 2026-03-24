# COMPREHENSIVE SITE STRESS TEST - COMPLETE GUIDE
**Version:** 1.0  
**Date:** January 9, 2026  
**For:** Bin Mukhtar Retail localhost:3000

---

## 🎯 CRITICAL FIXES ALREADY DEPLOYED

### ✅ Recently Fixed Issues:
1. **Sale Price Display** - Now shows compare-at price with strikethrough
2. **Stock Validation** - Auto-adjusts quantity when switching variants
3. **Variant Matching** - String coercion for size/color matching
4. **Firestore Rules** - Variants subcollection now publicly readable
5. **Category Deletion** - Yemeni Shemaghs removed from site
6. **Phone Number** - Updated to +1 (734) 785-2726
7. **Cart Price Sanitization** - Prevents corrupted prices (trillions)

---

## 📋 COMPLETE TESTING CHECKLIST

### 1. HOMEPAGE (http://localhost:3000)

#### Visual Elements:
- [ ] Hero carousel displays and cycles through slides
- [ ] "Luxury Thobes & Modest Fashion" heading visible
- [ ] "Shop Now" button works

#### Category Mosaic:
- [ ] **CRITICAL**: Verify ONLY 6 categories show (Men's Emirati, Men's Saudi, Men's Short Sleeve, Men's Moroccan, Boys' Emirati, Traditional Shemaghs)
- [ ] **CRITICAL**: "Yemeni Shemaghs" should NOT appear
- [ ] All category images load
- [ ] "View Products" buttons work
- [ ] Categories link to correct pages

#### Navigation:
- [ ] Men dropdown shows subcategories
- [ ] Boys dropdown shows subcategories
- [ ] Shemaghs dropdown shows subcategories
- [ ] About link works
- [ ] Contact link works
- [ ] Sign in link works
- [ ] Cart icon shows item count

#### Footer:
- [ ] All Shop links work
- [ ] All Help links work
- [ ] All Company links work
- [ ] Social media links present

#### Reviews Section:
- [ ] Reviews load if any exist
- [ ] No test reviews showing

---

### 2. SHOP PAGE (/shop)

#### Product Loading:
- [ ] Products display (not "0 products")
- [ ] Product images load
- [ ] Product titles display
- [ ] **CRITICAL**: Prices show correctly (dollars, not scientific notation)
- [ ] **CRITICAL**: Sale prices show with strikethrough original price

#### Filters:
- [ ] Category checkboxes work (Men, Boys, Shemaghs)
- [ ] Price range slider/inputs work
- [ ] "Clear all filters" button works

#### Sorting:
- [ ] Featured sort works
- [ ] Price: Low to High works
- [ ] Price: High to Low works
- [ ] Newest sort works

#### Product Cards:
- [ ] Hover effects work
- [ ] "Quick Add" button appears on hover
- [ ] "Sale" badge shows for sale items
- [ ] Click product card opens detail page

---

### 3. CATEGORY PAGES

#### Men's Emirati (/category/emirati):
- [ ] Products load
- [ ] Breadcrumb shows correctly
- [ ] Filters work
- [ ] Products are relevant to category

#### Men's Saudi (/category/saudi):
- [ ] Products load
- [ ] Breadcrumb shows correctly

#### Boys' Thobes (/category/thobes):
- [ ] Products load
- [ ] Breadcrumb shows correctly

#### Traditional Shemaghs (/category/traditional):
- [ ] Products load
- [ ] Breadcrumb shows correctly
- [ ] **CRITICAL**: No "Yemeni" subcategory appears

---

### 4. PRODUCT DETAIL PAGE (/product/short-sleeve-thobe-brown)

#### **CRITICAL STOCK TEST**:
1. **Open browser console (F12)**
2. **Select Size 54, Color Brown**
3. **Check console logs:**
   ```
   Should see: "Found exact variant (size+color): { size: 54, color: Brown, stock: 2 }"
   ```
4. **Try to increase quantity:**
   - [ ] Quantity should STOP at 2
   - [ ] "+" button should be disabled at 2
   - [ ] Should show "Only 2 left" or "Maximum 2 available"

5. **Switch to Size 56:**
   - [ ] Quantity should auto-adjust if it was above 7
   - [ ] Can increase to 7
   - [ ] Should show "Only 7 left" or similar

6. **Try Size 58:**
   - [ ] Max should be 2

7. **Try Size 60:**
   - [ ] Max should be 1

#### Price Display:
- [ ] **If on sale**: Shows sale price in red, original with strikethrough, "SALE" badge
- [ ] **If regular**: Shows regular price only
- [ ] Price matches cart price when added

#### Product Information:
- [ ] Product title displays
- [ ] Product images gallery works
- [ ] Can select different images
- [ ] Zoom/enlarge works
- [ ] Size selector shows all sizes
- [ ] Color selector shows all colors
- [ ] Selected size/color is highlighted
- [ ] Stock warning shows if low stock
- [ ] "Out of stock" shows if no stock

#### Add to Cart:
- [ ] "Add to Cart" button enabled when size/color selected
- [ ] Button disabled if out of stock
- [ ] Toast notification appears on add
- [ ] Cart icon updates count

#### Product Details Accordion:
- [ ] "Product Details" expands/collapses
- [ ] "Shipping & Returns" expands/collapses
- [ ] Content displays correctly

---

### 5. CART PAGE (/cart)

#### **CRITICAL PRICE FIX**:
1. **FIRST, clear corrupted cart data:**
   - Open browser console (F12)
   - Type: `localStorage.removeItem('bmr-cart-storage')`
   - Press Enter
   - Refresh page

2. **Add products to cart from product pages**

3. **Verify:**
   - [ ] **Prices show in dollars** (e.g., $16.99, NOT $799,800,000,000)
   - [ ] Unit price × quantity = item total
   - [ ] Subtotal is sum of all items
   - [ ] Free shipping banner shows if under $100
   - [ ] "Qualifies for FREE delivery" shows if over $100

#### Cart Functionality:
- [ ] Product images display
- [ ] Product names are links to product pages
- [ ] Size/color shows correctly
- [ ] "In Stock" badge shows
- [ ] Delivery date shows
- [ ] Quantity controls work:
  - [ ] "+" increases quantity
  - [ ] "-" decreases quantity
  - [ ] Can't go below 1
  - [ ] Number input accepts manual entry
- [ ] "Delete" button removes item
- [ ] "Save for later" button works
- [ ] "Share" button works
- [ ] "This is a gift" checkbox works
- [ ] "Deselect all items" clears cart

---

### 6. CHECKOUT FLOW

#### Shipping Address:
- [ ] Form fields display
- [ ] Required fields validate
- [ ] Can enter address
- [ ] "Continue to shipping" enables when form complete

#### Shipping Rates:
- [ ] **CRITICAL**: Shipping rates load (USPS Ground, USPS Priority, UPS options)
- [ ] Each rate shows price and delivery estimate
- [ ] Can select a shipping method
- [ ] Selected method highlights

#### Payment:
- [ ] Stripe payment form loads
- [ ] Can enter card details
- [ ] Test card works (4242 4242 4242 4242)
- [ ] Form validates

#### Order Review:
- [ ] Items list shows correctly
- [ ] Subtotal correct
- [ ] Shipping cost correct
- [ ] Tax calculated
- [ ] Total is accurate
- [ ] "Place Order" button enabled

---

### 7. CONTACT PAGE (/contact)

#### **CRITICAL PHONE NUMBER CHECK**:
- [ ] **Phone displays: +1 (734) 785-2726** (NOT old number)
- [ ] Phone number is clickable link
- [ ] Email displays: info@binmukhtarretail.com
- [ ] Email is clickable mailto: link

#### Contact Form:
- [ ] Name field works
- [ ] Email field works  
- [ ] Phone field works (optional)
- [ ] Message field works
- [ ] Required field validation
- [ ] "Send Message" button works
- [ ] Success message shows on submit

---

### 8. ABOUT PAGE (/about)

- [ ] Page loads
- [ ] Content displays
- [ ] No broken images
- [ ] No broken links

---

### 9. FOOTER PAGES

#### Size Guide:
- [ ] Page loads
- [ ] Size chart displays

#### FAQ:
- [ ] Page loads
- [ ] Questions display
- [ ] Expand/collapse works

#### Privacy Policy:
- [ ] Page loads
- [ ] Policy text displays

#### Terms of Service:
- [ ] Page loads
- [ ] Terms text displays

---

### 10. ADMIN PANEL

#### Login (/admin/login):
- [ ] Login page loads
- [ ] Can't access admin without login
- [ ] Login form works
- [ ] Redirects to dashboard on success

#### Dashboard (/admin):
- [ ] Requires authentication
- [ ] Shows product count
- [ ] Shows order count
- [ ] Navigation works

#### Product Management:
- [ ] Can view products list
- [ ] Can create new product
- [ ] Can edit product
- [ ] **CRITICAL**: Sale price and regular price don't flip on edit
- [ ] Can upload images
- [ ] Can set variants with stock
- [ ] Can delete product

#### Category Management (/admin/categories):
- [ ] Can view categories
- [ ] Can create subcategory
- [ ] Can edit subcategory
- [ ] Can delete subcategory
- [ ] **CRITICAL**: Deleted category (Yemeni) stays deleted

---

## 🔥 CRITICAL VALIDATION TESTS

### Test 1: Stock Limits (MUST PASS)
**Product:** Short Sleeve Thobe - Brown  
**Test:** Select Size 54, Color Brown
- ✅ Max quantity should be 2 (NOT 12)
- ✅ Quantity auto-adjusts when switching sizes

### Test 2: Cart Prices (MUST PASS)
**Test:** Add any product to cart
- ✅ Price shows as dollars (e.g., $16.99)
- ✅ NOT scientific notation or trillions

### Test 3: Category Deletion (MUST PASS)
**Test:** Check homepage category mosaic
- ✅ "Yemeni Shemaghs" does NOT appear
- ✅ Only 6 categories display

### Test 4: Sale Prices (MUST PASS)
**Test:** Products with compareAtPrice > price
- ✅ Sale price shows in red
- ✅ Original price shows with strikethrough
- ✅ "SALE" badge displays

### Test 5: Phone Number (MUST PASS)
**Test:** Check contact page
- ✅ Phone is +1 (734) 785-2726
- ✅ NOT old number

### Test 6: Variant Loading (MUST PASS)
**Test:** Check browser console on product page
- ✅ No "Failed to fetch variants" error
- ✅ Variants load successfully
- ✅ Stock calculations work

---

## 📊 TESTING SUMMARY TEMPLATE

```
## FINAL TEST RESULTS

### ✅ PASSED (X/6 Critical Tests)
- [ ] Stock limits work correctly
- [ ] Cart prices display correctly  
- [ ] Yemeni Shemaghs deleted
- [ ] Sale prices display correctly
- [ ] Phone number updated
- [ ] Variants load without errors

### ⚠️ ISSUES FOUND
1. [List any bugs found]
2. [Include page URL and steps to reproduce]

### 📝 NOTES
- [Any observations or recommendations]
```

---

## 🚀 QUICK TEST SCRIPT

**For rapid testing, run this sequence:**

1. **Homepage** → Check for 6 categories (no Yemeni)
2. **/product/short-sleeve-thobe-brown** → Select Size 54 → Try quantity 3 → Should block
3. **Console:** `localStorage.removeItem('bmr-cart-storage')` → Refresh
4. **Add to cart** → Check price is dollars
5. **/contact** → Verify phone +1 (734) 785-2726
6. **Done!** ✅

---

**Test Duration Estimate:** 30-45 minutes for complete test  
**Quick Test:** 5 minutes for critical checks only