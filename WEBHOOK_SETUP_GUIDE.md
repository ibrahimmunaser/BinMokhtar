# 🔧 Stripe Webhook Setup Guide

## **Issue: Webhook URL Not Working**

If Stripe says the webhook URL `https://binmukhtarretail.com/api/stripe/webhook` didn't work, follow these steps:

---

## **Step 1: Test Webhook Endpoint**

### **Test if the endpoint is accessible:**

Open your browser and go to:
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
- Route might not be deployed
- Check Render deployment logs
- Make sure `app/api/stripe/webhook/route.ts` exists

**If you get 500:**
- Check Render logs for errors
- Verify environment variables are set

---

## **Step 2: Check Stripe Webhook Configuration**

### **In Stripe Dashboard:**

1. **Go to:** Developers → Webhooks
2. **Click:** "Add endpoint" (or edit existing)
3. **Endpoint URL:** `https://binmukhtarretail.com/api/stripe/webhook`
   - ✅ Must be HTTPS (not HTTP)
   - ✅ No trailing slash
   - ✅ Exact URL: `/api/stripe/webhook`

4. **Events to listen to:**
   - ✅ Check: `checkout.session.completed`
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`

5. **Click:** "Add endpoint"

---

## **Step 3: Get Webhook Signing Secret**

After creating the webhook:

1. **Click on your webhook** in Stripe Dashboard
2. **Find:** "Signing secret" section
3. **Click:** "Reveal" button
4. **Copy** the value (starts with `whsec_`)

---

## **Step 4: Add to Render**

1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Add Environment Variable:**
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** Paste the `whsec_...` value from Stripe
3. **Save** changes
4. **Wait** for redeploy (1-2 minutes)

---

## **Step 5: Test Webhook**

### **Option A: Use Stripe Test Webhook**

1. **Stripe Dashboard** → Webhooks → Your webhook
2. **Click:** "Send test webhook"
3. **Select:** `checkout.session.completed`
4. **Click:** "Send test webhook"
5. **Check:** Response tab for status

**Expected Response:**
- Status: **200 OK**
- Response: `{"received": true}`

---

### **Option B: Make a Real Purchase**

1. **Make a test purchase** on your site
2. **Check Render logs:**
   - Should see: `✅ Received Stripe webhook event: checkout.session.completed`
   - Should see: `📧 Attempting to send order confirmation email...`
   - Should see: `✅ Order confirmation email sent successfully`

3. **Check Stripe Dashboard:**
   - Webhooks → Your webhook → Recent events
   - Should see `checkout.session.completed` event
   - Response should be **200 OK**

---

## **Common Issues & Fixes**

### **Issue 1: "404 Not Found"**

**Symptoms:**
- Stripe can't reach the endpoint
- Browser shows 404

**Fix:**
1. Verify route exists: `app/api/stripe/webhook/route.ts`
2. Check Render deployment logs
3. Make sure route is deployed
4. Try accessing: `https://binmukhtarretail.com/api/stripe/webhook` in browser
5. Should return JSON, not 404

---

### **Issue 2: "500 Internal Server Error"**

**Symptoms:**
- Stripe receives 500 error
- Render logs show errors

**Common Causes:**
- `STRIPE_WEBHOOK_SECRET` not set
- `STRIPE_SECRET_KEY` not set
- Firebase connection issue
- Resend API key issue

**Fix:**
1. Check Render logs for specific error
2. Verify all environment variables are set
3. Check webhook route code for errors

---

### **Issue 3: "Webhook signature verification failed"**

**Symptoms:**
- Stripe sends webhook
- Server returns 400 error
- Logs show: "Webhook signature verification failed"

**Fix:**
1. Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe
2. Check for typos or extra spaces
3. Make sure you're using the correct webhook's secret
4. Regenerate webhook secret if needed

---

### **Issue 4: "No signature found"**

**Symptoms:**
- Server returns 400 error
- Logs show: "No Stripe signature found"

**Fix:**
- This usually means Stripe isn't sending the signature header
- Check webhook URL is correct
- Make sure you're testing with Stripe's test webhook, not manual requests

---

## **Step 6: Verify Everything Works**

### **Checklist:**

- [ ] Webhook endpoint accessible: `https://binmukhtarretail.com/api/stripe/webhook` returns JSON
- [ ] Webhook created in Stripe Dashboard
- [ ] URL is correct: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Events selected: `checkout.session.completed`
- [ ] `STRIPE_WEBHOOK_SECRET` added to Render
- [ ] Test webhook returns 200 OK
- [ ] Render logs show webhook received
- [ ] Render logs show email sent

---

## **Quick Test:**

### **1. Test Endpoint (GET):**
```bash
curl https://binmukhtarretail.com/api/stripe/webhook
```

**Expected:**
```json
{"status":"ok","message":"Webhook endpoint is active","timestamp":"..."}
```

### **2. Test Webhook (Stripe Dashboard):**
- Send test webhook
- Check response is 200 OK

### **3. Test Purchase:**
- Make a purchase
- Check email arrives
- Check Render logs

---

## **Still Not Working?**

### **Check These:**

1. **Render Logs:**
   - Copy all logs after webhook attempt
   - Look for error messages

2. **Stripe Webhook Logs:**
   - Stripe Dashboard → Webhooks → Your webhook → Recent events
   - Click on event → Check Response tab
   - Copy error message

3. **Verify Route Exists:**
   - Check `app/api/stripe/webhook/route.ts` exists
   - Check it's committed to Git
   - Check Render deployment includes it

4. **Check Environment Variables:**
   - `STRIPE_WEBHOOK_SECRET` is set
   - `STRIPE_SECRET_KEY` is set
   - `RESEND_API_KEY` is set

---

## **Most Common Fix:**

**90% of webhook issues are:**
- Missing `STRIPE_WEBHOOK_SECRET` in Render

**Fix:**
1. Stripe Dashboard → Webhooks → Your webhook → Reveal signing secret
2. Copy `whsec_...` value
3. Render Dashboard → Environment → Add `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Save and wait for redeploy
5. Test again

**That should fix it!** 🎉

