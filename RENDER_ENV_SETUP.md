# Render Environment Variables Setup

## ✅ **Required Environment Variables for Render**

You need to add these environment variables in your Render dashboard for emails to work.

---

## 📧 **Email Setup (Required for Order Confirmations)**

### **Step 1: Get Your Resend API Key**

1. Go to: **https://resend.com/**
2. Sign in to your account
3. Go to: **API Keys** → **Create API Key**
4. Copy the key (starts with `re_`)

### **Step 2: Add to Render**

1. **Go to Render Dashboard**
2. **Click on your Web Service**
3. **Go to "Environment" tab**
4. **Click "Add Environment Variable"**
5. **Add these variables:**

```bash
# Required for emails
RESEND_API_KEY=re_YOUR_API_KEY_HERE

# Optional - Email settings (defaults provided if not set)
FROM_EMAIL=Bin Mukhtar Retail <orders@binmukhtarretail.com>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

6. **Click "Save Changes"**
7. **Render will automatically redeploy** (or manually trigger a deploy)

---

## 💳 **Stripe Setup (Required for Payments)**

```bash
# Stripe Keys (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

---

## 🗺️ **Google Maps Setup (Required for Address Autocomplete)**

```bash
# Google Maps API Keys
GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_GOOGLE_MAPS_API_KEY

# Store Location
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989

# Delivery Radius
DELIVERY_RADIUS_MILES=15
```

---

## 🔥 **Firebase Setup (Required for Database)**

```bash
# Firebase Admin SDK (get from Firebase Console)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Firebase Client Config (for frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 📋 **Complete Environment Variables Checklist**

### **Required:**
- [ ] `RESEND_API_KEY` - For sending order confirmation emails
- [ ] `STRIPE_SECRET_KEY` - For processing payments
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For Stripe checkout
- [ ] `STRIPE_WEBHOOK_SECRET` - For webhook verification
- [ ] `GOOGLE_MAPS_API_KEY` - For geocoding addresses
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - For address autocomplete
- [ ] Firebase variables (all listed above)

### **Optional but Recommended:**
- [ ] `FROM_EMAIL` - Custom from address (defaults provided)
- [ ] `REPLY_TO_EMAIL` - Reply-to address (defaults provided)
- [ ] `STORE_LAT` - Store latitude (defaults provided)
- [ ] `STORE_LNG` - Store longitude (defaults provided)
- [ ] `DELIVERY_RADIUS_MILES` - Delivery radius (defaults to 15)

---

## 🚀 **After Adding Variables**

1. **Save all environment variables**
2. **Render will automatically redeploy** (or click "Manual Deploy")
3. **Wait for deployment to complete**
4. **Test by making a purchase** - you should receive an email!

---

## 🧪 **Testing Emails**

### **Test Order Confirmation:**

1. **Make a test purchase** (use Stripe test card: `4242 4242 4242 4242`)
2. **Complete checkout**
3. **Check your email** (the email you entered at checkout)
4. **You should receive:**
   - ✅ Stripe payment receipt (from Stripe)
   - ✅ Order confirmation email (from your site via Resend)

### **Check Render Logs:**

In Render dashboard → **Logs**, you should see:
```
✅ Order created in Firebase: abc123...
✅ Order confirmation email sent to: customer@email.com
```

If there's an error:
```
❌ RESEND_API_KEY not set in environment variables
❌ Failed to send order confirmation email
```

---

## 🔍 **Verifying Variables Are Set**

### **In Render Dashboard:**

1. Go to your **Web Service**
2. Click **"Environment"** tab
3. You should see all variables listed
4. Values are hidden (showing as `•••••`) for security

### **Check Logs:**

After deployment, check logs for:
- ✅ `✅ Order confirmation email sent` = Working!
- ❌ `⚠️ RESEND_API_KEY not set` = Missing variable
- ❌ `❌ RESEND_API_KEY not configured` = Variable not set correctly

---

## ⚠️ **Important Notes**

### **Environment Variable Names:**

- ✅ **Server-side variables** (no `NEXT_PUBLIC_` prefix):
  - `RESEND_API_KEY`
  - `STRIPE_SECRET_KEY`
  - `GOOGLE_MAPS_API_KEY`
  - Firebase private keys

- ✅ **Client-side variables** (must have `NEXT_PUBLIC_` prefix):
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
  - `NEXT_PUBLIC_FIREBASE_*` variables

### **Security:**

- ✅ **Never commit** `.env.local` to Git
- ✅ **Never expose** server-side API keys to client
- ✅ **Use different keys** for development and production
- ✅ **Rotate keys** if compromised

---

## 🐛 **Troubleshooting**

### **Issue: Emails Not Sending**

**Check:**
1. ✅ `RESEND_API_KEY` is set in Render environment variables
2. ✅ Value starts with `re_`
3. ✅ No extra spaces or quotes around the value
4. ✅ Service has been redeployed after adding variable
5. ✅ Check Render logs for error messages

### **Issue: "RESEND_API_KEY not configured"**

**Fix:**
1. Go to Render → Environment tab
2. Add `RESEND_API_KEY=re_YOUR_KEY`
3. Save and redeploy

### **Issue: "Invalid API key"**

**Fix:**
1. Verify key copied correctly (no extra spaces)
2. Check key is active in Resend dashboard
3. Regenerate key if needed
4. Update in Render and redeploy

---

## 📞 **Need Help?**

- **Resend Support:** support@resend.com
- **Render Support:** https://render.com/docs/support
- **Check Logs:** Render dashboard → Logs tab

---

## ✅ **Summary**

**To enable emails:**
1. ✅ Get Resend API key from https://resend.com
2. ✅ Add `RESEND_API_KEY` to Render environment variables
3. ✅ Save and wait for redeploy
4. ✅ Test with a purchase

**That's it!** Once `RESEND_API_KEY` is set in Render, emails will automatically send after every successful purchase. 🎉

