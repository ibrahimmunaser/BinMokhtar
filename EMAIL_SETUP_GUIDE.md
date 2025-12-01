# Email Setup Guide - Order Confirmations

## ✅ **Email System Implemented!**

Order confirmation emails are now automatically sent when customers complete checkout. No Google Apps Script needed!

---

## 📧 **What Emails Are Sent:**

### **1. Stripe Payment Receipt (Automatic)**
- ✅ **Sent automatically by Stripe**
- ✅ **No setup needed**
- ✅ Contains payment details and receipt

### **2. Order Confirmation Email (Custom)**
- ✅ **Sent automatically after successful payment**
- ✅ **Beautiful HTML email** with order details
- ✅ **Different content for delivery vs pickup**
- ✅ **Includes pickup instructions** for pickup orders

---

## 🚀 **Setup Required (5 Minutes):**

### **Step 1: Sign Up for Resend**

1. Go to: **https://resend.com/**
2. Sign up for a free account
3. Verify your email

### **Step 2: Get Your API Key**

1. Go to: **Resend Dashboard** → **API Keys**
2. Click **"Create API Key"**
3. Name it: `Production` or `BMR Orders`
4. Copy the API key (starts with `re_`)

### **Step 3: Verify Your Domain (Optional but Recommended)**

**For Production:**
1. Go to: **Resend Dashboard** → **Domains**
2. Click **"Add Domain"**
3. Enter: `binmukhtarretail.com` (or your domain)
4. Add DNS records to your domain:
   - SPF record
   - DKIM records
   - DMARC record (optional)
5. Wait for verification (usually 5-10 minutes)

**For Development/Testing:**
- You can use Resend's test domain: `onboarding@resend.dev`
- Or use your verified domain

### **Step 4: Add to Environment Variables**

Add to your `.env.local`:

```bash
# Resend Email Service
RESEND_API_KEY=re_YOUR_API_KEY_HERE

# Email Settings (Optional - defaults provided)
FROM_EMAIL=Bin Mukhtar Retail <orders@binmukhtarretail.com>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

**For Development:**
```bash
RESEND_API_KEY=re_YOUR_API_KEY_HERE
FROM_EMAIL=Bin Mukhtar Retail <onboarding@resend.dev>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

### **Step 5: Restart Dev Server**

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## 📋 **What Gets Sent:**

### **Order Confirmation Email Includes:**

✅ **Order Number** (last 8 characters of order ID)  
✅ **Order Items** with images, quantities, prices  
✅ **Order Summary** (subtotal, shipping, tax, total)  
✅ **Shipping Address** (for delivery orders)  
✅ **Pickup Instructions** (for pickup orders)  
✅ **Instagram DM Link** (for pickup orders)  
✅ **What's Next** section  
✅ **Contact Information**  

### **Email Content:**

**For Delivery Orders:**
- Shipping address
- "You'll receive tracking info once shipped"

**For Pickup Orders:**
- "We are located in Detroit Metro Area"
- Instagram DM button
- Instructions to arrange pickup

---

## 🧪 **Testing:**

### **Test Order Confirmation:**

1. **Make a test purchase** (use Stripe test card: `4242 4242 4242 4242`)
2. **Complete checkout**
3. **Check your email** (the email you entered at checkout)
4. **You should receive:**
   - Stripe payment receipt (from Stripe)
   - Order confirmation email (from your site)

### **Check Logs:**

In your server logs, you should see:
```
✅ Order created in Firebase: abc123...
✅ Order confirmation email sent
```

If there's an error:
```
❌ Failed to send order confirmation email: [error message]
```

---

## 🔧 **How It Works:**

### **Flow:**

1. **Customer completes checkout** → Stripe processes payment
2. **Stripe sends webhook** → `POST /api/stripe/webhook`
3. **Webhook handler:**
   - Creates order in Firebase
   - Calls `sendOrderConfirmationEmail()`
   - Email sent via Resend
4. **Customer receives email** → Beautiful HTML email

### **Files Involved:**

- ✅ `lib/email.ts` - Email sending logic
- ✅ `app/api/stripe/webhook/route.ts` - Webhook handler (calls email function)
- ✅ Resend service - Handles actual email delivery

---

## 💰 **Pricing:**

### **Resend Free Tier:**
- ✅ **3,000 emails/month** free
- ✅ **100 emails/day** free
- ✅ Perfect for small/medium stores

### **Resend Paid Plans:**
- $20/month: 50,000 emails
- $80/month: 200,000 emails
- Pay-as-you-go: $0.30 per 1,000 emails

**For most stores, free tier is plenty!**

---

## 🔒 **Security:**

### **API Key Security:**
- ✅ API key stored in environment variables
- ✅ Never exposed to client
- ✅ Server-side only

### **Email Security:**
- ✅ SPF records prevent spoofing
- ✅ DKIM signing for authentication
- ✅ DMARC for policy enforcement

---

## 📧 **Email Customization:**

### **Change Email Content:**

Edit `lib/email.ts`:
- Change HTML template
- Modify email subject
- Add/remove sections
- Change styling

### **Change From Address:**

Update `.env.local`:
```bash
FROM_EMAIL=Your Name <orders@yourdomain.com>
```

**Note:** Must be verified domain or use `onboarding@resend.dev` for testing

---

## 🐛 **Troubleshooting:**

### **Issue: Emails Not Sending**

**Check:**
1. ✅ `RESEND_API_KEY` set in `.env.local`
2. ✅ Restarted dev server after adding key
3. ✅ Check server logs for errors
4. ✅ Verify API key is valid in Resend dashboard

### **Issue: "Email service not configured"**

**Fix:**
- Add `RESEND_API_KEY` to `.env.local`
- Restart dev server

### **Issue: Emails Going to Spam**

**Fix:**
1. Verify your domain in Resend
2. Add SPF/DKIM records
3. Use verified domain in `FROM_EMAIL`
4. Ask customers to check spam folder initially

### **Issue: "Invalid API key"**

**Fix:**
1. Check API key copied correctly
2. Make sure it starts with `re_`
3. Verify key is active in Resend dashboard
4. Regenerate if needed

---

## ✅ **Summary:**

### **What You Need to Do:**

1. ✅ **Sign up for Resend** (free)
2. ✅ **Get API key** from Resend dashboard
3. ✅ **Add to `.env.local`**: `RESEND_API_KEY=re_...`
4. ✅ **Restart dev server**
5. ✅ **Test with a purchase**

### **What Happens Automatically:**

- ✅ **Stripe sends payment receipt** (no setup needed)
- ✅ **Your site sends order confirmation** (after Resend setup)
- ✅ **Different emails for delivery vs pickup**
- ✅ **Beautiful HTML emails** with order details

### **No Google Apps Script Needed!**

Everything is handled server-side with Resend. Much simpler! 🎉

---

## 📞 **Support:**

- **Resend Docs:** https://resend.com/docs
- **Resend Support:** support@resend.com
- **Check Logs:** Server console shows email send status

---

## 🎉 **You're All Set!**

Once you add the `RESEND_API_KEY`, emails will automatically send after every successful purchase. No manual work needed! 🚀

