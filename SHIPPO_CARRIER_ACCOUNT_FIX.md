# SHIPPO SAMPLE LABEL ISSUE - CARRIER ACCOUNT PROBLEM

**Your Token:** `shippo_live_...` ✅ (CORRECT - It IS live!)  
**The Problem:** Shippo needs **live carrier accounts** connected

---

## 🎯 The Real Issue

Even with a **live API token**, Shippo will create **SAMPLE labels** if you don't have **live carrier accounts** connected in your Shippo dashboard.

**Think of it like this:**
- ✅ You have a live Shippo account (your API token)
- ❌ But you're using Shippo's "demo" USPS/UPS accounts (which create SAMPLE labels)
- ✅ You need to connect YOUR OWN carrier accounts to create real labels

---

## 🔧 How to Fix - Connect Live Carrier Accounts

### **Option 1: Use Your Own USPS Account (Recommended)**

1. **Get a USPS Account:**
   - Go to https://www.usps.com/business/
   - Create a business account
   - Apply for Commercial Base Pricing (CBP) or Commercial Plus Pricing (CPP)
   - This gives you discounted rates

2. **Connect to Shippo:**
   - Log into Shippo dashboard: https://app.goshippo.com
   - Go to **Settings → Carriers**
   - Click **"Add Carrier"**
   - Select **"USPS"**
   - Choose **"My USPS Account"** (NOT "Shippo USPS Account")
   - Enter your USPS credentials
   - Click **"Connect"**

3. **Verify:**
   - You should see "USPS - My Account" in your carrier list
   - Status should be "Active"
   - NOT "Shippo USPS (Test)" or "Demo"

### **Option 2: Use Shippo's USPS Account (Easier, But More Expensive)**

If you don't want to set up your own USPS account:

1. **Activate Shippo Carrier Account:**
   - Log into Shippo: https://app.goshippo.com
   - Go to **Settings → Carriers**
   - Look for **"Shippo USPS Account"**
   - Click **"Activate for Live Mode"** or **"Request Access"**
   
2. **Requirements:**
   - May need to add billing information
   - May require business verification
   - Rates will be slightly higher than your own USPS account

3. **Approval Time:**
   - Usually instant for existing Shippo users
   - May take 1-2 business days for new accounts

---

## 📋 Step-by-Step Checklist

### **Step 1: Check Current Carrier Status**

1. Go to https://app.goshippo.com
2. Click **Settings** (gear icon)
3. Click **Carriers**
4. Look at your carrier list:

**If you see:**
- ❌ "Shippo USPS (Test)" → This creates SAMPLE labels
- ❌ "Demo Account" → This creates SAMPLE labels
- ✅ "USPS - My Account" → This creates REAL labels
- ✅ "Shippo USPS (Live)" → This creates REAL labels

### **Step 2: Check Account Mode**

At the top right of Shippo dashboard:
- ❌ If it says **"TEST MODE"** in orange → Switch to live mode
- ✅ If there's **NO badge** → You're in live mode

To switch modes:
1. Click your account name (top right)
2. Look for "Switch to Live Mode" option
3. Click it

### **Step 3: Verify Billing Information**

Shippo needs billing info for live mode:
1. Go to **Settings → Billing**
2. Make sure you have:
   - ✅ Credit card added
   - ✅ Business information filled out
   - ✅ Account status: "Active"

### **Step 4: Test Label Generation**

After connecting live carriers:
1. Generate a new label
2. Check for:
   - ✅ No "SAMPLE" stamp
   - ✅ Real tracking number (9400...)
   - ✅ Scannable barcode

---

## 🚨 Common Scenarios

### **Scenario A: Using Shippo's Test Carrier Accounts**

**Problem:**
```
Settings → Carriers shows:
- Shippo USPS (Test) ← This is the problem!
```

**Solution:**
- Remove test carrier
- Add your own USPS account OR
- Request "Shippo USPS (Live)" access

### **Scenario B: Account Not Verified**

**Problem:**
- Live token works
- But Shippo says "Verify your account"

**Solution:**
1. Check email for verification link from Shippo
2. Complete business verification
3. Add billing information
4. Wait for approval (usually instant)

### **Scenario C: Need UPS Labels Too**

**To add UPS:**
1. Go to **Settings → Carriers**
2. Click **"Add Carrier"**
3. Select **"UPS"**
4. You'll need:
   - UPS account number
   - UPS username/password
   - UPS access key (get from UPS.com)

---

## 🎯 Quick Test

### **How to Know If It's Fixed:**

**After connecting live carriers, generate a test label and check:**

| Feature | Test Mode (SAMPLE) | Live Mode (REAL) |
|---------|-------------------|------------------|
| Stamp | "DO NOT MAIL - SAMPLE" | No stamp |
| Tracking | Fake number | Real number (9400...) |
| Barcode | Not scannable | Scannable by USPS |
| Cost | Free | Charged to your account |

---

## 💰 Cost Comparison

### **Option 1: Your Own USPS Account**
- **Pros:** Cheapest rates, you control pricing
- **Cons:** Need to set up USPS business account
- **Typical Cost:** $5-8 for Ground Advantage

### **Option 2: Shippo's USPS Account**
- **Pros:** Instant setup, no USPS account needed
- **Cons:** Slightly higher rates (Shippo adds markup)
- **Typical Cost:** $6-10 for Ground Advantage

### **Recommendation:**
Start with Shippo's account (easier), then switch to your own USPS account later for better rates.

---

## 📞 Next Steps

### **Right Now:**

1. **Go to Shippo Dashboard:** https://app.goshippo.com
2. **Check Carriers:** Settings → Carriers
3. **Look for:** Are you using "Test" carriers or "Live" carriers?
4. **If Test:** Switch to live OR connect your USPS account

### **Contact Shippo Support If:**

- You don't see an option to activate live carriers
- You get "Account pending approval" message
- You need help connecting your USPS account

**Email:** support@goshippo.com  
**Say:** "I have a live API token but need to activate live carrier accounts"

---

## ✅ Update .env.local Comment

Your `.env.local` has a misleading comment. Let me fix that:

**Line 35 currently says:**
```env
# Shippo API Token (Test Mode)
SHIPPO_API_TOKEN=shippo_live_...
```

**Should say:**
```env
# Shippo API Token (LIVE MODE - Real labels)
SHIPPO_API_TOKEN=shippo_live_[YOUR_TOKEN_HERE]
```

This is just a comment fix - your token is correct!

---

## 🎯 Summary

**Your Token:** ✅ CORRECT (shippo_live_...)  
**Your Address:** ✅ FIXED (Taylor, MI)  
**Problem:** ❌ Using test carrier accounts in Shippo  
**Solution:** ✅ Activate live carrier accounts in Shippo dashboard

**Next Action:** Go to Shippo dashboard → Settings → Carriers → Activate live accounts!
