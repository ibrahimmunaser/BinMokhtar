# 🧪 MANUAL CHECKOUT TEST GUIDE

**Date:** January 9, 2026  
**Purpose:** Verify UPS shipping rates appear on live website  
**Status:** Backend confirmed working - Need to verify frontend

---

## ✅ **BACKEND VERIFICATION (PASSED)**

The backend API test confirmed:
- ✅ 18 shipping options returned (3 USPS + 15 UPS)
- ✅ UPS Ground Saver: $5.76 (cheapest option)
- ✅ USPS Ground Advantage: $5.77
- ✅ API response time: 1.7 seconds

**Conclusion:** The API is working perfectly!

---

## 🔍 **FRONTEND TEST (Manual)**

### **Step 1: Check Render Deployment**

**IMPORTANT:** The fix must be deployed to Render first!

1. Go to your **Render Dashboard**: https://dashboard.render.com
2. Find your web service (binmukhtarretail.com)
3. Click on it → Go to "Events" tab
4. **Verify latest deployment shows:**
   ```
   Commit: 00c8d28 - Fix UPS shipping rates not appearing in checkout
   Status: Live ✅
   ```

5. If deployment is still "In Progress" → **WAIT** for it to complete (2-5 mins)
6. If latest commit is NOT `00c8d28` → Click "Manual Deploy" → "Clear build cache & deploy"

**❌ If Render hasn't deployed the fix yet, the frontend will still show old code!**

---

### **Step 2: Clear Browser Cache**

Before testing, clear your browser cache:

**Chrome/Edge:**
1. Press `F12` to open DevTools
2. Right-click the Refresh button
3. Click "Empty Cache and Hard Reload"

**OR**

- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**OR**

- Open in **Incognito/Private Window** (fresh start)

---

### **Step 3: Navigate to Website**

1. Go to: **https://binmukhtarretail.com/**
2. Wait for page to fully load
3. Press `F12` to open Developer Tools
4. Go to "Console" tab (keep it open)

---

### **Step 4: Add Product to Cart**

1. Click on **"Men"** or **"Shop"**
2. Find any product (preferably lower-priced)
3. Click on the product
4. Click **"Add to Cart"**
5. Verify cart icon shows (1) item

---

### **Step 5: Go to Checkout**

1. Click **Cart icon** (top right)
2. Click **"Proceed to Checkout"** or **"Checkout"**
3. Wait for checkout page to load

---

### **Step 6: Select "Shipping" Method**

1. Look for fulfillment method options
2. Click **"Shipping"** (not Pickup or Local Delivery)
3. This should show the shipping address form

---

### **Step 7: Enter Los Angeles Address**

Enter EXACTLY this address:

```
Full Name: Test User
Email: test@example.com
Phone: (555) 555-5555

Street Address: 1111 S Figueroa St
Apartment/Suite: (leave blank)
City: Los Angeles
State: CA
Zip Code: 90015
Country: United States
```

**IMPORTANT:** After entering the address, **DO NOT** click away yet!

---

### **Step 8: Watch Console Logs**

**Keep Developer Tools Console open!**

After entering the address, you should see logs like:

```
📦 Fetching shipping rates for: Los Angeles CA
📦 Shippo API request: POST /shipments
📦 Shipment created: shippo_xxxxx
📦 Shippo rate received: { provider: 'usps', serviceToken: 'usps_ground_advantage', ... }
   ✅ Included in checkout options
📦 Shippo rate received: { provider: 'ups', serviceToken: 'ups_ground', ... }
   ✅ Included in checkout options
📦 Got 18 shipping rates (filtered from 20 total)
```

---

### **Step 9: Observe Shipping Options**

**WAIT 5-10 SECONDS** for rates to load.

#### **✅ SUCCESS - What You Should See:**

```
Select Shipping Option:

○ UPS Ground Saver             $5.76  • 5 business days
○ USPS Ground Advantage        $5.77  • 4 business days
○ UPS Ground                   $9.16  • 4 business days
○ UPS 3 Day Select            $11.85  • 3 business days
○ USPS Priority Mail          $12.48  • 3 business days
... and more options
```

#### **❌ PROBLEM - What You Might See Instead:**

**Scenario A: No UPS rates**
```
Select Shipping Option:

○ USPS Ground Advantage   $5.77
○ USPS Priority Mail     $12.48
○ USPS Priority Express  $44.10
```
→ **Issue:** UPS rates are being filtered out or not returned

**Scenario B: Loading forever**
```
[Spinning loader...]
Loading shipping rates...
```
→ **Issue:** API call failed or stuck

**Scenario C: Error message**
```
❌ Unable to load shipping rates
Error: [some error message]
```
→ **Issue:** API error

---

### **Step 10: Check Network Tab**

1. In DevTools, go to **"Network"** tab
2. Filter by **"Fetch/XHR"**
3. Find the request to `/api/shipping/rates`
4. Click on it
5. Go to **"Response"** tab

**✅ Good Response:**
```json
{
  "success": true,
  "rates": [
    {
      "id": "...",
      "carrier": "ups",
      "serviceLevelName": "Ground Saver",
      "amount": 576,
      ...
    },
    {
      "id": "...",
      "carrier": "usps",
      "serviceLevelName": "Ground Advantage",
      "amount": 577,
      ...
    },
    ... 16 more rates
  ]
}
```

**❌ Bad Response:**
```json
{
  "success": false,
  "error": "Some error message"
}
```

Or only USPS rates, no UPS:
```json
{
  "success": true,
  "rates": [
    { "carrier": "usps", ... },
    { "carrier": "usps", ... },
    { "carrier": "usps", ... }
  ]
}
```

---

### **Step 11: Take Screenshots**

Take screenshots of:
1. ✅ Checkout page with shipping options visible
2. ✅ Console logs showing rate fetching
3. ✅ Network tab showing `/api/shipping/rates` response
4. ❌ Any error messages

---

## 🐛 **TROUBLESHOOTING**

### **Issue: No UPS Rates in Response**

**Possible Causes:**

1. **Render Hasn't Deployed the Fix Yet**
   - Check Render dashboard
   - Verify commit `00c8d28` is deployed
   - Wait for deployment to complete
   - Try again after deployment

2. **Old Code Still Cached**
   - Hard refresh: `Ctrl + Shift + R`
   - Clear browser cache completely
   - Try incognito window
   - Close browser, reopen, try again

3. **Server-Side Cache**
   - Render might be caching old code
   - In Render dashboard: "Manual Deploy" → "Clear build cache & deploy"
   - Wait 5 minutes, try again

4. **UPS Carrier Not Activated in Shippo**
   - Go to https://app.goshippo.com
   - Settings → Carriers
   - Verify UPS shows "Active" (not "Test")
   - If not active, activate it
   - Wait 5 minutes, try again

---

### **Issue: API Call Fails**

**Check Console for Errors:**
- `Failed to fetch`
- `SHIPPO_API_TOKEN is not configured`
- `Network error`
- `500 Internal Server Error`

**Solutions:**
1. Check Render logs for server errors
2. Verify environment variables are set
3. Check Shippo API status

---

### **Issue: Infinite Loading**

**Possible Causes:**
- API timeout
- Shippo API slow to respond
- Network issue

**Solutions:**
1. Wait 30 seconds
2. Refresh page and try again
3. Check Network tab for stuck requests

---

## 📊 **COMPARISON: Before vs After Fix**

### **Before Fix (Old Code):**
```
Shippo Returns: 18 rates (3 USPS + 15 UPS)
↓
Code Filters: Only rates in ALLOWED_SERVICE_LEVELS
↓
Frontend Shows: 3 USPS rates (UPS filtered out)
```

### **After Fix (New Code):**
```
Shippo Returns: 18 rates (3 USPS + 15 UPS)
↓
Code Filters: All USPS and UPS carriers
↓
Frontend Shows: 18 rates (3 USPS + 15 UPS)
```

---

## 🎯 **EXPECTED RESULT**

After completing all steps:

1. ✅ You should see 15-18 shipping options
2. ✅ UPS Ground Saver should be visible
3. ✅ UPS rates should show alongside USPS
4. ✅ Cheapest option should be UPS Ground Saver ($5.76)
5. ✅ No errors in console
6. ✅ API response includes both carriers

---

## 📸 **REPORT BACK**

After testing, provide:

1. **Did UPS rates appear?** YES / NO
2. **How many shipping options appeared?** (number)
3. **Which carriers were shown?** (USPS only / UPS only / Both)
4. **Screenshot of shipping options**
5. **Screenshot of console logs**
6. **Screenshot of Network response**
7. **Any error messages?**
8. **Is Render showing commit `00c8d28` deployed?** YES / NO

---

## 🚀 **QUICK CHECKLIST**

- [ ] Checked Render - Commit `00c8d28` deployed
- [ ] Cleared browser cache (hard refresh)
- [ ] Opened DevTools (F12) → Console tab
- [ ] Added product to cart
- [ ] Went to checkout
- [ ] Selected "Shipping" method
- [ ] Entered LA address (1111 S Figueroa St, 90015)
- [ ] Waited 10 seconds for rates to load
- [ ] Checked console logs for rate info
- [ ] Checked Network tab for API response
- [ ] Took screenshots
- [ ] **RESULT:** UPS rates visible? _______

---

## 📞 **IF IT STILL DOESN'T WORK**

Provide the following:

**1. Render Deployment Status:**
- Latest commit deployed: ______
- Deployment status: ______
- Deployment time: ______

**2. Console Logs:**
```
[Paste console logs here]
```

**3. Network Response:**
```json
[Paste API response here]
```

**4. Screenshots:**
- Attach screenshot of checkout page
- Attach screenshot of console
- Attach screenshot of network response

**5. Shippo Dashboard:**
- UPS carrier status: Active / Test / Not Connected
- USPS carrier status: Active / Test / Not Connected

---

**Test now and report back with screenshots!** 🎯
