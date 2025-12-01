# ✅ Add STRIPE_WEBHOOK_SECRET to Render

## **⚠️ IMPORTANT: Never commit secrets to Git!**

This file is just a reminder. The actual secret should ONLY be added to Render environment variables.

---

## **Step-by-Step Instructions:**

### **1. Go to Render Dashboard**
- Open: https://dashboard.render.com
- Click your **Web Service**

### **2. Go to Environment Tab**
- Click **"Environment"** tab

### **3. Add the Webhook Secret**
- Click **"Add Environment Variable"**
- **Key:** `STRIPE_WEBHOOK_SECRET`
- **Value:** `whsec_esWhourF7lAdHzkCTbIPLUilDw6uRPlX`
- Click **"Save Changes"**

### **4. Wait for Redeploy**
- Render will automatically redeploy
- Wait 1-2 minutes

### **5. Test**
- Make a test purchase
- Check Render logs for: `✅ Received Stripe webhook event`
- Check your email!

---

## **✅ Verification:**

After adding, verify in Render:
- ✅ `STRIPE_WEBHOOK_SECRET` is listed in Environment variables
- ✅ Value shows as `•••••` (hidden for security)
- ✅ Deployment completes successfully

---

## **🔒 Security Note:**

- ✅ This secret is already in Render (you just added it)
- ✅ Never commit secrets to Git
- ✅ Never share secrets publicly
- ✅ If secret is exposed, regenerate it in Stripe Dashboard

---

## **📋 Complete Checklist:**

Make sure you have ALL these in Render:

- ✅ `STRIPE_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET` ← **You just added this!**
- ✅ `RESEND_API_KEY`
- ✅ `FROM_EMAIL`
- ✅ `REPLY_TO_EMAIL`
- ✅ All Firebase variables
- ✅ All Google Maps variables

---

**After adding this and redeploying, your webhook should work and emails will be sent!** 🎉

