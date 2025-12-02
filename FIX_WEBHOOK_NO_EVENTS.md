# 🔧 Fix: No checkout.session.completed Events in Stripe

## **Problem:**
- ❌ No `checkout.session.completed` events in Stripe Dashboard
- ❌ Webhook not being called after purchases
- ✅ Direct email test works

**This means:** Stripe isn't sending webhook events to your server.

---

## **Solution: Fix Webhook Configuration**

### **Step 1: Check Current Webhook URL**

In Stripe Dashboard:
1. **Developers** → **Webhooks**
2. Click on your webhook: `binmukhtarretail`
3. **Check the Endpoint URL**

**If it shows:**
- ❌ `https://binmukhtarretail.com/api/webhooks/stripe` (WRONG)
- ✅ `https://binmukhtarretail.com/api/stripe/webhook` (CORRECT)

---

### **Step 2: Update Webhook URL (If Wrong)**

1. **Click:** "Update endpoint" or "Edit" button
2. **Change Endpoint URL to:**
   ```
   https://binmukhtarretail.com/api/stripe/webhook
   ```
3. **Click:** "Update endpoint" or "Save"

---

### **Step 3: Verify Events Are Selected**

1. **In the same webhook page**, scroll to **"Events to send"**
2. **Make sure these are CHECKED:**
   - ✅ `checkout.session.completed` (REQUIRED)
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`

3. **If `checkout.session.completed` is NOT checked:**
   - Check the box
   - Click "Save"

---

### **Step 4: Verify Webhook Status**

1. **Check webhook status** (should be **"Active"** - green)
2. **If it's "Inactive" or "Disabled":**
   - Click "Enable" or "Activate"

---

### **Step 5: Test the Webhook**

After updating:

1. **Make a test purchase**
2. **Go to:** Stripe Dashboard → Webhooks → Your webhook → **Recent events**
3. **You should now see:**
   - `checkout.session.completed` event
   - Status: **200 Success** (green)

---

## **Alternative: Create New Webhook (If Update Doesn't Work)**

If updating doesn't work, create a new webhook:

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click:** "Add endpoint"
3. **Endpoint URL:**
   ```
   https://binmukhtarretail.com/api/stripe/webhook
   ```
4. **Events to listen to:**
   - ✅ Check: `checkout.session.completed`
   - (Optional) `payment_intent.succeeded`
   - (Optional) `payment_intent.payment_failed`
5. **Click:** "Add endpoint"
6. **Copy the new Signing Secret** (starts with `whsec_`)
7. **Update Render:**
   - Go to Render Dashboard → Environment
   - Update `STRIPE_WEBHOOK_SECRET` with the new secret
   - Save and wait for redeploy

---

## **Why This Happens:**

1. **Wrong URL:** Webhook URL doesn't match your actual route
2. **Event Not Selected:** `checkout.session.completed` not checked
3. **Webhook Inactive:** Webhook is disabled
4. **URL Changed:** You updated the route but not the webhook URL

---

## **Quick Checklist:**

- [ ] Webhook URL: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Webhook status: **Active** (green)
- [ ] Event `checkout.session.completed` is **checked**
- [ ] `STRIPE_WEBHOOK_SECRET` set in Render
- [ ] Test purchase made after fixing
- [ ] `checkout.session.completed` event appears in Recent events

---

## **After Fixing:**

1. **Make a test purchase**
2. **Check Stripe Dashboard** → Webhooks → Recent events
3. **Should see:** `checkout.session.completed` with **200 Success**
4. **Check Render logs** for:
   - `📥 Webhook received at: ...`
   - `✅ Received Stripe webhook event: checkout.session.completed`
   - `📧 ===== EMAIL SENDING STARTED =====`
   - `✅ ===== EMAIL SENT SUCCESSFULLY =====`

Once you see the event in Stripe Dashboard, the webhook is working and emails will send automatically!

