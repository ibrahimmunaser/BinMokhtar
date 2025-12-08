# 📧 Email Troubleshooting Guide

## ✅ **Email System Status**

Your email system is **configured correctly**! The test endpoint confirms emails can be sent.

**Test Result:** ✅ Email sending works (tested successfully)

---

## 🔍 **Why Emails Aren't Sent After Purchase**

The most common reason is that **Stripe webhooks aren't reaching your server**. Here's how to fix it:

---

## 🛠️ **Solution 1: Local Development (Testing on Your Computer)**

### **Problem:**
When testing locally (`localhost:3000`), Stripe can't send webhooks to your local server because it's not publicly accessible.

### **Fix: Use Stripe CLI to Forward Webhooks**

1. **Install Stripe CLI:**
   ```bash
   # Windows (using Scoop)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```
   (This will open your browser to authorize)

3. **Forward Webhooks to Your Local Server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the Webhook Secret:**
   The CLI will output something like:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Add to `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Restart Your Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

7. **Test a Purchase:**
   - Make a test purchase
   - Watch the Stripe CLI terminal - you should see webhook events
   - Check your email!

---

## 🌐 **Solution 2: Production (Live Website)**

### **Problem:**
Webhook URL not configured in Stripe Dashboard, or webhook secret doesn't match.

### **Fix: Configure Webhook in Stripe Dashboard**

1. **Go to Stripe Dashboard:**
   ```
   https://dashboard.stripe.com/webhooks
   ```

2. **Click "Add endpoint"** (or edit existing)

3. **Enter Your Webhook URL:**
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
   (Replace `yourdomain.com` with your actual domain)

4. **Select Events to Listen For:**
   - ✅ `checkout.session.completed` (REQUIRED for emails)
   - ✅ `payment_intent.succeeded` (optional)
   - ✅ `payment_intent.payment_failed` (optional)

5. **Copy the Signing Secret:**
   - After creating the webhook, click on it
   - Find "Signing secret" section
   - Click "Reveal" and copy it (starts with `whsec_`)

6. **Add to Production Environment Variables:**
   - If using Render: Go to Render Dashboard → Your Service → Environment tab
   - Add: `STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx`
   - Save and wait for redeploy

7. **Test:**
   - Make a test purchase on your live site
   - Check your email!

---

## 🔍 **Solution 3: Check Webhook Status**

### **Check if Webhooks Are Being Received:**

1. **Check Server Logs:**
   - Look for: `📥 Webhook received at:`
   - If you don't see this, webhooks aren't reaching your server

2. **Check Stripe Dashboard:**
   - Go to: https://dashboard.stripe.com/webhooks
   - Click on your webhook endpoint
   - Check "Recent events" - you should see `checkout.session.completed` events

3. **Check Email Logs:**
   - Look for: `📧 ===== EMAIL SENDING STARTED =====`
   - Or: `❌ ===== EMAIL SEND FAILED =====`

---

## 🐛 **Common Issues & Fixes**

### **Issue 1: "Webhook signature verification failed"**

**Error in logs:**
```
❌ WEBHOOK SIGNATURE VERIFICATION FAILED
```

**Fix:**
- Make sure `STRIPE_WEBHOOK_SECRET` in your environment matches the signing secret in Stripe Dashboard
- They must match EXACTLY (including `whsec_` prefix)

---

### **Issue 2: "No customer email"**

**Error in logs:**
```
❌ NO CUSTOMER EMAIL - CANNOT SEND EMAIL
```

**Fix:**
- Make sure customers enter their email during Stripe checkout
- Check Stripe checkout session settings - email collection should be enabled

---

### **Issue 3: "RESEND_API_KEY not configured"**

**Error in logs:**
```
❌ RESEND_API_KEY NOT CONFIGURED
```

**Fix:**
- For local: Add `RESEND_API_KEY=re_...` to `.env.local`
- For production: Add to Render environment variables
- Restart server after adding

---

### **Issue 4: Emails Sent But Not Received**

**Possible Causes:**
1. **Check Spam Folder** - Emails might be filtered
2. **Domain Not Verified** - Verify your domain in Resend Dashboard
3. **Wrong Email Address** - Check the email address used at checkout

**Fix:**
- Verify domain in Resend Dashboard → Domains
- Add SPF/DKIM records to your domain
- Use verified domain in `FROM_EMAIL` environment variable

---

## 🧪 **Testing Email Sending**

### **Test Email Endpoint:**

You can test email sending directly without making a purchase:

```bash
# Using PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/api/test-email" -Method POST -Headers @{"Content-Type"="application/json"} -Body '{"email":"your@email.com"}' | Select-Object -ExpandProperty Content
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "emailId": "738279e9-80ee-4297-b160-ab3af8ad5d90",
  "checkYourEmail": "your@email.com"
}
```

If this works, your email configuration is correct!

---

## 📋 **Quick Checklist**

### **For Local Development:**
- [ ] Stripe CLI installed and running (`stripe listen --forward-to localhost:3000/api/stripe/webhook`)
- [ ] `STRIPE_WEBHOOK_SECRET` added to `.env.local`
- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] Dev server restarted after adding environment variables
- [ ] Test purchase made with test card `4242 4242 4242 4242`

### **For Production:**
- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Webhook URL points to: `https://yourdomain.com/api/stripe/webhook`
- [ ] `checkout.session.completed` event selected
- [ ] `STRIPE_WEBHOOK_SECRET` added to Render environment variables
- [ ] `RESEND_API_KEY` added to Render environment variables
- [ ] Domain verified in Resend Dashboard (optional but recommended)

---

## 🔗 **Useful Links**

- **Stripe Webhooks Dashboard:** https://dashboard.stripe.com/webhooks
- **Stripe CLI Docs:** https://stripe.com/docs/stripe-cli
- **Resend Dashboard:** https://resend.com/emails
- **Resend Domain Verification:** https://resend.com/domains

---

## 💡 **Summary**

**Most Likely Issue:** Webhooks aren't reaching your server

**Quick Fix for Local:**
1. Run `stripe listen --forward-to localhost:3000/api/stripe/webhook`
2. Copy webhook secret to `.env.local`
3. Restart dev server
4. Test purchase

**Quick Fix for Production:**
1. Create webhook endpoint in Stripe Dashboard
2. Copy signing secret to Render environment variables
3. Wait for redeploy
4. Test purchase

---

## ✅ **Your Current Status**

- ✅ Email service configured (`RESEND_API_KEY` is set)
- ✅ Email sending works (test endpoint confirmed)
- ⚠️ **Need to configure webhook forwarding (local) or webhook endpoint (production)**

Once webhooks are configured, emails will automatically send after every purchase! 🎉




