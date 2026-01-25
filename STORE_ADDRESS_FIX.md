# ⚠️ CRITICAL: Store Address Updated to Modesto, CA

**Date:** January 9, 2026  
**Issue:** Wrong address on Shippo labels (showed Dearborn, MI instead of Modesto, CA)  
**Status:** ✅ FIXED

---

## 🔧 What Was Fixed

### **Old Address (WRONG):**
```
10015 Burley Street
Dearborn, MI 48120
```

### **New Address (CORRECT):**
```
508 Dimensions St
Modesto, CA 95351
```

---

## 📍 Updated Configuration

**File:** `lib/shipping/config.ts`

### **Store Coordinates:**
```typescript
// Modesto, California
lat: 37.6391
lng: -120.9969
```

### **Store Address:**
```typescript
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '508 Dimensions St',
  city: 'Modesto',
  state: 'CA',
  zip: '95351',
  country: 'US',
  phone: '',  // ⚠️ ADD YOUR PHONE NUMBER HERE
  email: 'support@binmukhtarretail.com',
}
```

---

## 🚨 About "SAMPLE" Labels

### **Why You Saw "SAMPLE":**

The label in your screenshot shows "**DO NOT MAIL - SAMPLE**" because:

1. **Test Mode Labels:** If using `shippo_test_` token, labels are marked as samples
2. **Screenshot/Preview:** When viewing label before printing, may show sample watermark
3. **Not Yet Purchased:** Label transaction not completed

### **How to Get REAL Labels:**

✅ **You're already in LIVE mode**, so your labels will be real IF:

1. **Live Token Set:** ✅ You have `SHIPPO_API_TOKEN=shippo_live_...` in `.env.local`
2. **Transaction Completed:** Label must be purchased via admin panel
3. **Address Valid:** USPS must validate the address (now fixed!)

---

## ✅ Next Steps

### **1. Restart Your Server** (CRITICAL!)

The address change requires a server restart:

```bash
# If running locally:
npm run dev

# If on Render:
# Go to Render dashboard → Manual Deploy
```

**Why:** The `STORE_ADDRESS` is loaded when server starts, so old address is still in memory until restart.

### **2. Add Phone Number (Recommended)**

Edit `lib/shipping/config.ts`:

```typescript
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '508 Dimensions St',
  city: 'Modesto',
  state: 'CA',
  zip: '95351',
  country: 'US',
  phone: '(209) 555-1234',  // ← Add your real phone
  email: 'support@binmukhtarretail.com',
}
```

**Benefits:**
- Carriers can call if delivery issues
- Required for some UPS services
- Professional appearance on labels

### **3. Test Label Generation Again**

After server restart:

1. Go to `/admin/orders`
2. Open any paid order
3. Click "Generate Shippo Label"
4. Wait 3-5 seconds
5. Download the PDF
6. **Check the address:** Should now show 508 Dimensions St, Modesto, CA 95351

### **4. Verify Label is REAL (Not Sample)**

**Real labels will:**
- ✅ Have valid tracking number (not test format)
- ✅ Show correct "FROM" address (508 Dimensions St, Modesto, CA)
- ✅ Be scannable by USPS/UPS
- ✅ Not say "SAMPLE" or "DO NOT MAIL"
- ✅ Charge your Shippo account

**If still showing SAMPLE:**
- Check `.env.local` has `SHIPPO_API_TOKEN=shippo_live_...`
- Verify no `SHIPPO_USE_TEST=true` in environment
- Check Render environment variables (if deployed)
- Restart server after any env changes

---

## 🔍 How to Verify Address Update

### **Method 1: Check Server Logs**

When you generate a label, look for:

```
📦 Creating Shippo label for order: [order_id]
📦 Parcel: {...}
📦 Creating Shippo shipment...
```

Then check the address in the shipment data.

### **Method 2: Check Shippo Dashboard**

1. Go to https://app.goshippo.com
2. Click "Shipments"
3. View latest shipment
4. Verify "FROM" address shows:
   ```
   Bin Mukhtar Retail
   508 Dimensions St
   Modesto, CA 95351
   ```

### **Method 3: Generate Test Label**

1. Create test order on your site
2. Use **your own address** as destination
3. Complete checkout
4. Generate label in admin
5. Check label PDF shows correct FROM address
6. Void label in Shippo dashboard (get refund)

---

## 💡 Important Notes

### **Local Delivery Radius**

With the new Modesto address, local delivery radius is:
- **15 miles** from 508 Dimensions St, Modesto, CA
- Covers most of Modesto metro area
- Adjust in `config.ts` if needed: `LOCAL_DELIVERY_RADIUS_MILES`

### **Shipping Rates Impact**

Address change from Michigan to California will affect rates:
- **West Coast shipping:** Cheaper now (CA to CA, WA, OR, etc.)
- **East Coast shipping:** More expensive (CA to NY, FL, etc.)
- **Midwest shipping:** Similar or slightly higher

**Expected Rate Changes:**
- CA destinations: -20% to -40% cheaper
- West Coast: -10% to -30% cheaper
- East Coast: +10% to +30% more expensive

### **Carrier Accounts**

If you have carrier accounts with USPS/UPS:
- Update your account address to Modesto
- Notify carriers of business address change
- May get better rates with California origin

---

## 🐛 Troubleshooting

### **Issue: Still seeing old Dearborn address**

**Solution:**
```bash
# 1. Verify code change
cat lib/shipping/config.ts | grep "Modesto"

# 2. Restart server
npm run dev

# 3. Clear any caches
# Delete node_modules/.cache if exists
rm -rf node_modules/.cache

# 4. Hard reload browser
# Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
```

### **Issue: Label still says SAMPLE**

**Solution:**
```bash
# 1. Check environment
cat .env.local | grep SHIPPO

# Should show:
# SHIPPO_API_TOKEN=shippo_live_xxxxxxxxxxxxx
# (NOT shippo_test_)

# 2. Remove test flag if present
# Delete or comment out:
# SHIPPO_USE_TEST=true

# 3. Restart server
npm run dev
```

### **Issue: "Invalid address" error**

**Solution:**
1. Verify zip code is correct (95351 for Modesto, CA)
2. Check street name spelling: "Dimensions" not "Dimension"
3. Verify address exists (Google Maps check)
4. Try adding suite/unit number if applicable

---

## ✅ Verification Checklist

Before generating real customer labels:

- [ ] ✅ Code updated to Modesto address
- [ ] ✅ Server restarted
- [ ] ✅ Phone number added (optional but recommended)
- [ ] ✅ Live API token confirmed in `.env.local`
- [ ] ✅ Test label generated with correct address
- [ ] ✅ Label shows "508 Dimensions St, Modesto, CA"
- [ ] ✅ Label does NOT say "SAMPLE"
- [ ] ✅ Tracking number is real format
- [ ] ✅ Test label voided in Shippo dashboard
- [ ] ✅ Changes pushed to GitHub

---

## 📦 Expected Label Format

After fix, your labels should show:

```
FROM:
Bin Mukhtar Retail
508 Dimensions St
Modesto, CA 95351

TO:
[Customer Name]
[Customer Address]
[City, State Zip]

SERVICE: USPS Ground Advantage
TRACKING: 9400111899XXXXXXXXXX
```

**No "SAMPLE" or "DO NOT MAIL" text!**

---

## 🚀 Deploy to Production

After verifying locally:

### **1. Push to GitHub:**
```bash
git add .
git commit -m "Update store address to Modesto, CA"
git push origin main
```

### **2. Deploy to Render:**
1. Go to Render dashboard
2. Your app will auto-deploy from GitHub
3. Or click "Manual Deploy" for immediate deployment

### **3. Verify on Production:**
1. Create test order on live site
2. Generate label
3. Check address is correct
4. Void label if test

---

## 📞 Support

### **If Address Still Wrong:**

**Check These Locations:**
1. `lib/shipping/config.ts` - Main configuration (FIXED)
2. `.env.local` - Environment overrides
3. Render dashboard - Environment variables
4. Shippo dashboard - Account settings

**Clear Caches:**
- Server restart required for config changes
- Browser hard reload
- Delete `.next` folder if using Next.js

### **If Labels Still Say SAMPLE:**

**Verify:**
1. Using live API token (starts with `shippo_live_`)
2. No test mode flag in environment
3. Transaction completed successfully
4. Label URL downloaded (not just preview)

---

## ✅ Summary

```
🔧 FIXED: Store Address
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OLD: 10015 Burley Street, Dearborn, MI 48120
NEW: 508 Dimensions St, Modesto, CA 95351

✅ Coordinates updated (Modesto)
✅ Zip code updated (95351)
✅ Local delivery radius: 15 miles
⚠️ RESTART SERVER REQUIRED
⚠️ Add phone number (recommended)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STATUS: Ready for testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Next:** Restart server, generate test label, verify address is correct!
