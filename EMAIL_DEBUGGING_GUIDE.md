# 🔍 Email Not Sending - Debugging Guide

## **Quick Checklist:**

### **1. Check Render Logs (Most Important!)**

After making a purchase, check your **Render logs**:

1. Go to **Render Dashboard** → Your Web Service → **Logs** tab
2. Look for these messages after a purchase:

**✅ Good Signs:**
```
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 Customer email: customer@example.com
✅ Order created in Firebase: abc123...
📧 Attempting to send order confirmation email...
✅ Order confirmation email sent successfully
```

**❌ Bad Signs:**
```
❌ STRIPE_WEBHOOK_SECRET is not configured
❌ Webhook signature verification failed
❌ RESEND_API_KEY not set in environment variables
⚠️ No customer email found in session
❌ Failed to send order confirmation email
```

---

## **2. Check Stripe Webhook Status**

### **Go to Stripe Dashboard:**
1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Find your webhook** pointing to: `https://binmukhtarretail.com/api/stripe/webhook`
3. **Click on it** to see details

### **Check These:**

**✅ Webhook is Active:**
- Status should be **"Enabled"** (green)
- URL: `https://binmukhtarretail.com/api/stripe/webhook`
- Events: `checkout.session.completed` should be selected

**✅ Recent Events:**
- Click **"Recent events"** tab
- After a purchase, you should see `checkout.session.completed` events
- Click on an event → Check **"Response"** tab
- Look for status code: **200** = Success, **500** = Error

**✅ Signing Secret:**
- Click **"Reveal"** next to "Signing secret"
- Copy this value
- Make sure it's set in Render as `STRIPE_WEBHOOK_SECRET`

---

## **3. Verify Environment Variables in Render**

### **Go to Render Dashboard:**
1. **Your Web Service** → **Environment** tab
2. **Verify these are set:**

**Required:**
- ✅ `RESEND_API_KEY` = `re_...` (starts with `re_`)
- ✅ `STRIPE_WEBHOOK_SECRET` = `whsec_...` (starts with `whsec_`)
- ✅ `FROM_EMAIL` = `Bin Mukhtar Retail <orders@binmukhtarretail.com>` (or verified domain)
- ✅ `REPLY_TO_EMAIL` = `info@binmukhtarretail.com`

**If any are missing:**
- Add them
- Save changes
- Wait for redeploy (1-2 minutes)

---

## **4. Test Email Directly**

### **Test the Email Endpoint:**

Open your browser console on your production site and run:

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
  "emailId": "..."
}
```

**If Error:**
- Check the error message
- Check Render logs for details
- Verify `RESEND_API_KEY` is set correctly

---

## **5. Check Resend Dashboard**

### **Go to Resend Dashboard:**
1. **https://resend.com** → Log in
2. **Logs** tab
3. **Check if emails are being sent:**
   - Look for recent emails
   - Check delivery status
   - See if any bounced/failed

**If no emails in Resend:**
- Webhook might not be calling email function
- Check Render logs for errors

**If emails in Resend but not delivered:**
- Check spam folder
- Verify `FROM_EMAIL` domain is verified
- Check Resend logs for bounce reasons

---

## **6. Common Issues & Fixes**

### **Issue 1: "STRIPE_WEBHOOK_SECRET is not configured"**

**Fix:**
1. Go to **Stripe Dashboard** → **Webhooks** → Your webhook
2. Click **"Reveal"** next to "Signing secret"
3. Copy the value (starts with `whsec_`)
4. Add to Render: `STRIPE_WEBHOOK_SECRET=whsec_...`
5. Save and wait for redeploy

---

### **Issue 2: "Webhook signature verification failed"**

**Fix:**
- Make sure `STRIPE_WEBHOOK_SECRET` matches the signing secret from Stripe
- Check for typos or extra spaces
- Make sure you're using the correct webhook's secret

---

### **Issue 3: "RESEND_API_KEY not set"**

**Fix:**
1. Go to **Resend Dashboard** → **API Keys**
2. Copy your API key (starts with `re_`)
3. Add to Render: `RESEND_API_KEY=re_...`
4. Save and wait for redeploy

---

### **Issue 4: "No customer email found in session"**

**Fix:**
- Make sure customer enters email at Stripe checkout
- Check Stripe webhook event data
- Verify `customer_email` is present in session

---

### **Issue 5: Webhook Not Being Called**

**Symptoms:**
- No events in Stripe webhook logs
- No logs in Render after purchase

**Fix:**
1. **Verify webhook URL is correct:**
   - Should be: `https://binmukhtarretail.com/api/stripe/webhook`
   - No trailing slash
   - HTTPS (not HTTP)

2. **Check webhook is enabled:**
   - Stripe Dashboard → Webhooks → Your webhook
   - Status should be **"Enabled"**

3. **Verify events are selected:**
   - `checkout.session.completed` must be checked

4. **Test webhook manually:**
   - Stripe Dashboard → Webhooks → Your webhook
   - Click **"Send test webhook"**
   - Select `checkout.session.completed`
   - Check Render logs for response

---

## **7. Step-by-Step Debugging**

### **After Making a Purchase:**

1. **Check Stripe Webhook Logs:**
   - Stripe Dashboard → Webhooks → Your webhook → Recent events
   - Find the latest `checkout.session.completed` event
   - Check **"Response"** tab
   - Status should be **200**

2. **Check Render Logs:**
   - Render Dashboard → Your Web Service → Logs
   - Look for webhook-related messages
   - Copy any error messages

3. **Check Resend Logs:**
   - Resend Dashboard → Logs
   - See if email was sent
   - Check delivery status

4. **Check Your Email:**
   - Inbox
   - Spam folder
   - Check email address is correct

---

## **8. Quick Test Checklist**

Run through this checklist:

- [ ] `RESEND_API_KEY` is set in Render
- [ ] `STRIPE_WEBHOOK_SECRET` is set in Render
- [ ] `FROM_EMAIL` is set in Render
- [ ] Webhook URL is correct: `https://binmukhtarretail.com/api/stripe/webhook`
- [ ] Webhook is enabled in Stripe
- [ ] `checkout.session.completed` event is selected
- [ ] Test email endpoint works: `/api/test-email`
- [ ] Render logs show webhook being received
- [ ] Render logs show email being sent
- [ ] Resend logs show email was sent

---

## **9. Still Not Working?**

### **Get More Info:**

1. **Check Render Logs:**
   - Copy all logs after a purchase
   - Look for any error messages

2. **Check Stripe Webhook Response:**
   - Stripe Dashboard → Webhooks → Recent events
   - Click on latest event
   - Copy the response body

3. **Test Email Directly:**
   - Use `/api/test-email` endpoint
   - See if it works independently

4. **Check Resend Dashboard:**
   - See if emails are being sent
   - Check for any errors or bounces

---

## **10. Most Likely Issues:**

Based on common problems:

1. **Missing `STRIPE_WEBHOOK_SECRET`** (90% of cases)
   - Webhook can't verify signature
   - Returns 500 error
   - Email never gets sent

2. **Webhook not configured correctly** (5% of cases)
   - Wrong URL
   - Wrong events selected
   - Webhook disabled

3. **RESEND_API_KEY not set** (3% of cases)
   - Email function fails
   - Check logs for "RESEND_API_KEY not set"

4. **Email going to spam** (2% of cases)
   - Email sent successfully
   - But customer doesn't see it
   - Check spam folder

---

## **Quick Fix:**

**Most common issue:** Missing `STRIPE_WEBHOOK_SECRET`

**Fix:**
1. Stripe Dashboard → Webhooks → Your webhook → Reveal signing secret
2. Copy `whsec_...` value
3. Render Dashboard → Environment → Add `STRIPE_WEBHOOK_SECRET=whsec_...`
4. Save and wait for redeploy
5. Test purchase again

**That should fix it!** 🎉

