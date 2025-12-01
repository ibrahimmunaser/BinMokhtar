# 🔍 Email Not Sending - Complete Debugging Guide

## **Test Purchase Completed**
- ✅ Payment successful
- ✅ Session ID: `cs_test_b1c2Vpy5eEpErJI2CgnumTtlNYrPtJIcTTsT1gHpTtTrOOZ7z2t5F35VWt`
- ❌ Email not received

## **Why Emails Aren't Sending**

The email is sent by the **Stripe webhook** when `checkout.session.completed` fires. If the webhook isn't called, no email is sent.

---

## **Step 1: Check if Webhook is Configured in Stripe**

### **Go to Stripe Dashboard:**
1. **Developers** → **Webhooks**
2. **Check if you have a webhook endpoint:**
   - URL: `https://binmukhtarretail.com/api/stripe/webhook`
   - Status: Should be **Active** (green)

### **If NO webhook exists:**
1. Click **"Add endpoint"**
2. **Endpoint URL:** `https://binmukhtarretail.com/api/stripe/webhook`
3. **Events to listen to:**
   - ✅ **Required:** `checkout.session.completed`
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`
4. Click **"Add endpoint"**
5. **Copy the Signing Secret** (starts with `whsec_`)

### **If webhook EXISTS but email still not sending:**
1. Click on your webhook
2. Check **"Recent events"** tab
3. Look for `checkout.session.completed` events
4. Click on an event to see:
   - **Status:** Success (200) or Failed
   - **Response:** What your server returned
   - **Error:** Any error messages

---

## **Step 2: Check Webhook Secret in Render**

### **In Render Dashboard:**
1. Go to your **Web Service**
2. Click **Environment** tab
3. **Check if `STRIPE_WEBHOOK_SECRET` exists:**
   - ✅ Should be set to `whsec_...` (from Stripe)
   - ❌ If missing, add it now

### **To add/update:**
1. Click **"Add Environment Variable"**
2. **Key:** `STRIPE_WEBHOOK_SECRET`
3. **Value:** Paste the `whsec_...` value from Stripe Dashboard
4. **Save** and wait for redeploy (1-2 minutes)

---

## **Step 3: Check Resend API Key in Render**

### **In Render Dashboard:**
1. **Environment** tab
2. **Check if `RESEND_API_KEY` exists:**
   - ✅ Should be set to `re_...` (from Resend)
   - ❌ If missing, add it now

### **To add/update:**
1. Get your API key from [Resend Dashboard](https://resend.com/api-keys)
2. Click **"Add Environment Variable"**
3. **Key:** `RESEND_API_KEY`
4. **Value:** Paste your Resend API key (`re_...`)
5. **Save** and wait for redeploy

---

## **Step 4: Check Render Logs**

### **After making a test purchase:**
1. **Render Dashboard** → Your Web Service → **Logs** tab
2. **Look for these log messages:**

### **✅ If webhook is working, you'll see:**
```
📥 Webhook received at: ...
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 Attempting to send order confirmation email...
✅ Order confirmation email sent successfully to: ...
```

### **❌ If webhook isn't being called, you WON'T see:**
- `📥 Webhook received at: ...`
- This means Stripe isn't calling your webhook

### **❌ If webhook is called but fails, you'll see:**
```
❌ STRIPE_WEBHOOK_SECRET is not configured
```
OR
```
❌ RESEND_API_KEY not set in environment variables
```
OR
```
❌ Webhook signature verification failed
```

---

## **Step 5: Test Webhook Endpoint Manually**

### **Test if endpoint is accessible:**
Open in browser:
```
https://binmukhtarretail.com/api/stripe/webhook
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is active",
  "timestamp": "2025-12-01T..."
}
```

**If you get 404:**
- Route not deployed
- Check Render deployment logs

**If you get 500:**
- Check Render logs for errors
- Verify environment variables

---

## **Step 6: Check Stripe Webhook Event Logs**

### **In Stripe Dashboard:**
1. **Developers** → **Webhooks** → Click your webhook
2. **Recent events** tab
3. **Look for `checkout.session.completed` events**

### **For each event, check:**
- **Status:** 
  - ✅ **200** = Success (webhook received and processed)
  - ❌ **400/500** = Failed (check response for error)
- **Response:** What your server returned
- **Error:** Any error messages

### **If events show "Failed":**
- Click on the failed event
- Read the **Response** and **Error** fields
- Check Render logs at the same timestamp

---

## **Step 7: Verify Email Domain in Resend**

### **In Resend Dashboard:**
1. Go to **Domains**
2. **Check if `binmukhtarretail.com` is verified:**
   - ✅ Should show **Verified** status
   - ❌ If not verified, add DNS records

### **If domain not verified:**
1. Click **"Add Domain"**
2. Enter: `binmukhtarretail.com`
3. Add DNS records to your domain provider
4. Wait for verification (can take up to 24 hours)

### **Alternative: Use Resend's test domain**
- Emails will be sent but may go to spam
- For testing, you can use `onboarding@resend.dev` as FROM_EMAIL

---

## **Quick Checklist**

- [ ] Webhook configured in Stripe Dashboard
- [ ] Webhook URL: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Webhook listening to `checkout.session.completed`
- [ ] `STRIPE_WEBHOOK_SECRET` set in Render (starts with `whsec_`)
- [ ] `RESEND_API_KEY` set in Render (starts with `re_`)
- [ ] Webhook endpoint accessible (GET request returns 200)
- [ ] Stripe webhook events show "200 Success" status
- [ ] Render logs show webhook received and email sent
- [ ] Email domain verified in Resend (or using test domain)

---

## **Most Common Issues**

### **1. Webhook Not Configured**
- **Symptom:** No webhook events in Stripe Dashboard
- **Fix:** Create webhook in Stripe Dashboard

### **2. Missing Webhook Secret**
- **Symptom:** Render logs show "STRIPE_WEBHOOK_SECRET is not configured"
- **Fix:** Add `STRIPE_WEBHOOK_SECRET` to Render environment variables

### **3. Missing Resend API Key**
- **Symptom:** Render logs show "RESEND_API_KEY not set"
- **Fix:** Add `RESEND_API_KEY` to Render environment variables

### **4. Webhook Signature Verification Failed**
- **Symptom:** Render logs show "Webhook signature verification failed"
- **Fix:** Check that `STRIPE_WEBHOOK_SECRET` matches the secret from Stripe Dashboard

### **5. Webhook URL Incorrect**
- **Symptom:** Stripe shows webhook events as "Failed" with 404
- **Fix:** Verify webhook URL is exactly `https://binmukhtarretail.com/api/stripe/webhook`

---

## **Next Steps**

1. **Check Stripe Dashboard** → Webhooks → Recent events
2. **Check Render Logs** after making a test purchase
3. **Verify environment variables** in Render
4. **Test webhook endpoint** manually (GET request)

If you see webhook events in Stripe but emails still not sending, check Render logs for email-specific errors.

