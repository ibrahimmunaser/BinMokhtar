# Stripe Checkout Appearance Customization

## 🎨 Change the Black Background on Stripe Checkout

The black background you're seeing is Stripe's **default checkout theme**. You can customize it to match your brand!

---

## 🚀 Quick Fix - Change in Stripe Dashboard

### **Step 1: Access Stripe Dashboard**
1. Go to: https://dashboard.stripe.com/
2. Log in to your account
3. Make sure you're in **Test mode** (for testing) or **Live mode** (for production)

### **Step 2: Navigate to Branding Settings**
1. Click **Settings** (⚙️ icon) in the top right
2. Click **Branding** in the left sidebar
3. Click on **Checkout appearance** tab

### **Step 3: Customize Colors**

#### **Option A: Use a Preset Theme**
Stripe offers several preset themes:
- **Default** - Black/dark theme (current)
- **Stripe** - Blue and white
- **Night** - Dark theme
- **Flat** - Minimal light theme

**To change:**
1. Scroll to "Choose a preset"
2. Select a different theme (try **"Stripe"** or **"Flat"**)
3. Click **"Save"**

#### **Option B: Create Custom Theme**
1. In the Branding settings, find **"Customize"**
2. Customize these color values:

**Recommended for Your Brand:**

```css
/* Primary Color (Buttons, Links) */
Primary: #1a1a1a (Your BMR black)

/* Background Color (Left sidebar) */
Background: #FFFFFF (White)
or
Background: #F5F5F5 (Light gray - matches your site)

/* Text Color */
Text: #1a1a1a (Dark text)

/* Accent Color */
Accent: #1a1a1a (Your brand color)

/* Border Color */
Border: #E5E5E5 (Light borders)
```

3. See live preview on the right
4. Click **"Save changes"**

---

## 🎨 Detailed Customization Options

### **Colors You Can Customize:**

1. **Primary** - Main buttons, links, active states
2. **Background** - Page background (currently black)
3. **Component background** - Form elements background
4. **Component border** - Input field borders
5. **Component divider** - Separator lines
6. **Text** - Primary text color
7. **Secondary text** - Labels, helper text
8. **Error** - Error messages
9. **Success** - Success indicators

### **Typography:**

1. **Font** - Choose from Stripe's supported fonts or use default
2. **Size scale** - Adjust text size
3. **Line height** - Adjust spacing

### **Shapes:**

1. **Border radius** - Rounded corners (0 = square, 20 = very rounded)
2. **Button shape** - Flat, rounded, or pill-shaped

---

## 🎯 **Recommended Theme for Bin Mukhtar Retail**

### **Light & Clean Theme:**

```
Background: #FFFFFF
Component Background: #F8F8F8
Primary Color: #1a1a1a
Text Color: #1a1a1a
Border: #E5E5E5
Border Radius: 8px
```

### **Or Professional Gray Theme:**

```
Background: #F5F5F5
Component Background: #FFFFFF
Primary Color: #1a1a1a
Text Color: #1a1a1a
Border: #CCCCCC
Border Radius: 4px
```

---

## 🖼️ **Add Your Logo**

While in Branding settings:

1. Find **"Icon"** or **"Logo"** section
2. Upload your BMR logo
3. Recommended size: **512x512px** (square)
4. Supported formats: PNG, JPG
5. Click **"Save"**

Your logo will appear in the checkout page header!

---

## 📱 **Preview Your Changes**

In the Branding settings page:
1. Make your color changes
2. Look at the **live preview** on the right side
3. You'll see exactly how it looks
4. Adjust until you're happy
5. Click **"Save changes"**

---

## ⚡ **Quick Test**

After making changes:

1. Go back to your site: `http://localhost:3000/cart`
2. Add a product to cart
3. Proceed to checkout
4. Click "Proceed to Secure Checkout"
5. See your new branded Stripe checkout! 🎉

**Note:** Changes apply immediately to test mode or live mode depending on which one you're in.

---

## 🎨 **Alternative: Embedded Checkout**

If you want even more control over the appearance, you could use **Stripe Embedded Checkout** which allows the checkout to be displayed directly on your site with more customization. However, the hosted checkout (current) is simpler and more secure.

---

## 📋 **Step-by-Step Visual Guide**

### **1. Find Branding Settings:**
```
Stripe Dashboard → Settings (⚙️) → Branding → Checkout appearance
```

### **2. Select Preset or Custom:**
- Quick: Choose "Stripe" or "Flat" preset
- Custom: Click "Customize" and adjust colors manually

### **3. Key Settings to Change:**
- **Background**: Change from black (#000000) to white (#FFFFFF)
- **Primary**: Set to your brand color (#1a1a1a)
- **Border radius**: 4-8px for modern look

### **4. Save and Test:**
- Click "Save changes"
- Test on your checkout page immediately

---

## 🔍 **What the Left Panel Shows:**

The dark/black panel displays:
- Your store name: "Bin Mukhtar Retail"
- Test mode indicator
- Order total
- Product list with images
- Subtotal and total

**After customization**, this panel will match your brand colors instead of being black!

---

## 💡 **Pro Tips**

1. **Test Mode vs Live Mode:**
   - Branding settings are separate for Test and Live
   - Configure both when you're happy with the design

2. **Mobile Preview:**
   - Stripe preview shows both desktop and mobile
   - Make sure it looks good on both

3. **Consistency:**
   - Match your website's color scheme
   - Use the same fonts and button styles
   - Keep it clean and professional

4. **Accessibility:**
   - Ensure good contrast ratios
   - Don't use very light text on light backgrounds
   - Test with your target audience

---

## 📸 **Expected Result**

After customization, your checkout will look like:
- ✅ Light background instead of black
- ✅ Your logo in the header
- ✅ Brand colors throughout
- ✅ Professional, clean appearance
- ✅ Consistent with your website design

---

## 🚀 **Summary**

**The black background is Stripe's default theme.** To fix:

1. Go to: https://dashboard.stripe.com/settings/branding
2. Click: Checkout appearance
3. Choose: "Stripe" or "Flat" preset (or customize)
4. Change: Background to white/light gray
5. Save: Click "Save changes"
6. Test: Try checkout again - black will be gone! ✨

**Takes about 2 minutes to customize!** 🎨



