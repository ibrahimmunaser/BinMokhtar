# 🔧 Fix Webhook URL Issue

## **Problem Found**

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

## **Step 1: Update Webhook URL in Stripe**

### **In Stripe Dashboard:**
1. Go to **Developers** → **Webhooks**
2. Click on your webhook: **binmukhtarretail**
3. Click **"Edit"** or **"Update endpoint"**
4. **Change the Endpoint URL to:**
   ```
   https://binmukhtarretail.com/api/stripe/webhook
   ```
5. **Make sure these events are selected:**
   - ✅ `checkout.session.completed` (REQUIRED)
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`
6. Click **"Update endpoint"** or **"Save"**

---

## **Step 2: Add Webhook Secret to Render**

### **Your Webhook Signing Secret:**
```
whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX
```

### **In Render Dashboard:**
1. Go to your **Web Service**
2. Click **Environment** tab
3. Click **"Add Environment Variable"**
4. **Key:** `STRIPE_WEBHOOK_SECRET`
5. **Value:** `whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX`
6. Click **"Save"**
7. Wait for redeploy (1-2 minutes)

---

## **Step 3: Verify Webhook is Working**

### **Test 1: Check Endpoint is Accessible**
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

### **Test 2: Make a Test Purchase**
1. Add item to cart
2. Go to checkout
3. Complete payment
4. Check **Stripe Dashboard** → **Webhooks** → **Recent events**
5. You should see a `checkout.session.completed` event with **200 Success**

### **Test 3: Check Render Logs**
After making a test purchase, check Render logs for:
```
📥 Webhook received at: ...
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 Attempting to send order confirmation email...
✅ Order confirmation email sent successfully to: ...
```

---

## **Quick Checklist**

- [ ] Webhook URL updated to: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Webhook listening to `checkout.session.completed` event
- [ ] `STRIPE_WEBHOOK_SECRET` added to Render environment variables
- [ ] `RESEND_API_KEY` added to Render environment variables (if not already)
- [ ] Webhook endpoint accessible (GET request returns 200)
- [ ] Test purchase completed
- [ ] Webhook event shows "200 Success" in Stripe Dashboard
- [ ] Email received after purchase

---

## **Why This Fixes the Issue**

The webhook URL mismatch meant:
- ❌ Stripe was calling `/api/webhooks/stripe` (doesn't exist)
- ❌ Your server was listening at `/api/stripe/webhook` (never called)
- ❌ Result: Webhook never fired → No email sent

After fixing:
- ✅ Stripe calls `/api/stripe/webhook` (correct route)
- ✅ Your server receives the webhook
- ✅ Email is sent automatically

