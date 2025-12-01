# 📧 Email Configuration Guide

## **Do You Need .env.local?**

### **For Local Development (Testing on Your Computer):**
✅ **YES** - Add to `.env.local`:
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=Bin Mukhtar Retail <orders@binmukhtarretail.com>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

### **For Production (Render):**
✅ **NO** - `.env.local` is NOT used in production
✅ **YES** - Add to **Render Environment Variables**:
- Go to Render Dashboard → Your Web Service → Environment tab
- Add these variables:
  - `RESEND_API_KEY` = `re_...` (from Resend Dashboard)
  - `FROM_EMAIL` = `Bin Mukhtar Retail <orders@binmukhtarretail.com>` (optional)
  - `REPLY_TO_EMAIL` = `info@binmukhtarretail.com` (optional)

---

## **Do You Need Google Apps Script?**

❌ **NO** - You don't need Google Apps Script!

The email system uses **Resend** (a modern email service), not Gmail or Google Apps Script.

---

## **How Email Sending Works**

1. **Customer completes purchase** → Stripe processes payment
2. **Stripe sends webhook** → `checkout.session.completed` event
3. **Your server receives webhook** → `/api/stripe/webhook` route
4. **Server calls Resend API** → Sends email via Resend
5. **Email delivered** → Customer receives confirmation

---

## **Required Setup**

### **1. Resend Account**
- Sign up at [resend.com](https://resend.com)
- Get your API key from [Resend Dashboard → API Keys](https://resend.com/api-keys)
- API key starts with `re_`

### **2. Domain Verification (Optional but Recommended)**
- In Resend Dashboard → Domains
- Add `binmukhtarretail.com`
- Add DNS records to verify domain
- This prevents emails from going to spam

### **3. Environment Variables**

#### **Local Development (.env.local):**
```env
RESEND_API_KEY=re_your_api_key_here
FROM_EMAIL=Bin Mukhtar Retail <orders@binmukhtarretail.com>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

#### **Production (Render):**
Add the same variables in Render Dashboard → Environment tab

---

## **Testing Email Sending**

### **Option 1: Test Endpoint (Recommended)**

**Test email configuration:**
```bash
GET https://binmukhtarretail.com/api/test-email-direct
```

**Send test email:**
```bash
POST https://binmukhtarretail.com/api/test-email-direct
Content-Type: application/json

{
  "email": "your@email.com"
}
```

### **Option 2: Check Render Logs**

After making a purchase, check Render logs for:
- `📧 ===== sendOrderConfirmationEmail STARTED =====`
- `✅ ===== EMAIL SENT SUCCESSFULLY =====`
- OR `❌ ===== EMAIL SEND FAILED =====`

---

## **Common Issues**

### **1. "RESEND_API_KEY not configured"**
- **Fix:** Add `RESEND_API_KEY` to Render environment variables
- **Get key from:** [Resend Dashboard → API Keys](https://resend.com/api-keys)

### **2. "Email service not configured"**
- **Fix:** Check that `RESEND_API_KEY` starts with `re_`
- **Fix:** Verify API key is correct (no extra spaces)

### **3. Emails go to spam**
- **Fix:** Verify domain in Resend Dashboard
- **Fix:** Add SPF/DKIM DNS records
- **Fix:** Use verified domain in `FROM_EMAIL`

### **4. "Domain not verified" error**
- **Fix:** Verify `binmukhtarretail.com` in Resend Dashboard
- **Fix:** Or use Resend's test domain: `onboarding@resend.dev`

---

## **Quick Checklist**

- [ ] Resend account created
- [ ] API key obtained (starts with `re_`)
- [ ] `RESEND_API_KEY` added to Render environment variables
- [ ] Domain verified in Resend (optional but recommended)
- [ ] Test email sent successfully
- [ ] Webhook configured correctly in Stripe
- [ ] `STRIPE_WEBHOOK_SECRET` added to Render

---

## **No Google Apps Script Needed!**

This is a **server-side email system** using **Resend API**. No Google Apps Script, no Gmail, no manual scripts needed. Everything is automated through webhooks.

