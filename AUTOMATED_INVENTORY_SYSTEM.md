# Automated Inventory Management System

## Overview
Your inventory system now **automatically decreases stock** when customers place orders and **auto-refreshes** the admin interface to show real-time stock levels.

---

## ✅ How It Works

### 1. **Automatic Stock Decrement**
When a customer completes an order (via Stripe checkout), the system:
- ✅ Creates the order in the database
- ✅ Automatically decrements the variant stock (e.g., Size 54 + Dark Grey)
- ✅ Automatically decrements the product's total stock
- ✅ Logs all inventory changes in the console

**Code Path:**
```
Customer checkout → Stripe webhook fires → Order created → decrementInventoryForOrder() called
```

### 2. **Auto-Refresh Admin Interface**
When you edit a product in the admin panel:
- ✅ Auto-refreshes stock data **every 30 seconds**
- ✅ Refreshes when you return to the browser tab
- ✅ Shows "Last updated" timestamp
- ✅ Manual "Refresh Now" button available

---

## 🎯 What You'll See

### In the Admin Product Edit Page:
1. **"Product Variants" section** shows:
   - Last updated time (e.g., "Last updated: 9:15:32 PM")
   - Note: "Auto-refreshes every 30s"
   - "Refresh Now" button for instant updates

2. **Stock Management section** shows:
   - Current stock for each variant (Size + Color)
   - Total stock across all variants
   - Blue info banner explaining auto-refresh

3. **Real-time Updates:**
   - Stock numbers automatically update every 30 seconds
   - If someone buys 2 thobes while you have the page open, you'll see the stock decrease within 30 seconds (or click "Refresh Now")

---

## 📊 Testing Your Inventory System

### Option 1: Manual Test (Recommended)
1. Open a product in the admin panel
2. Note the current stock for a specific variant (e.g., Size 54 = 5 pieces)
3. Place a test order on your store for that variant
4. Wait 30 seconds (or click "Refresh Now")
5. Stock should decrease by the quantity ordered

### Option 2: Use the Test Script
1. Open `scripts/test-inventory-system.ts`
2. Update `TEST_PRODUCT_ID` with a real product ID from your database
3. Update `TEST_SIZE` and `TEST_COLOR` to match an existing variant
4. Run: `npx tsx scripts/test-inventory-system.ts`
5. Check the console output

---

## 🔍 Troubleshooting

### "Stock not decreasing after orders"
1. Check the Stripe webhook logs (Render.com dashboard → Logs)
2. Look for these log messages:
   ```
   📦 Decrementing inventory for X items
   ✅ Inventory decremented successfully for all items
   ```
3. If you see errors, check:
   - Firebase credentials are configured
   - Product IDs in orders match database
   - Variants exist in the `variants` subcollection

### "Auto-refresh not working"
1. Make sure you're in edit mode (editing an existing product)
2. Check browser console for refresh logs:
   ```
   🔄 Auto-refreshing stock data...
   ```
3. Check the "Last updated" timestamp to confirm it's refreshing

### "Stock shows wrong numbers"
1. Click "Refresh Now" to force an immediate update
2. Check your Firestore database:
   - `products/{id}` → `counts.totalStock` field
   - `products/{id}/variants/{variantId}` → `stock` field
3. Verify these numbers match your actual inventory

---

## 🔧 Technical Details

### Files Modified:
1. **`components/admin/CreateProductForm.tsx`**
   - Added auto-refresh every 30 seconds
   - Added visibility change refresh (when tab regains focus)
   - Added "Refresh Now" button
   - Added last updated timestamp

2. **`components/admin/VariantStockMatrix.tsx`**
   - Updated info banner to mention auto-refresh

3. **`lib/inventory.ts`** (already existed)
   - `decrementInventoryForOrder()` - decreases stock for all items in an order
   - `validateInventoryForOrder()` - checks if items are in stock
   - Updates both variant stock AND product totalStock

### Inventory Decrement Logic:
```typescript
// For each item in the order:
1. Find the matching variant (by size + color)
2. Decrement variant.stock by qty
3. Decrement product.counts.totalStock by qty
4. Update product.stock by qty (legacy field)
```

---

## 📝 Important Notes

1. **Stock never goes below 0** - The system uses `Math.max(0, stock - qty)` to prevent negative stock

2. **Both places updated** - The system updates:
   - Variant-level stock: `products/{id}/variants/{variantId}.stock`
   - Product-level stock: `products/{id}.counts.totalStock`

3. **Auto-refresh only in edit mode** - The 30-second auto-refresh only runs when editing an existing product, not when creating a new one

4. **Manual refresh always available** - Click "Refresh Now" for instant updates instead of waiting 30 seconds

5. **Console logging** - All inventory operations are logged to the console for debugging

---

## ✨ Next Steps

Your inventory system is now fully automated! Here's what to do next:

1. ✅ Place a test order to verify stock decreases
2. ✅ Open the admin product page and watch it auto-refresh
3. ✅ Check the console logs to see the inventory updates
4. ✅ Monitor your first real orders to ensure stock is accurate

If you have any issues, check the troubleshooting section above or review the console logs for detailed error messages.
