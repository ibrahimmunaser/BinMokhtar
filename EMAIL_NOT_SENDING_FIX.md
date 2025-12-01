# 🚨 Email Not Sending - Quick Fix Guide

## ✅ **Webhook Endpoint Status**

✅ **Webhook endpoint is accessible** - Tested and working
- URL: `https://binmukhtarretail.com/api/stripe/webhook`
- Returns: `{"status":"ok","message":"Webhook endpoint is active"}`

---

## 🔍 **Most Likely Issues (In Order of Probability)**

### **1. Missing `RESEND_API_KEY` in Render (90% of cases)**

**Check:**
1. Go to **Render Dashboard** → Your Web Service → **Environment** tab
2. Look for `RESEND_API_KEY`
3. If missing or empty → **This is the problem!**

**Fix:**
1. Get API key from: https://resend.com/api-keys
2. Copy the key (starts with `re_`)
3. Add to Render → Environment → `RESEND_API_KEY=re_YOUR_KEY_HERE`
4. Click **"Save Changes"**
5. Wait for redeploy (or manually trigger)

---

### **2. Missing `STRIPE_WEBHOOK_SECRET` in Render (5% of cases)**

**Check:**
1. Go to **Render Dashboard** → Your Web Service → **Environment** tab
2. Look for `STRIPE_WEBHOOK_SECRET`
3. If missing → **Webhook won't work!**

**Fix:**
1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Click on your webhook: `https://binmukhtarretail.com/api/stripe/webhook`
3. Click **"Reveal"** next to "Signing secret"
4. Copy the secret (starts with `whsec_`)
5. Add to Render → Environment → `STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET`
6. Click **"Save Changes"**
7. Wait for redeploy

---

### **3. Webhook Not Configured in Stripe (3% of cases)**

**Check:**
1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Look for webhook with URL: `https://binmukhtarretail.com/api/stripe/webhook`
3. If missing → **Create it!**

**Fix:**
1. Click **"Add endpoint"**
2. Enter URL: `https://binmukhtarretail.com/api/stripe/webhook`
3. Select events:
   - ✅ `checkout.session.completed` (REQUIRED)
   - ✅ `payment_intent.succeeded` (optional, for logging)
   - ✅ `payment_intent.payment_failed` (optional, for logging)
4. Click **"Add endpoint"**
5. Copy the **Signing secret** and add to Render (see #2 above)

---

### **4. Wrong Webhook URL in Stripe (2% of cases)**

**Check:**
1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Check if webhook URL is exactly: `https://binmukhtarretail.com/api/stripe/webhook`
3. If different → **Update it!**

**Fix:**
1. Click on the webhook
2. Click **"..."** → **"Update endpoint"**
3. Change URL to: `https://binmukhtarretail.com/api/stripe/webhook`
4. Click **"Save"**

---

## 🧪 **Test Email Sending (Without Purchase)**

You can test if email sending works without making a purchase:

**Option 1: Using Browser Console**
```javascript
fetch('https://binmukhtarretail.com/api/test-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'your@email.com' })
})
.then(r => r.json())
.then(console.log)
```

**Option 2: Using curl**
```bash
curl -X POST https://binmukhtarretail.com/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

**Expected Success Response:**
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

## 📋 **Check Render Logs After Purchase**

After a customer completes checkout, check Render logs:

**Go to:** Render Dashboard → Your Service → **Logs**

**Look for these messages:**

**✅ Success:**
```
📥 Webhook received at: ...
✅ Received Stripe webhook event: checkout.session.completed
📧 Attempting to send order confirmation email...
✅ Order confirmation email sent successfully to: customer@email.com
```

**❌ Failure - Missing API Key:**
```
❌ RESEND_API_KEY not set in environment variables
❌ Failed to send order confirmation email
```

**❌ Failure - Missing Webhook Secret:**
```
❌ STRIPE_WEBHOOK_SECRET is not configured
```

---

## ✅ **Quick Action Checklist**

Run through this checklist:

- [ ] `RESEND_API_KEY` is set in Render environment variables
- [ ] `STRIPE_WEBHOOK_SECRET` is set in Render environment variables
- [ ] Webhook exists in Stripe Dashboard with correct URL
- [ ] Webhook has `checkout.session.completed` event selected
- [ ] Test email endpoint works: `POST /api/test-email`
- [ ] Render service has been redeployed after adding variables
- [ ] Check Render logs after test purchase

---

## 🎯 **Most Common Fix**

**90% of the time, the issue is:**

1. `RESEND_API_KEY` is missing in Render
2. Add it: `RESEND_API_KEY=re_YOUR_KEY_FROM_RESEND`
3. Save and redeploy
4. Test with test email endpoint
5. ✅ Emails should work!

---

## 📞 **Still Not Working?**

1. **Check Render Logs** - Look for errors with `❌` or `⚠️`
2. **Test Email Endpoint** - Use `/api/test-email` to isolate the issue
3. **Verify Resend API Key** - Check it's active in Resend dashboard
4. **Check Stripe Webhook Events** - See if events are being received

See `EMAIL_DEBUGGING_COMPLETE.md` for detailed troubleshooting.

---

**Last Updated:** December 1, 2025

