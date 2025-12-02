# 🔍 Complete Stress Test Checklist - Email Not Sending After Purchase

## **🚨 CRITICAL ISSUE FOUND:**

### **Webhook Secret Mismatch:**
- **Stripe Dashboard:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
- **Render Environment:** `whsec_esWhourF71AdHzkCTbIPLUi1Dw6uRP1X`
- **Status:** ❌ **DO NOT MATCH** - This is why webhooks fail!

---

## **✅ Complete Configuration Checklist:**

### **1. Stripe Webhook Configuration:**
- [x] **Endpoint URL:** `https://binmukhtarretail.com/api/stripe/webhook` ✅
- [x] **Event Selected:** `checkout.session.completed` ✅
- [x] **Webhook Status:** Active ✅
- [x] **Signing Secret:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84` ✅

### **2. Render Environment Variables:**
- [x] **RESEND_API_KEY:** `re_ZVoLJewi_5BgbFNRMf9P4WepFG9nqsXbn` ✅
- [x] **STRIPE_SECRET_KEY:** Set ✅
- [ ] **STRIPE_WEBHOOK_SECRET:** `whsec_esWhourF71AdHzkCTbIPLUi1Dw6uRP1X` ❌ **WRONG!**
  - **Should be:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
- [x] **FROM_EMAIL:** `Bin Mukhtar Retail <orders@binmukhtarretail.com>` ✅
- [x] **REPLY_TO_EMAIL:** `info@binmukhtarretail.com` ✅
- [x] **GOOGLE_MAPS_API_KEY:** Set ✅
- [x] **STORE_LAT/LNG:** Set ✅
- [x] **DELIVERY_RADIUS_MILES:** Set ✅

### **3. Resend Configuration:**
- [x] **API Key:** Configured ✅
- [x] **Domain:** `binmukhtarretail.com` verified ✅
- [x] **Email sending:** Test email worked ✅

### **4. Code Configuration:**
- [x] **Webhook route:** `/api/stripe/webhook` ✅
- [x] **Email function:** Working ✅
- [x] **Logging:** Comprehensive ✅

---

## **🔧 REQUIRED FIX:**

### **Update STRIPE_WEBHOOK_SECRET in Render:**

1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Find:** `STRIPE_WEBHOOK_SECRET`
3. **Click:** Edit (pencil icon)
4. **Replace value with:**
   ```
   whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84
   ```
5. **Click:** Save
6. **Wait for redeploy** (1-2 minutes)

---

## **📋 After Fixing - Test Steps:**

### **Step 1: Verify Secret Updated**
1. **Render Dashboard** → Environment
2. **Check:** `STRIPE_WEBHOOK_SECRET` shows `whsec_Fda...` (first 10 chars)
3. **Verify:** Matches Stripe Dashboard secret

### **Step 2: Make Test Purchase**
1. **Complete a checkout** on your site
2. **Use test card:** `4242 4242 4242 4242`
3. **Complete payment**

### **Step 3: Check Stripe Dashboard**
1. **Stripe Dashboard** → Webhooks → Your webhook
2. **Recent events** tab
3. **Look for:** `checkout.session.completed`
4. **Status should be:** **200 Success** (green)

### **Step 4: Check Render Logs**
After purchase, look for:
```
📥 Webhook received at: ...
📥 Signature present: true
📥 STRIPE_WEBHOOK_SECRET exists: true
🔐 Attempting to verify webhook signature...
✅ Webhook signature verified successfully
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 ===== EMAIL SENDING STARTED =====
✅ ===== EMAIL SENT SUCCESSFULLY =====
```

### **Step 5: Verify Email Received**
1. **Check inbox** for order confirmation
2. **Check spam folder** if not in inbox
3. **Email should be from:** `orders@binmukhtarretail.com`

---

## **❌ If Still Not Working After Fix:**

### **Check These:**

1. **Webhook Secret Still Wrong:**
   - Double-check Render environment variable
   - Make sure no extra spaces or characters
   - Copy directly from Stripe Dashboard

2. **Webhook Not Being Called:**
   - Check Stripe Dashboard → Recent events
   - If no events, webhook URL might be wrong
   - Verify webhook is "Active" status

3. **Signature Verification Failing:**
   - Check Render logs for error message
   - Verify secret matches exactly (character by character)
   - Make sure you're using the correct webhook's secret

4. **Email Sending Failing:**
   - Check Render logs for email errors
   - Verify `RESEND_API_KEY` is correct
   - Check Resend dashboard for send logs

---

## **🎯 Root Cause:**

The webhook secret mismatch is preventing Stripe from successfully delivering webhook events. Once you update the secret in Render to match Stripe, everything should work.

---

## **Quick Fix Summary:**

1. **Copy secret from Stripe:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
2. **Update Render:** Replace `STRIPE_WEBHOOK_SECRET` value
3. **Save and wait** for redeploy
4. **Make test purchase**
5. **Check events** in Stripe Dashboard
6. **Check logs** in Render
7. **Verify email** received

**This is the missing piece!** Once fixed, emails will send automatically.

