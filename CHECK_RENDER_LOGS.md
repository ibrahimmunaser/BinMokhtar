# 🔍 Check Render Logs for Webhook Errors

## **The Problem:**
Webhook is returning **500 Internal Server Error**. We need to see Render logs to find the exact error.

---

## **How to Check Render Logs:**

### **Step 1: Go to Render Dashboard**
1. **Render Dashboard** → Your Web Service
2. Click on **"Logs"** tab (or "Events" tab)

### **Step 2: Look for Recent Webhook Errors**
Look for logs from around **11:38 PM** (when the webhook failed). You should see:
- `📥 Webhook received at: ...`
- `❌ Error handling webhook: ...`
- Or any error messages

### **Step 3: Find the Error**
Look for lines that start with:
- `❌` (error emoji)
- `Error:`
- `Failed to`
- `Exception:`

---

## **Common Errors to Look For:**

### **1. Firebase Initialization Error**
```
❌ Failed to initialize Firebase Admin SDK: ...
Missing Firebase admin credentials...
```
**Fix:** Check `FIREBASE_SERVICE_ACCOUNT_JSON` in Render environment variables

### **2. Stripe API Error**
```
❌ Error retrieving session: ...
```
**Fix:** Check `STRIPE_SECRET_KEY` in Render environment variables

### **3. Email Sending Error**
```
❌ EMAIL SEND FAILED: ...
```
**Fix:** Check `RESEND_API_KEY` in Render environment variables

### **4. JSON Parsing Error**
```
❌ Failed to parse cart items...
```
**Fix:** This is a code issue, not environment variable

---

## **What to Share:**

Please copy and paste:
1. **The error message** from Render logs
2. **The timestamp** when it occurred
3. **Any stack trace** (the long error with file names and line numbers)

---

## **Quick Check:**

1. **Render Dashboard** → Your Web Service → **Logs**
2. **Scroll to** around 11:38 PM
3. **Look for** error messages
4. **Copy** the error and share it

This will tell us exactly what's failing!

