# 🔍 Webhook Not Triggering Email - Debugging Guide

## **Issue:**
- ✅ Direct email test works (`/api/test-email-direct`)
- ❌ No email sent after actual purchase
- **Conclusion:** Webhook isn't calling the email function

---

## **Step 1: Check Stripe Webhook Configuration**

### **In Stripe Dashboard:**
1. Go to: **Developers** → **Webhooks**
2. Find your webhook: `binmukhtarretail`
3. **Check the URL:**
   - ✅ Should be: `https://binmukhtarretail.com/api/stripe/webhook`
   - ❌ NOT: `https://binmukhtarretail.com/api/webhooks/stripe`

4. **Check Events:**
   - ✅ Must have: `checkout.session.completed` checked
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`

5. **Check Recent Events:**
   - Click on your webhook
   - Go to **"Recent events"** tab
   - Look for `checkout.session.completed` events
   - **Check the status:**
     - ✅ **200 Success** = Webhook delivered successfully
     - ❌ **400/500 Failed** = Webhook failed (check response)

---

## **Step 2: Check Webhook Secret in Render**

### **In Render Dashboard:**
1. Go to your **Web Service** → **Environment** tab
2. **Check if `STRIPE_WEBHOOK_SECRET` exists:**
   - ✅ Should be set to: `whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX`
   - ❌ If missing, add it now

### **To add/update:**
1. Click **"Add Environment Variable"**
2. **Key:** `STRIPE_WEBHOOK_SECRET`
3. **Value:** `whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX`
4. **Save** and wait for redeploy

---

## **Step 3: Check Render Logs After Purchase**

### **After making a test purchase:**
1. **Render Dashboard** → Your Web Service → **Logs** tab
2. **Look for these messages:**

### **✅ If webhook is working:**
```
📥 Webhook received at: ...
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 ===== EMAIL SENDING STARTED =====
✅ ===== EMAIL SENT SUCCESSFULLY =====
```

### **❌ If webhook isn't being called:**
- You WON'T see: `📥 Webhook received at: ...`
- This means Stripe isn't calling your webhook

### **❌ If webhook is called but fails:**
```
❌ STRIPE_WEBHOOK_SECRET is not configured
```
OR
```
❌ Webhook signature verification failed
```
OR
```
❌ No Stripe signature found
```

---

## **Step 4: Test Webhook Endpoint Manually**

### **Test GET endpoint:**
Open in browser:
```
https://binmukhtarretail.com/api/stripe/webhook
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Webhook endpoint is active",
  "timestamp": "2025-12-02T..."
}
```

**If you get 404:**
- Route not deployed
- Check Render deployment logs

**If you get 500:**
- Check Render logs for errors
- Verify environment variables

---

## **Step 5: Check Stripe Webhook Event Logs**

### **In Stripe Dashboard:**
1. **Developers** → **Webhooks** → Click your webhook
2. **Recent events** tab
3. **Look for `checkout.session.completed` events**

### **For each event:**
- **Status:**
  - ✅ **200** = Success (webhook received)
  - ❌ **400/500** = Failed (check response)
- **Response:** What your server returned
- **Error:** Any error messages

### **If events show "Failed":**
1. Click on the failed event
2. Read the **Response** field
3. Read the **Error** field
4. Check Render logs at the same timestamp

---

## **Step 6: Verify Webhook URL Matches Route**

### **Your route is at:**
- File: `app/api/stripe/webhook/route.ts`
- URL: `/api/stripe/webhook`

### **Stripe webhook URL should be:**
```
https://binmukhtarretail.com/api/stripe/webhook
```

### **Common mistakes:**
- ❌ `/api/webhooks/stripe` (wrong path)
- ❌ `http://` instead of `https://`
- ❌ Trailing slash: `/api/stripe/webhook/`
- ❌ Wrong domain

---

## **Step 7: Check if Webhook is Listening to Correct Events**

### **Required Event:**
- ✅ `checkout.session.completed` - **MUST BE CHECKED**

### **How to verify:**
1. **Stripe Dashboard** → **Webhooks** → Your webhook
2. **Events to send** section
3. Make sure `checkout.session.completed` is **checked**

---

## **Most Common Issues:**

### **1. Webhook URL Incorrect**
- **Symptom:** Stripe shows events as "Failed" with 404
- **Fix:** Update webhook URL to `/api/stripe/webhook`

### **2. Missing Webhook Secret**
- **Symptom:** Render logs show "STRIPE_WEBHOOK_SECRET is not configured"
- **Fix:** Add `STRIPE_WEBHOOK_SECRET` to Render environment variables

### **3. Wrong Event Selected**
- **Symptom:** No webhook events in Stripe Dashboard
- **Fix:** Make sure `checkout.session.completed` is checked

### **4. Webhook Signature Verification Failed**
- **Symptom:** Render logs show "Webhook signature verification failed"
- **Fix:** Check that `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

### **5. Webhook Not Being Called**
- **Symptom:** No webhook events in Stripe Dashboard after purchase
- **Fix:** Check webhook URL, events, and webhook status (should be "Active")

---

## **Quick Checklist:**

- [ ] Webhook URL in Stripe: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Webhook status: **Active** (green)
- [ ] Event `checkout.session.completed` is **checked**
- [ ] `STRIPE_WEBHOOK_SECRET` set in Render (starts with `whsec_`)
- [ ] Webhook endpoint accessible (GET returns 200)
- [ ] Recent events in Stripe show `checkout.session.completed`
- [ ] Event status shows **200 Success**
- [ ] Render logs show webhook received after purchase

---

## **Next Steps:**

1. **Check Stripe Dashboard** → Webhooks → Recent events
2. **Check Render Logs** after making a test purchase
3. **Verify webhook URL** matches your route
4. **Verify webhook secret** is set in Render

The webhook must be configured correctly in Stripe AND the secret must be set in Render for emails to send automatically after purchases.

