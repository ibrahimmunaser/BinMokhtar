# 🚀 Switch to Live Stripe Keys - Complete Guide

## ✅ **Your Live Stripe Credentials**

All keys are from the **same Stripe account** (`51SReiIQppfBXsI5H`), which is correct! ✅

### **Live Keys:**
- **Publishable Key:** `pk_live_YOUR_PUBLISHABLE_KEY_HERE`
- **Secret Key:** `sk_live_YOUR_SECRET_KEY_HERE`
- **Webhook Secret:** `whsec_YOUR_WEBHOOK_SECRET_HERE`

**⚠️ Note:** Replace the placeholders above with your actual keys from Stripe Dashboard (Live Mode).

---

## 📋 **Step-by-Step: Update Render Environment Variables**

### **Step 1: Go to Render Dashboard**
1. Log in to [Render Dashboard](https://dashboard.render.com/)
2. Click on your **Web Service**
3. Go to the **Environment** tab

### **Step 2: Update Stripe Keys**

Update these **3 environment variables**:

#### **1. Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`**
- **Current (Test):** `pk_test_YOUR_TEST_PUBLISHABLE_KEY`
- **New (Live):** `pk_live_YOUR_LIVE_PUBLISHABLE_KEY`
- **Action:** Click **Edit** (pencil icon) → Replace with live key → **Save**

#### **2. Update `STRIPE_SECRET_KEY`**
- **Current (Test):** `sk_test_YOUR_TEST_SECRET_KEY`
- **New (Live):** `sk_live_YOUR_LIVE_SECRET_KEY`
- **Action:** Click **Edit** (pencil icon) → Replace with live key → **Save**

#### **3. Update `STRIPE_WEBHOOK_SECRET`**
- **Current (Test):** `whsec_YOUR_TEST_WEBHOOK_SECRET`
- **New (Live):** `whsec_YOUR_LIVE_WEBHOOK_SECRET`
- **Action:** Click **Edit** (pencil icon) → Replace with live webhook secret → **Save**

#### **4. Optional: Update `STRIPE_PUBLISHABLE_KEY` (if it exists)**
- If you see a variable called `STRIPE_PUBLISHABLE_KEY` (without `NEXT_PUBLIC_`), update it to the same live publishable key, or you can delete it since it's not used in the code.

---

## ⚠️ **IMPORTANT: Update Stripe Webhook Endpoint**

After switching to live keys, you **MUST** update your Stripe webhook endpoint:

### **Step 1: Go to Stripe Dashboard (Live Mode)**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle to LIVE MODE** (top right corner)
3. Navigate to **Developers** → **Webhooks**

### **Step 2: Update Webhook URL**
1. Find your webhook endpoint (or create a new one)
2. **Endpoint URL:** `https://your-render-app.onrender.com/api/stripe/webhook`
   - Replace `your-render-app` with your actual Render app name
3. **Events to listen to:** Make sure these events are selected:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Save** the webhook

### **Step 3: Copy the New Signing Secret**
1. After saving, click on the webhook endpoint
2. Click **"Reveal"** next to **"Signing secret"**
3. Copy the secret (should be `whsec_YOUR_WEBHOOK_SECRET`)
4. **Verify** it matches what you set in Render

---

## ✅ **Verification Checklist**

After updating, verify:

- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` starts with `pk_live_`
- [ ] `STRIPE_SECRET_KEY` starts with `sk_live_`
- [ ] `STRIPE_WEBHOOK_SECRET` starts with `whsec_`
- [ ] All keys are from the same account (`51SReiIQppfBXsI5H`)
- [ ] Webhook endpoint in Stripe Dashboard (Live Mode) points to your Render URL
- [ ] Webhook signing secret in Stripe matches `STRIPE_WEBHOOK_SECRET` in Render

---

## 🔄 **After Updating**

1. **Render will automatically redeploy** (or manually trigger a deploy)
2. **Wait 2-3 minutes** for the deployment to complete
3. **Test a payment** with a real card (in live mode, you'll be charged!)
4. **Check Render logs** to verify webhooks are working:
   - Go to Render → Your Service → **Logs** tab
   - Look for webhook events: `✅ Webhook verified` or `📥 Received webhook event`

---

## 🧪 **Testing (Before Going Live)**

If you want to test first:

1. **Keep test keys** in Render for now
2. **Test thoroughly** with test cards
3. **Switch to live keys** when ready for production
4. **Use real cards** (you'll be charged real money!)

---

## 📝 **Summary of Changes**

| Variable | Old (Test) | New (Live) |
|----------|------------|------------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_YOUR_TEST_PUBLISHABLE_KEY` | `pk_live_YOUR_LIVE_PUBLISHABLE_KEY` |
| `STRIPE_SECRET_KEY` | `sk_test_YOUR_TEST_SECRET_KEY` | `sk_live_YOUR_LIVE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_YOUR_TEST_WEBHOOK_SECRET` | `whsec_YOUR_LIVE_WEBHOOK_SECRET` |

---

## 🆘 **Troubleshooting**

### **Issue: Webhooks not working after switch**
- **Check:** Webhook endpoint URL in Stripe Dashboard (Live Mode) matches your Render URL
- **Check:** `STRIPE_WEBHOOK_SECRET` in Render matches the signing secret in Stripe Dashboard (Live Mode)
- **Check:** You're looking at **LIVE MODE** in Stripe Dashboard, not Test Mode

### **Issue: Payment fails**
- **Check:** `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` are both live keys
- **Check:** Both keys are from the same Stripe account
- **Check:** Render logs for error messages

### **Issue: "Invalid API Key" error**
- **Check:** Keys are copied correctly (no extra spaces)
- **Check:** Keys start with `pk_live_` and `sk_live_` (not `pk_test_` or `sk_test_`)

---

## ✅ **You're All Set!**

Once you've updated all three variables in Render and configured the webhook in Stripe Dashboard (Live Mode), your site will be processing **real payments**! 💳

**Remember:** In live mode, all payments are **real** - you'll be charged real money, so test carefully!

