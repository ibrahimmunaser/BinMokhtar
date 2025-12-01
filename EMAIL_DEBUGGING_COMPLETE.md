# Complete Email Debugging Guide

## 🔍 **Why Emails Aren't Being Sent**

This guide will help you diagnose and fix email sending issues step by step.

---

## ✅ **Step 1: Verify Webhook Endpoint is Accessible**

The webhook endpoint is **accessible** ✅ (tested: returns `{"status":"ok"}`)

**Test it yourself:**
- Go to: `https://binmukhtarretail.com/api/stripe/webhook`
- Should see: `{"status":"ok","message":"Webhook endpoint is active"}`

---

## ✅ **Step 2: Check Environment Variables in Render**

### **Required Variables:**

1. **`RESEND_API_KEY`** (MOST IMPORTANT)
   - Must start with `re_`
   - Get from: https://resend.com/api-keys
   - Add to Render → Environment tab

2. **`STRIPE_WEBHOOK_SECRET`** (REQUIRED)
   - Must start with `whsec_`
   - Get from: Stripe Dashboard → Webhooks → Your webhook → Signing secret
   - Add to Render → Environment tab

3. **`FROM_EMAIL`** (Optional - has default)
   - Default: `Bin Mukhtar Retail <orders@binmukhtarretail.com>`
   - Must be verified in Resend if using custom domain

### **How to Check:**

1. Go to **Render Dashboard** → Your Web Service
2. Click **"Environment"** tab
3. Look for:
   - ✅ `RESEND_API_KEY` (should show `•••••`)
   - ✅ `STRIPE_WEBHOOK_SECRET` (should show `•••••`)
   - ✅ `FROM_EMAIL` (optional)

**If missing:**
- Add the variable
- Click **"Save Changes"**
- Render will auto-redeploy (or manually trigger deploy)

---

## ✅ **Step 3: Test Email Sending Directly**

### **Test Endpoint:**

You can test email sending without making a purchase:

**Using curl:**
```bash
curl -X POST https://binmukhtarretail.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Using browser console:**
```javascript
fetch('https://binmukhtarretail.com/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your@email.com' })
})
.then(r => r.json())
.then(console.log)
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "emailId": "abc123...",
  "checkYourEmail": "your@email.com"
}
```

**If Error:**
```json
{
  "success": false,
  "error": "RESEND_API_KEY not configured",
  "message": "Failed to send test email..."
}
```

---

## ✅ **Step 4: Check Stripe Webhook Configuration**

### **In Stripe Dashboard:**

1. Go to: **Stripe Dashboard** → **Developers** → **Webhooks**
2. Find your webhook endpoint: `https://binmukhtarretail.com/api/stripe/webhook`
3. Check:
   - ✅ **Status:** Enabled
   - ✅ **Events:** `checkout.session.completed` is selected
   - ✅ **Signing secret:** Copied and added to Render as `STRIPE_WEBHOOK_SECRET`

### **Test Webhook:**

1. In Stripe Dashboard → Webhooks → Your webhook
2. Click **"Send test webhook"**
3. Select event: `checkout.session.completed`
4. Click **"Send test webhook"**
5. Check **Render logs** for:
   - ✅ `📥 Webhook received`
   - ✅ `✅ Received Stripe webhook event: checkout.session.completed`
   - ✅ `📧 Attempting to send order confirmation email...`
   - ✅ `✅ Order confirmation email sent successfully`

---

## ✅ **Step 5: Check Render Logs After Purchase**

After a customer completes checkout, check Render logs:

### **What to Look For:**

**✅ Success (Email Sent):**
```
📥 Webhook received at: 2025-12-01T21:41:28.466Z
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 Attempting to send order confirmation email...
📧 Customer email: customer@example.com
📧 RESEND_API_KEY exists: true
✅ Order confirmation email sent successfully to: customer@example.com
✅ Email ID: abc123...
```

**❌ Failure - Missing API Key:**
```
📧 RESEND_API_KEY exists: false
❌ RESEND_API_KEY not set in environment variables
❌ Failed to send order confirmation email
```

**❌ Failure - Missing Webhook Secret:**
```
❌ STRIPE_WEBHOOK_SECRET is not configured
❌ Add STRIPE_WEBHOOK_SECRET to Render environment variables
```

**❌ Failure - Invalid Signature:**
```
❌ Webhook signature verification failed: ...
```

**❌ Failure - No Customer Email:**
```
⚠️ No customer email found in session
⚠️ Skipping order confirmation email
```

---

## 🔧 **Common Issues & Fixes**

### **Issue 1: "RESEND_API_KEY not configured"**

**Symptoms:**
- Logs show: `❌ RESEND_API_KEY not set`
- Test email endpoint returns error

**Fix:**
1. Get API key from: https://resend.com/api-keys
2. Add to Render → Environment → `RESEND_API_KEY=re_...`
3. Save and redeploy

---

### **Issue 2: "STRIPE_WEBHOOK_SECRET is not configured"**

**Symptoms:**
- Webhook returns 500 error
- Logs show: `❌ STRIPE_WEBHOOK_SECRET is not configured`

**Fix:**
1. Go to Stripe Dashboard → Webhooks → Your webhook
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add to Render → Environment → `STRIPE_WEBHOOK_SECRET=whsec_...`
5. Save and redeploy

---

### **Issue 3: "Webhook signature verification failed"**

**Symptoms:**
- Webhook returns 400 error
- Logs show: `❌ Webhook signature verification failed`

**Fix:**
1. Check `STRIPE_WEBHOOK_SECRET` matches the secret in Stripe Dashboard
2. Make sure webhook URL in Stripe is: `https://binmukhtarretail.com/api/stripe/webhook`
3. Regenerate webhook secret in Stripe if needed
4. Update Render environment variable
5. Redeploy

---

### **Issue 4: "No customer email found in session"**

**Symptoms:**
- Webhook processes successfully
- But logs show: `⚠️ No customer email found`
- Email not sent

**Fix:**
- This happens if customer doesn't provide email in Stripe checkout
- Stripe automatically collects email, so this is rare
- Check Stripe Dashboard → Checkout Sessions → Your session
- Verify `customer_email` or `customer_details.email` is present

---

### **Issue 5: "Invalid API key" from Resend**

**Symptoms:**
- Test email fails with "Invalid API key"
- Logs show Resend error

**Fix:**
1. Verify API key copied correctly (no extra spaces)
2. Check key is active in Resend dashboard
3. Regenerate key if needed
4. Update Render environment variable
5. Redeploy

---

## 🧪 **Quick Diagnostic Checklist**

Run through this checklist:

- [ ] Webhook endpoint accessible: `https://binmukhtarretail.com/api/stripe/webhook` returns `{"status":"ok"}`
- [ ] `RESEND_API_KEY` is set in Render environment variables
- [ ] `STRIPE_WEBHOOK_SECRET` is set in Render environment variables
- [ ] Test email endpoint works: `POST /api/test-email` with `{"email":"your@email.com"}`
- [ ] Stripe webhook is configured with correct URL
- [ ] Stripe webhook has `checkout.session.completed` event selected
- [ ] Render logs show webhook being received after purchase
- [ ] Render logs show email sending attempt
- [ ] No errors in Render logs

---

## 📞 **Still Not Working?**

If emails still aren't sending after checking everything:

1. **Check Render Logs:**
   - Go to Render Dashboard → Your Service → Logs
   - Look for errors starting with `❌` or `⚠️`
   - Copy the full error message

2. **Test Email Endpoint:**
   - Use the test endpoint to isolate the issue
   - If test email works, the issue is with webhook
   - If test email fails, the issue is with Resend configuration

3. **Verify Resend Domain:**
   - Go to Resend Dashboard → Domains
   - If using custom domain, verify it's verified
   - If using `onboarding@resend.dev`, make sure `FROM_EMAIL` matches

4. **Check Stripe Webhook Events:**
   - Go to Stripe Dashboard → Webhooks → Your webhook → Events
   - See if events are being received
   - Check if events are failing or succeeding

---

## 🎯 **Most Likely Issues (In Order)**

1. **Missing `RESEND_API_KEY` in Render** (90% of cases)
2. **Missing `STRIPE_WEBHOOK_SECRET` in Render** (5% of cases)
3. **Webhook not configured in Stripe Dashboard** (3% of cases)
4. **Invalid API key format** (2% of cases)

---

## ✅ **Quick Fix Summary**

**If emails aren't sending, do this:**

1. ✅ Add `RESEND_API_KEY=re_...` to Render environment variables
2. ✅ Add `STRIPE_WEBHOOK_SECRET=whsec_...` to Render environment variables
3. ✅ Verify webhook URL in Stripe: `https://binmukhtarretail.com/api/stripe/webhook`
4. ✅ Verify webhook event `checkout.session.completed` is selected
5. ✅ Redeploy Render service
6. ✅ Test with test email endpoint
7. ✅ Check Render logs after test purchase

---

**Last Updated:** December 1, 2025

