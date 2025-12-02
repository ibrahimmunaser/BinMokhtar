# 🔍 Comprehensive Webhook Debugging Guide

## **Current Status:**
- ✅ Events ARE being generated (`checkout.session.completed`)
- ❌ Webhook returning **400 ERR** (signature verification failing)
- ❌ Emails NOT being sent

---

## **Step 1: Check Webhook Status**

Visit: `https://binmukhtarretail.com/api/webhook-status`

This shows:
- All environment variables status
- Stripe keys configuration
- Email configuration
- Firebase configuration

**Share the output** - this will tell us what's missing.

---

## **Step 2: Test Email Directly**

Visit: `https://binmukhtarretail.com/api/test-webhook-direct`

Or use this command:
```bash
curl -X POST https://binmukhtarretail.com/api/test-webhook-direct \
  -H "Content-Type: application/json" \
  -d '{"customerEmail":"ibrahimmunaser@gmail.com","testEmail":true}'
```

This tests email sending **without** webhook signature verification.

**Share the output** - this will tell us if email sending works.

---

## **Step 3: Check Render Logs**

After making a purchase or clicking "Resend" on a failed webhook:

1. **Render Dashboard** → Your Web Service → **Logs** tab
2. **Look for:**
   - `📥 Webhook received at: ...`
   - `❌ ===== WEBHOOK SIGNATURE VERIFICATION FAILED =====`
   - `📧 ===== EMAIL SENDING STARTED =====`
   - `❌ ===== EMAIL SEND FAILED =====`

**Share the logs** - this will show exactly what's failing.

---

## **Step 4: Verify Webhook Secret**

The 400 error means signature verification is failing. Check:

1. **Stripe Dashboard** (Test Mode) → **Webhooks** → Your webhook
2. **Copy** the signing secret (starts with `whsec_`)
3. **Render Dashboard** → **Environment** → `STRIPE_WEBHOOK_SECRET`
4. **Verify** they match **exactly** (character by character)

---

## **Step 5: Test Complete Flow**

1. **Make a test purchase**
2. **Check Stripe Dashboard** → Webhooks → Event deliveries
3. **Click "Resend"** on failed delivery
4. **Check Render logs** immediately
5. **Share** what you see

---

## **What to Share:**

1. **Output from** `/api/webhook-status`
2. **Output from** `/api/test-webhook-direct` (POST request)
3. **Render logs** from a webhook attempt
4. **Stripe Dashboard** → Event deliveries → Error details

This will help us find the exact issue!

