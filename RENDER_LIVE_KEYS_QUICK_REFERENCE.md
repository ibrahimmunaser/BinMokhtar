# 🚀 Quick Reference: Live Stripe Keys for Render

## **Copy-Paste These Values into Render Dashboard**

Go to: **Render Dashboard** → **Your Web Service** → **Environment** tab

---

### **1. NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY**
```
pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

### **2. STRIPE_SECRET_KEY**
```
sk_live_YOUR_SECRET_KEY_HERE
```

### **3. STRIPE_WEBHOOK_SECRET**
```
whsec_YOUR_WEBHOOK_SECRET_HERE
```

**⚠️ Note:** Replace the placeholders above with your actual keys from Stripe Dashboard (Live Mode).

---

## **Quick Steps:**

1. ✅ Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` → Paste live publishable key above
2. ✅ Update `STRIPE_SECRET_KEY` → Paste live secret key above
3. ✅ Update `STRIPE_WEBHOOK_SECRET` → Paste live webhook secret above
4. ✅ **IMPORTANT:** Update webhook endpoint in Stripe Dashboard (Live Mode) to point to your Render URL
5. ✅ Wait for Render to redeploy (2-3 minutes)
6. ✅ Test with a real card (you'll be charged!)

---

## **⚠️ Don't Forget:**

- Switch Stripe Dashboard to **LIVE MODE** (top right toggle)
- Update webhook endpoint URL in Stripe Dashboard → Developers → Webhooks
- Verify webhook signing secret matches your webhook secret from Stripe Dashboard

---

**See `SWITCH_TO_LIVE_STRIPE_KEYS.md` for detailed instructions.**

