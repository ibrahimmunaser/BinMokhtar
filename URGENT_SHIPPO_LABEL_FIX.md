# URGENT FIX: Shippo Label Issues

**Date:** January 9, 2026  
**Issues Found:**
1. ❌ Wrong business address (Dearborn instead of Taylor)
2. ❌ "DO NOT MAIL - SAMPLE" stamp on labels

---

## ✅ Issue #1: Wrong Address - FIXED

### **Problem:**
Label showed: `10015 Burley Street, Dearborn, MI 48120`

### **Correct Address:**
`15600 Michael St, Taylor, MI 48180`

### **Fix Applied:**
Updated `lib/shipping/config.ts`:

```typescript
// OLD (WRONG):
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '10015 Burley Street',
  city: 'Dearborn',
  state: 'MI',
  zip: '48120',
  country: 'US',
}

// NEW (CORRECT):
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '15600 Michael St',
  city: 'Taylor',
  state: 'MI',
  zip: '48180',
  country: 'US',
}
```

**Also updated store coordinates:**
- Old: 42.284, -83.171 (Dearborn)
- New: 42.239, -83.270 (Taylor)

---

## ⚠️ Issue #2: "SAMPLE" Label - NEEDS YOUR ACTION

### **Problem:**
Label shows "DO NOT MAIL - SAMPLE" stamp

### **Cause:**
Your `.env.local` file is using a **TEST API token** instead of **LIVE API token**

### **How to Check:**

Open your `.env.local` file and look for:

```env
SHIPPO_API_TOKEN=shippo_????_xxxxxxxxxxxxxxxxxxxxx
```

**If it says `shippo_test_`** → That's test mode (SAMPLE labels)  
**It should say `shippo_live_`** → That's live mode (REAL labels)

### **How to Fix:**

1. **Get Your Live API Token:**
   - Go to https://app.goshippo.com
   - Click "Settings" (gear icon)
   - Click "API"
   - Look for "Live API Token"
   - Copy the token that starts with `shippo_live_`

2. **Update `.env.local`:**

```env
# WRONG (Test Mode - Creates SAMPLE labels):
SHIPPO_API_TOKEN=shippo_test_xxxxxxxxxxxxxxxxxxxxx

# CORRECT (Live Mode - Creates REAL labels):
SHIPPO_API_TOKEN=shippo_live_xxxxxxxxxxxxxxxxxxxxx
```

3. **Restart Your Development Server:**

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### **How to Verify:**

After restarting, check the server console logs. You should see:
```
📦 Using Shippo LIVE mode
```

If you see `📦 Using Shippo TEST mode`, the token is still wrong.

---

## 🎯 Complete Fix Checklist

### **Step 1: Address Fixed** ✅
- [x] Updated store address to Taylor, MI
- [x] Updated coordinates
- [x] Code committed to Git

### **Step 2: API Token** (YOU NEED TO DO THIS)
- [ ] Check `.env.local` file
- [ ] Verify token starts with `shippo_live_`
- [ ] If not, replace with live token from Shippo dashboard
- [ ] Restart dev server
- [ ] Check logs for "Using Shippo LIVE mode"

### **Step 3: Test Again**
- [ ] Create new test order
- [ ] Use YOUR address (15600 Michael St, Taylor)
- [ ] Generate label
- [ ] Verify label shows:
  - ✅ FROM: 15600 Michael St, Taylor, MI 48180
  - ✅ No "SAMPLE" stamp
  - ✅ Real tracking number

---

## 📋 Your .env.local Should Look Like This:

```env
# Firebase (Public - Client Side)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=binmokhtar2-967ad.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=binmokhtar2-967ad
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=binmokhtar2-967ad.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1060602772979
NEXT_PUBLIC_FIREBASE_APP_ID=1:1060602772979:web:af5df416d0b296551ea686
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-DN9ZE73RX4

# Firebase Admin (Server Side)
FIREBASE_SERVICE_ACCOUNT_JSON=eyJ0eXBlIjoi...
# OR individual fields:
# FIREBASE_ADMIN_PROJECT_ID=binmokhtar2-967ad
# FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-...
# FIREBASE_ADMIN_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Shippo - MAKE SURE THIS IS LIVE TOKEN!
SHIPPO_API_TOKEN=shippo_live_xxxxxxxxxxxxxxxxxxxxx
# NOT test token:
# SHIPPO_API_TOKEN=shippo_test_xxxxxxxxxxxxxxxxxxxxx ❌ WRONG

# Other
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
RESEND_API_KEY=re_...
ADMIN_EMAIL=youremail@example.com
```

---

## 🚨 CRITICAL: Check Your Shippo Dashboard

1. **Go to:** https://app.goshippo.com
2. **Click:** Settings → API
3. **Look for two sections:**
   - **Test API Token** (starts with `shippo_test_`)
   - **Live API Token** (starts with `shippo_live_`)

4. **Make sure you copied the LIVE one!**

### **Visual Check:**

In Shippo dashboard, look at the top-right corner:
- If it says **"TEST MODE"** in orange → You're in test mode
- If there's **NO badge** → You're in live mode

### **Transaction Check:**

After generating a label:
1. Go to Shippo dashboard → Transactions
2. Look at the most recent transaction
3. Check if it says **"TEST"** badge next to it
4. If yes → You're using test token
5. If no → You're using live token ✅

---

## 📞 Still Getting SAMPLE Labels?

### **Option 1: Double-Check Token**

```bash
# In your project folder, run:
cat .env.local | grep SHIPPO

# Should show:
SHIPPO_API_TOKEN=shippo_live_xxxxxxxxxxxxxxxxxxxxx
#                      ^^^^
#                      Must say "live" not "test"
```

### **Option 2: Verify Shippo Account Status**

Some Shippo accounts need to be "activated" for live mode:

1. Log into Shippo dashboard
2. Check if there's a banner saying "Activate your account"
3. You may need to:
   - Verify your business email
   - Add billing information
   - Complete account setup

### **Option 3: Check Carrier Accounts**

In Shippo dashboard:
1. Go to **Settings → Carriers**
2. Make sure you have **LIVE** carrier accounts connected:
   - USPS live account
   - UPS live account (if using)
3. NOT just "Shippo default test account"

---

## ✅ Success Criteria

After fixing, your label should:

**FROM Address:**
```
Bin Mukhtar Retail
15600 Michael St
Taylor, MI 48180
```

**Label Features:**
- ✅ No "DO NOT MAIL" stamp
- ✅ No "SAMPLE" text
- ✅ Real tracking number (like 9400111899223344556677)
- ✅ Scannable barcode
- ✅ Can be used for actual shipping

---

## 🎯 Quick Fix Summary

1. **Address:** ✅ ALREADY FIXED (Taylor, MI)
2. **API Token:** ⚠️ YOU MUST FIX
   - Open `.env.local`
   - Change `shippo_test_` to `shippo_live_`
   - Restart server
3. **Test:** Generate new label and verify

---

## 🆘 Need Help?

**If still getting SAMPLE labels after using live token:**

1. **Contact Shippo Support:**
   - Email: support@goshippo.com
   - Say: "I'm using my live API token but still getting SAMPLE labels"
   - They can check your account status

2. **Check Account Type:**
   - Free Shippo accounts might have limitations
   - You may need to upgrade to a paid plan
   - Or connect your own USPS/UPS account

---

**Next:** After fixing the token, push the address changes to GitHub!
