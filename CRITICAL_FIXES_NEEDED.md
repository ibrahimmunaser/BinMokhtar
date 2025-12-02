# 🚨 CRITICAL FIXES NEEDED - Webhook & Stripe Keys

## **Issue 1: Webhook Secret Mismatch (CAUSING 400 ERR)**

**Current in Render:**
```
STRIPE_WEBHOOK_SECRET = whsec_fBJP9eLNUHkt5BBP7u13uPvPCU5vkwks
```

**Should be (from Stripe Dashboard):**
```
STRIPE_WEBHOOK_SECRET = whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84
```

**Fix:**
1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Find:** `STRIPE_WEBHOOK_SECRET`
3. **Click Edit** (pencil icon)
4. **Replace** with: `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
5. **Save**
6. **Wait 1-2 minutes** for redeploy

---

## **Issue 2: Stripe Keys from Different Accounts**

**Current:**
- `STRIPE_SECRET_KEY` account: `51SReiIQppfBXsI5HOohpib4Jgwo11polfVPjafplzckdrLiLndBBVnoA0uenXgJRJkHHG05aB4kkbJkfhv8IttRv0007M5JwIA`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` account: `51SReiIQppfBXsI5H3eH9cFwDMTHsplaxiayEBsVp4i7XzHuMPaHVVThaqRey6unOy1QN4TW9u7uaBKn49pDTILUq00aHdhPGKa`

**These are from DIFFERENT Stripe accounts!**

**Fix:**
1. **Stripe Dashboard** (Test Mode) → **Developers** → **API keys**
2. **Use the account that matches your `STRIPE_SECRET_KEY`:**
   - Account ID: `51SReiIQppfBXsI5HOohpib4Jgwo11polfVPjafplzckdrLiLndBBVnoA0uenXgJRJkHHG05aB4kkbJkfhv8IttRv0007M5JwIA`
3. **Copy** the matching **Publishable Key** (starts with `pk_test_51SReiIQppfBXsI5HOohpib4Jgwo11polfVPjafplzckdrLiLndBBVnoA0uenXgJRJkHHG05aB4kkbJkfhv8IttRv0007M5JwIA`)
4. **Update Render:**
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = Matching publishable key
   - `STRIPE_PUBLISHABLE_KEY` = Same matching publishable key (or remove this duplicate)
5. **Also update webhook** to use the webhook from THIS account

---

## **Step-by-Step Fix:**

### **Step 1: Fix Webhook Secret (URGENT)**
1. **Render** → Environment → `STRIPE_WEBHOOK_SECRET`
2. **Change to:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
3. **Save**

### **Step 2: Fix Stripe Keys**
1. **Stripe Dashboard** (Test Mode) → **Developers** → **API keys**
2. **Find** publishable key that matches your secret key account
3. **Update** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` in Render
4. **Save**

### **Step 3: Verify Webhook is for Correct Account**
1. **Stripe Dashboard** (Test Mode) → **Webhooks**
2. **Make sure** webhook is in the same account as your secret key
3. **Copy** the signing secret again (should be `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`)

### **Step 4: Test**
1. **Wait** for Render redeploy (1-2 minutes)
2. **Stripe Dashboard** → Webhooks → Failed delivery
3. **Click "Resend"**
4. **Check** if it succeeds (200)

---

## **After Fixing:**

Check Render logs. You should see:
```
✅ Webhook signature verified successfully
📧 ===== EMAIL SENDING STARTED =====
✅ ===== EMAIL SENT SUCCESSFULLY =====
```

---

## **Quick Checklist:**

- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
- [ ] `STRIPE_SECRET_KEY` and `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` from same account
- [ ] Webhook in Stripe Dashboard matches the account
- [ ] Clicked "Resend" on failed webhook
- [ ] Checked Render logs for results

**Fix these two issues and emails should start working!**

