# 🔧 Webhook URL Fix - Critical Issue Found

## **❌ Problem: Incorrect Webhook URL**

Your Stripe webhook is configured with the **wrong URL**:

### **Current (WRONG):**
```
https://binmukhtarretail.com/api/webhooks/stripe
```

### **Should be (CORRECT):**
```
https://binmukhtarretail.com/api/stripe/webhook
```

---

## **Why This Matters**

The webhook URL must match your actual API route. Your route is at:
- `app/api/stripe/webhook/route.ts`

Which means the URL is:
- `/api/stripe/webhook` ✅

But Stripe is calling:
- `/api/webhooks/stripe` ❌

This will result in a **404 Not Found** error, and Stripe won't be able to deliver webhook events.

---

## **How to Fix**

### **Step 1: Update Webhook URL in Stripe Dashboard**

1. **Go to:** Stripe Dashboard → Developers → Webhooks
2. **Click on your webhook:** `binmukhtarretail`
3. **Click:** "Update endpoint" or "Edit"
4. **Change Endpoint URL from:**
   ```
   https://binmukhtarretail.com/api/webhooks/stripe
   ```
   **To:**
   ```
   https://binmukhtarretail.com/api/stripe/webhook
   ```
5. **Click:** "Update endpoint" or "Save"

---

### **Step 2: Verify Events**

Make sure these events are selected:
- ✅ **Required:** `checkout.session.completed`
- (Optional) `payment_intent.succeeded`
- (Optional) `payment_intent.payment_failed`

---

### **Step 3: Add Signing Secret to Render**

Your webhook signing secret is:
```
whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX
```

**Add to Render:**
1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Add Environment Variable:**
   - **Key:** `STRIPE_WEBHOOK_SECRET`
   - **Value:** `whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX`
3. **Save** and wait for redeploy (1-2 minutes)

---

### **Step 4: Test the Webhook**

After updating the URL:

1. **Test endpoint accessibility:**
   - Open: `https://binmukhtarretail.com/api/stripe/webhook`
   - Should return: `{"status":"ok","message":"Webhook endpoint is active",...}`

2. **Make a test purchase:**
   - Complete a checkout
   - Check Stripe Dashboard → Webhooks → Recent events
   - Should see `checkout.session.completed` with **200 Success** status

3. **Check Render logs:**
   - Should see: `📥 Webhook received at: ...`
   - Should see: `✅ Order confirmation email sent successfully`

---

## **Quick Checklist**

- [ ] Update webhook URL in Stripe to `/api/stripe/webhook`
- [ ] Verify `checkout.session.completed` event is selected
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Render environment variables
- [ ] Verify `RESEND_API_KEY` is set in Render
- [ ] Test webhook endpoint returns 200
- [ ] Make test purchase and verify webhook is called
- [ ] Check Render logs for email sending confirmation

---

## **After Fixing**

Once you update the webhook URL and add the signing secret:

1. **Stripe will start calling your webhook** when payments complete
2. **Your server will receive** `checkout.session.completed` events
3. **Emails will be sent** automatically via Resend

The webhook URL mismatch is the primary reason emails aren't being sent!

