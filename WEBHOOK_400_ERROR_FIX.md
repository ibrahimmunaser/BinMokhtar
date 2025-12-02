# 🔧 Fix Webhook 400 Error - Signature Verification Failed

## **Problem:**
Webhook is returning **400 ERR** - this means signature verification is failing.

---

## **Most Likely Cause:**
The **webhook secret in Render doesn't match** the signing secret in Stripe Dashboard.

---

## **Fix Steps:**

### **Step 1: Get the Correct Webhook Secret from Stripe**

1. **Stripe Dashboard** → **Developers** → **Webhooks**
2. **Click on** your webhook: `Bin Mukhtar Retail`
3. **Look for** "Signing secret" section
4. **Copy** the secret (it should start with `whsec_`)
5. **It should be:** `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`

### **Step 2: Verify Secret in Render**

1. **Render Dashboard** → Your Web Service → **Environment** tab
2. **Find:** `STRIPE_WEBHOOK_SECRET`
3. **Check** if it matches exactly: `whsec_FdaKRHnDuiQhUV6UX6TyG800g5amQD84`
4. **If it doesn't match:**
   - Click **Edit** (pencil icon)
   - **Replace** with the correct secret from Stripe
   - **Save**
   - **Wait for redeploy** (1-2 minutes)

### **Step 3: Test Again**

1. **Stripe Dashboard** → **Webhooks** → Your webhook
2. **Click** on the failed delivery (400 ERR)
3. **Click** "Resend" button
4. **Check** if it succeeds (should be 200)

---

## **Alternative Causes:**

### **If Secret Matches But Still Fails:**

1. **Check Render Logs** for the exact error message
2. **Look for:** `❌ ===== WEBHOOK SIGNATURE VERIFICATION FAILED =====`
3. **The error message** will tell us what's wrong

### **Possible Issues:**

- **Body being modified:** Next.js might be parsing the body before signature verification
- **Wrong webhook:** Using secret from a different webhook
- **Secret rolled:** Secret was changed in Stripe but not updated in Render

---

## **Quick Test:**

1. **Verify** `STRIPE_WEBHOOK_SECRET` in Render matches Stripe Dashboard exactly
2. **Click "Resend"** on the failed webhook delivery
3. **Check** if it succeeds

---

## **Expected Result:**

After fixing:
- ✅ Webhook delivery shows **200 Success** (green)
- ✅ Render logs show: `✅ Webhook signature verified successfully`
- ✅ Email is sent automatically

---

## **If Still Failing:**

Check Render logs and share:
- The error message from `❌ ===== WEBHOOK SIGNATURE VERIFICATION FAILED =====`
- This will tell us exactly what's wrong

