# Complete Render Environment Variables Checklist

## ✅ **ALL Environment Variables Required for Render**

Copy and paste these into Render Dashboard → Your Web Service → Environment tab.

---

## 🔥 **Firebase (Required)**

```bash
# Firebase Admin SDK (Server-side)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Firebase Client Config (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**Where to get:** Firebase Console → Project Settings → Service Accounts / General

---

## 💳 **Stripe (Required for Payments)**

```bash
# Stripe Keys
STRIPE_SECRET_KEY=sk_live_YOUR_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

**Where to get:** Stripe Dashboard → Developers → API Keys / Webhooks

---

## 🗺️ **Google Maps (Required for Address Autocomplete & Delivery)**

```bash
# Google Maps API Keys (use the SAME key for both)
GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDNLoKOg05Z2VBJ4cmubuWd-oQffDK3pxM

# Store Location
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989

# Delivery Radius
DELIVERY_RADIUS_MILES=15
```

**Where to get:** Google Cloud Console → APIs & Services → Credentials

---

## 📧 **Resend (Required for Order Confirmation Emails)**

```bash
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
FROM_EMAIL=Bin Mukhtar Retail <orders@binmukhtarretail.com>
REPLY_TO_EMAIL=info@binmukhtarretail.com
```

**Where to get:** Resend Dashboard → API Keys

**Note:** For testing, you can use:
```bash
FROM_EMAIL=Bin Mukhtar Retail <onboarding@resend.dev>
```

---

## 🚀 **Node.js (Optional - Render sets automatically)**

```bash
NODE_ENV=production
NODE_VERSION=20
```

**Note:** Render usually sets these automatically, but you can set them explicitly.

---

## 📋 **Quick Copy-Paste Checklist**

### **Step 1: Go to Render Dashboard**
1. Open: https://dashboard.render.com
2. Click your **Web Service**
3. Click **"Environment"** tab

### **Step 2: Add Each Variable**
Click **"Add Environment Variable"** for each one below:

#### **Firebase (7 variables):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### **Stripe (3 variables):**
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

#### **Google Maps (5 variables):**
- `GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `STORE_LAT`
- `STORE_LNG`
- `DELIVERY_RADIUS_MILES`

#### **Resend (3 variables):**
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `REPLY_TO_EMAIL`

### **Step 3: Save and Wait**
- Click **"Save Changes"**
- Render will automatically redeploy
- Wait 1-2 minutes for deployment

---

## 🔍 **How to Verify All Variables Are Set**

### **In Render Dashboard:**
1. Go to **Environment** tab
2. Scroll through the list
3. You should see all variables listed (values hidden as `•••••`)

### **Check Render Logs After Deploy:**
Look for these in logs:

**✅ Good signs:**
```
✅ Order confirmation email sent
✅ Google Maps API key found
✅ Delivery check complete
```

**❌ Bad signs:**
```
❌ RESEND_API_KEY not set
❌ GOOGLE_MAPS_API_KEY not configured
❌ Missing STORE_LAT, STORE_LNG
```

---

## ⚠️ **Important Notes**

### **Variable Names Must Be EXACT:**
- Case-sensitive
- No extra spaces
- No quotes around values (unless specified, like FIREBASE_PRIVATE_KEY)

### **NEXT_PUBLIC_ Prefix:**
- Variables with `NEXT_PUBLIC_` prefix are exposed to the browser
- Variables without prefix are server-side only
- **Both Google Maps keys use the SAME value** (your API key)

### **FIREBASE_PRIVATE_KEY Format:**
- Must include the full key with `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Use `\n` for line breaks in Render
- Example:
  ```
  "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
  ```

---

## 📊 **Summary Count**

**Total Variables Needed:** ~22 variables

- Firebase: 9 variables
- Stripe: 3 variables
- Google Maps: 5 variables
- Resend: 3 variables
- Optional: 2 variables (Node.js)

---

## 🎯 **Minimum Required for Site to Work**

**Absolute minimum:**
- ✅ Firebase variables (all 9)
- ✅ Stripe variables (all 3)
- ✅ Google Maps variables (all 5)

**For emails to work:**
- ✅ Resend variables (all 3)

---

## 🐛 **Troubleshooting**

### **"Variable not found" errors:**
1. Check variable name is EXACT (case-sensitive)
2. Check for typos
3. Make sure you saved changes
4. Wait for redeploy to complete

### **"Value is wrong" errors:**
1. Check you copied the entire value
2. No extra spaces before/after
3. For FIREBASE_PRIVATE_KEY, make sure `\n` is included

### **Still not working:**
1. Check Render logs for specific errors
2. Verify all variables are listed in Environment tab
3. Try clearing build cache and redeploying

---

## ✅ **After Adding All Variables**

1. ✅ Save all changes
2. ✅ Wait for redeploy (1-2 minutes)
3. ✅ Test your site:
   - Checkout works ✅
   - Address autocomplete works ✅
   - Emails send ✅
   - Payments process ✅

---

## 📝 **Quick Reference**

**Copy this list and check off as you add:**

- [ ] FIREBASE_PROJECT_ID
- [ ] FIREBASE_CLIENT_EMAIL
- [ ] FIREBASE_PRIVATE_KEY
- [ ] NEXT_PUBLIC_FIREBASE_API_KEY
- [ ] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
- [ ] NEXT_PUBLIC_FIREBASE_PROJECT_ID
- [ ] NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
- [ ] NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
- [ ] NEXT_PUBLIC_FIREBASE_APP_ID
- [ ] STRIPE_SECRET_KEY
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- [ ] STRIPE_WEBHOOK_SECRET
- [ ] GOOGLE_MAPS_API_KEY
- [ ] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- [ ] STORE_LAT
- [ ] STORE_LNG
- [ ] DELIVERY_RADIUS_MILES
- [ ] RESEND_API_KEY
- [ ] FROM_EMAIL
- [ ] REPLY_TO_EMAIL

---

**That's everything you need!** Once all these are set in Render, your site will work perfectly in production. 🚀

