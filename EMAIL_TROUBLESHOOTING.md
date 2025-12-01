# Email Troubleshooting Guide

## 🐛 **Not Receiving Emails After Purchase?**

Follow these steps to diagnose and fix the issue.

---

## 🔍 **Step 1: Check Server Logs**

After making a purchase, check your **server console** (where you ran `npm run dev`).

### **Look for these messages:**

**✅ Good Signs:**
```
✅ Received Stripe webhook event: checkout.session.completed
🎉 Processing checkout.session.completed
📧 Session customer email: customer@example.com
✅ Order created in Firebase: abc123...
📧 Attempting to send order confirmation email...
✅ Order confirmation email sent successfully to: customer@example.com
```

**❌ Bad Signs:**
```
❌ RESEND_API_KEY not set in environment variables
❌ Failed to send order confirmation email
⚠️ No customer email - skipping order confirmation email
```

---

## 🔧 **Step 2: Verify RESEND_API_KEY**

### **Check if it's set:**

1. **Open `.env.local`** in your project root
2. **Look for:**
   ```bash
   RESEND_API_KEY=re_...
   ```

**If missing:**
- Add it: `RESEND_API_KEY=re_YOUR_KEY_HERE`
- **Restart dev server** (Ctrl+C, then `npm run dev`)

**If present:**
- Make sure it starts with `re_`
- No spaces or quotes around the value
- Copy it exactly from Resend dashboard

---

## 🧪 **Step 3: Test Email Sending**

### **Use the Test Endpoint:**

1. **Open browser console** (F12)
2. **Run this:**
   ```javascript
   fetch('/api/test-email', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email: 'your@email.com' })
   })
   .then(r => r.json())
   .then(console.log)
   ```

**Or use curl:**
```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com"}'
```

### **Expected Response:**

**✅ Success:**
```json
{
  "success": true,
  "message": "Test email sent successfully!",
  "emailId": "abc123...",
  "checkYourEmail": "your@email.com"
}
```

**❌ Error:**
```json
{
  "success": false,
  "error": "RESEND_API_KEY not configured"
}
```

---

## 🔍 **Step 4: Check Webhook Configuration**

### **Is the webhook being called?**

**Check server logs for:**
```
✅ Received Stripe webhook event: checkout.session.completed
```

**If you DON'T see this:**
- Webhook might not be configured in Stripe Dashboard
- Webhook URL might be wrong
- Webhook secret might be incorrect

### **For Local Development:**

Stripe webhooks **won't work locally** unless you use:
- **Stripe CLI** to forward webhooks to localhost
- **ngrok** or similar tunnel

**To test locally with Stripe CLI:**

1. **Install Stripe CLI:** https://stripe.com/docs/stripe-cli
2. **Login:**
   ```bash
   stripe login
   ```
3. **Forward webhooks:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. **Copy the webhook signing secret** it gives you
5. **Add to `.env.local`:**
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

---

## 🎯 **Common Issues & Fixes:**

### **Issue 1: "RESEND_API_KEY not configured"**

**Symptoms:**
- Server logs show: `❌ RESEND_API_KEY not set`
- Test email fails

**Fix:**
1. Add `RESEND_API_KEY=re_...` to `.env.local`
2. Restart dev server
3. Test again

---

### **Issue 2: "No customer email"**

**Symptoms:**
- Server logs show: `⚠️ No customer email`
- Email not sent

**Possible Causes:**
- Customer didn't enter email at checkout
- Stripe session doesn't have customer email

**Fix:**
- Make sure customer enters email in checkout form
- Check Stripe Dashboard → Checkout Sessions → Customer Email

---

### **Issue 3: Webhook Not Being Called**

**Symptoms:**
- No webhook logs in server console
- Order created but no email

**Fix:**

**For Production:**
1. Go to **Stripe Dashboard** → **Developers** → **Webhooks**
2. Check if webhook endpoint is configured
3. URL should be: `https://yourdomain.com/api/stripe/webhook`
4. Events: `checkout.session.completed`
5. Check webhook logs in Stripe Dashboard

**For Local Development:**
- Use Stripe CLI (see Step 4 above)
- Or test on production/staging environment

---

### **Issue 4: Email Goes to Spam**

**Symptoms:**
- Email sent successfully (logs show ✅)
- But customer doesn't see it

**Fix:**
1. **Check spam folder**
2. **Verify domain in Resend:**
   - Go to Resend Dashboard → Domains
   - Add your domain
   - Add DNS records (SPF, DKIM)
   - Wait for verification
3. **Use verified domain** in `FROM_EMAIL`

---

### **Issue 5: "Invalid API Key"**

**Symptoms:**
- Error: `Invalid API key`
- Test email fails

**Fix:**
1. Check API key copied correctly
2. Make sure it starts with `re_`
3. Verify key is active in Resend Dashboard
4. Regenerate if needed

---

## 📋 **Checklist:**

### **Before Testing:**

- [ ] `RESEND_API_KEY` added to `.env.local`
- [ ] Dev server restarted after adding key
- [ ] Resend account created and verified
- [ ] API key copied correctly (starts with `re_`)

### **During Purchase:**

- [ ] Customer enters email at checkout
- [ ] Payment completes successfully
- [ ] Check server logs for webhook event
- [ ] Check server logs for email send attempt

### **After Purchase:**

- [ ] Check customer's inbox
- [ ] Check spam folder
- [ ] Check server logs for email status
- [ ] Test with `/api/test-email` endpoint

---

## 🔍 **Debugging Commands:**

### **Check Environment Variables:**

```bash
# Windows PowerShell
Get-Content .env.local | Select-String "RESEND"

# Mac/Linux
cat .env.local | grep RESEND
```

### **Check Server Logs:**

Look for these patterns:
- `📧` - Email-related logs
- `✅` - Success messages
- `❌` - Error messages
- `⚠️` - Warnings

---

## 🧪 **Quick Test:**

### **1. Test Email Function:**

```bash
# In browser console or Postman
POST http://localhost:3000/api/test-email
Content-Type: application/json

{
  "email": "your@email.com"
}
```

### **2. Check Response:**

**If success:**
- Check your email inbox
- Email should arrive within seconds

**If error:**
- Check error message
- Fix the issue
- Try again

---

## 📞 **Still Not Working?**

### **Check These:**

1. **Server Logs:**
   - Copy all logs related to email
   - Look for error messages

2. **Resend Dashboard:**
   - Go to Resend Dashboard → Logs
   - Check if emails are being sent
   - See delivery status

3. **Stripe Dashboard:**
   - Go to Stripe Dashboard → Webhooks
   - Check webhook delivery logs
   - See if webhook is being called

4. **Environment Variables:**
   - Verify `.env.local` has correct values
   - Make sure server was restarted

---

## ✅ **Expected Flow:**

```
1. Customer completes checkout
   ↓
2. Stripe processes payment
   ↓
3. Stripe sends webhook → POST /api/stripe/webhook
   ↓
4. Server logs: "✅ Received Stripe webhook event"
   ↓
5. Server creates order in Firebase
   ↓
6. Server logs: "📧 Attempting to send email"
   ↓
7. Server calls Resend API
   ↓
8. Server logs: "✅ Email sent successfully"
   ↓
9. Customer receives email
```

**If any step fails, check the logs to see where it stopped!**

---

## 🎯 **Quick Fixes:**

### **Most Common Issue:**

**Problem:** `RESEND_API_KEY` not set

**Fix:**
1. Add to `.env.local`: `RESEND_API_KEY=re_YOUR_KEY`
2. Restart server
3. Test again

**That fixes 90% of issues!** 🎉

---

## 📝 **Summary:**

1. ✅ **Check server logs** - See what's happening
2. ✅ **Verify RESEND_API_KEY** - Must be in `.env.local`
3. ✅ **Test with `/api/test-email`** - Verify email works
4. ✅ **Check webhook** - Make sure it's being called
5. ✅ **Check spam folder** - Emails might be there

**Share your server logs if still having issues!** 🔍

