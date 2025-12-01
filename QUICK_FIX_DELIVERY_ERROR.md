# Quick Fix: Delivery Check Error

## 🎯 **The Error:**

```
Server configuration error: Missing STORE_LAT, STORE_LNG, DELIVERY_RADIUS_MILES
```

---

## ✅ **Quick Fix - Add These 3 Variables to Render:**

### **Step 1: Go to Render Dashboard**
1. Open: https://dashboard.render.com
2. Click your **Web Service**
3. Click **"Environment"** tab

### **Step 2: Add These 3 Variables**

Click **"Add Environment Variable"** for each:

#### **Variable 1:**
- **Key:** `STORE_LAT`
- **Value:** `42.28427428899192`
- Click **"Save"**

#### **Variable 2:**
- **Key:** `STORE_LNG`
- **Value:** `-83.17141110211989`
- Click **"Save"**

#### **Variable 3:**
- **Key:** `DELIVERY_RADIUS_MILES`
- **Value:** `15`
- Click **"Save"**

### **Step 3: Wait for Redeploy**
- Render will automatically redeploy
- Wait 1-2 minutes

### **Step 4: Test**
- Go to checkout page
- Click "Delivery"
- Type an address
- Select from dropdown
- Should work now! ✅

---

## 📋 **Copy-Paste Values:**

```bash
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989
DELIVERY_RADIUS_MILES=15
```

---

## ✅ **That's It!**

After adding these 3 variables and redeploying, the delivery check will work!

---

## 🔍 **Why This Happened:**

The Google Maps API key is working (we can see it loading), but the backend API route needs these store location variables to calculate distances. Without them, it can't determine if an address is within the delivery radius.

---

## 📝 **Note:**

The React errors (#425, #418, #423) are hydration issues that we've already fixed in the code. They should go away after the next deployment. The main issue right now is these missing environment variables.

