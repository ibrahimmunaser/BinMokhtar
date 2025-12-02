# 🧪 Testing with Stripe Test Keys - Complete Guide

## ✅ **Your Current Test Keys Configuration**

Based on your Render environment variables, you're currently set up with **test keys** - perfect for testing! ✅

### **Current Test Keys in Render:**
- **Publishable Key:** `pk_test_YOUR_TEST_PUBLISHABLE_KEY`
- **Secret Key:** `sk_test_YOUR_TEST_SECRET_KEY`
- **Webhook Secret:** `whsec_YOUR_TEST_WEBHOOK_SECRET`

**⚠️ Note:** Replace the placeholders above with your actual test keys from Stripe Dashboard (Test Mode).

---

## ⚠️ **Important: Verify Keys Match**

Make sure your Render environment variables match your Stripe Dashboard (Test Mode):

1. **Go to Stripe Dashboard** → Toggle to **TEST MODE** (top right)
2. **Developers** → **API Keys**
3. **Verify:**
   - Publishable key matches `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Render
   - Secret key matches `STRIPE_SECRET_KEY` in Render
4. **Developers** → **Webhooks** → Click your webhook → **Reveal signing secret**
5. **Verify:** Webhook secret matches `STRIPE_WEBHOOK_SECRET` in Render

### **⚠️ Potential Issue: Keys from Different Accounts**

Your test keys appear to be from different Stripe accounts:
- **Publishable Key Account:** `51SReiIQppfBXsI5H3eH9cFwDMTHsplaxiayEBsVp4i7XzHuMPaHVVThaqRey6unOy1QN4TW9u7uaBKn49pDTILUq00aHdhPGKa`
- **Secret Key Account:** `51SReiIQppfBXsI5HOohpib4Jgwo11polfVPjafplzckdrLiLndBBVnoA0uenXgJRJkHHG05aB4kkbJkfhv8IttRv0007M5JwIA`

**This can cause issues:**
- Webhooks might not work correctly
- Payments might complete but webhooks fail
- Email confirmations might not send

**To Fix:**
1. **Stripe Dashboard** (Test Mode) → **Developers** → **API Keys**
2. **Use keys from the same account** (either use the account that matches your secret key, or get a new secret key that matches your publishable key)
3. **Update Render** with matching keys
4. **Update webhook** to use the webhook secret from the same account

**Note:** If your payments are working fine, you can continue testing, but it's recommended to use matching keys for production.

---

## 🧪 **Test Card Numbers**

Use these test cards to simulate different payment scenarios:

### **✅ Successful Payment**
```
Card Number: 4242 4242 4242 4242
Expiry: Any future date (e.g., 12/34)
CVC: Any 3 digits (e.g., 123)
ZIP: Any 5 digits (e.g., 12345)
```

### **❌ Declined Card**
```
Card Number: 4000 0000 0000 0002
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### **🔐 Requires 3D Secure Authentication**
```
Card Number: 4000 0025 0000 3155
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### **💰 Insufficient Funds**
```
Card Number: 4000 0000 0000 9995
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

### **💳 Requires Authentication (SCA)**
```
Card Number: 4000 0027 6000 3184
Expiry: Any future date
CVC: Any 3 digits
ZIP: Any 5 digits
```

---

## 📋 **Step-by-Step Testing Process**

### **Step 1: Verify Environment Variables**

1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Verify these are set:**
   - ✅ `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - ✅ `STRIPE_SECRET_KEY` (starts with `sk_test_`)
   - ✅ `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`)

### **Step 2: Verify Stripe Webhook (Test Mode)**

1. **Stripe Dashboard** → Toggle to **TEST MODE** (top right)
2. **Developers** → **Webhooks**
3. **Verify webhook endpoint:**
   - URL: `https://your-render-app.onrender.com/api/stripe/webhook`
   - Status: **Active** ✅
   - Events: `checkout.session.completed` is selected
4. **Copy signing secret** and verify it matches Render's `STRIPE_WEBHOOK_SECRET`

### **Step 3: Test a Purchase**

1. **Go to your website**
2. **Add products to cart**
3. **Go to checkout** (`/checkout`)
4. **Click "Proceed to Secure Checkout"**
5. **On Stripe checkout page:**
   - Enter test card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`
   - Fill in shipping address
6. **Complete payment**
7. **Should redirect to:** `/checkout/success`

### **Step 4: Verify Payment in Stripe Dashboard**

1. **Stripe Dashboard** (Test Mode) → **Payments**
2. **Look for your test payment**
3. **Status should be:** ✅ **Succeeded**
4. **Amount should match** your order total

### **Step 5: Verify Webhook Received**

1. **Stripe Dashboard** (Test Mode) → **Developers** → **Webhooks**
2. **Click your webhook endpoint**
3. **Go to "Recent events" tab**
4. **Look for:** `checkout.session.completed` event
5. **Status should be:** ✅ **200 Success** (green)

### **Step 6: Check Render Logs**

1. **Render Dashboard** → Your Service → **Logs** tab
2. **Look for these messages:**
   ```
   📥 Webhook received at: ...
   ✅ Webhook signature verified successfully
   ✅ Received Stripe webhook event: checkout.session.completed
   🎉 Processing checkout.session.completed
   📧 ===== EMAIL SENDING STARTED =====
   ✅ ===== EMAIL SENT SUCCESSFULLY =====
   ```

### **Step 7: Verify Email Sent**

1. **Check your email inbox** (the email you used during checkout)
2. **Check spam folder** if not in inbox
3. **Email should be from:** `orders@binmukhtarretail.com`
4. **Email should contain:** Order details, items, total, etc.

---

## ✅ **Testing Checklist**

Use this checklist to verify everything works:

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_test_`
- [ ] `STRIPE_SECRET_KEY` starts with `sk_test_`
- [ ] `STRIPE_WEBHOOK_SECRET` starts with `whsec_`
- [ ] Stripe Dashboard is in **TEST MODE**
- [ ] Webhook endpoint URL points to your Render app
- [ ] Webhook is **Active** in Stripe Dashboard
- [ ] Can complete checkout with test card `4242 4242 4242 4242`
- [ ] Payment shows as **Succeeded** in Stripe Dashboard
- [ ] Webhook event `checkout.session.completed` shows **200 Success**
- [ ] Render logs show webhook received and verified
- [ ] Order confirmation email received
- [ ] Cart is cleared after successful payment

---

## 🧪 **Test Different Scenarios**

### **Test 1: Successful Payment**
- **Card:** `4242 4242 4242 4242`
- **Expected:** Payment succeeds, email sent, cart cleared

### **Test 2: Declined Card**
- **Card:** `4000 0000 0000 0002`
- **Expected:** Payment fails, error message shown, cart preserved

### **Test 3: 3D Secure Authentication**
- **Card:** `4000 0025 0000 3155`
- **Expected:** Redirects to authentication page, then completes

### **Test 4: Cancel Payment**
- **Card:** `4242 4242 4242 4242`
- **Action:** Click "Back" or "Cancel" during checkout
- **Expected:** Redirects to `/checkout/cancel`, cart preserved

---

## 🆘 **Troubleshooting Test Payments**

### **Issue: Payment fails immediately**
- **Check:** `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are both test keys
- **Check:** Both keys are from the same Stripe account
- **Check:** Stripe Dashboard is in **TEST MODE** (not Live Mode)

### **Issue: Webhook not received**
- **Check:** Webhook endpoint URL in Stripe Dashboard matches your Render URL
- **Check:** `STRIPE_WEBHOOK_SECRET` in Render matches Stripe Dashboard signing secret
- **Check:** Webhook is **Active** in Stripe Dashboard
- **Check:** You're looking at **TEST MODE** webhooks, not Live Mode

### **Issue: Email not sent**
- **Check:** Render logs for email errors
- **Check:** `RESEND_API_KEY` is set in Render
- **Check:** `FROM_EMAIL` and `REPLY_TO_EMAIL` are set correctly
- **Check:** Webhook was received successfully (check Render logs)

### **Issue: "Invalid API Key" error**
- **Check:** Keys are copied correctly (no extra spaces)
- **Check:** Keys start with `pk_test_` and `sk_test_` (not `pk_live_` or `sk_live_`)
- **Check:** Stripe Dashboard is in **TEST MODE**

---

## 📊 **Monitor Test Payments**

### **In Stripe Dashboard (Test Mode):**
- **Payments:** See all test payments
- **Webhooks:** See webhook events and responses
- **Logs:** See API request logs

### **In Render:**
- **Logs:** See server-side logs, webhook processing, email sending
- **Metrics:** Monitor app performance

---

## 🔄 **When Ready to Go Live**

When you're done testing and ready for real payments:

1. **Read:** `SWITCH_TO_LIVE_STRIPE_KEYS.md`
2. **Update:** Render environment variables with live keys
3. **Update:** Stripe webhook endpoint in **LIVE MODE**
4. **Test:** With a small real payment first
5. **Monitor:** Closely for the first few real transactions

**Remember:** In live mode, all payments are **real** - you'll be charged real money!

---

## ✅ **You're All Set for Testing!**

Your test keys are configured. Use the test cards above to test different payment scenarios without any real charges. Happy testing! 🎉

