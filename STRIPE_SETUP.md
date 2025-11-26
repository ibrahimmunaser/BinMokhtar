# 🚀 Stripe Checkout Integration - Setup Guide

## ✅ What's Been Implemented

Your website now has a **complete, production-grade Stripe Checkout integration**!

### 📁 New Files Created

```
lib/stripe/
├── config.ts          # Server-side Stripe configuration
└── client.ts          # Client-side Stripe.js loader

app/api/stripe/
├── create-checkout-session/route.ts  # Creates checkout sessions
└── webhook/route.ts                   # Handles Stripe webhooks

app/checkout/
├── success/page.tsx   # Payment success page
└── cancel/page.tsx    # Payment cancelled page

components/checkout/
└── CheckoutForm.tsx   # Updated to use Stripe Checkout

.env.example           # Environment variables template
STRIPE_SETUP.md        # This file
```

---

## 🔧 Setup Instructions

### 1. Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. Navigate to **Developers → API keys**
4. You'll see two keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

### 2. Add Environment Variables

Open your `.env.local` file (create it if it doesn't exist) and add:

```bash
# Stripe Keys (TEST MODE)
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Site URL (for redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**⚠️ IMPORTANT:** Never commit `.env.local` to git! It's already in `.gitignore`.

### 3. Set Up Stripe Webhook (for production)

#### Local Development (Optional - for testing webhooks locally):

Install Stripe CLI:
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

Login and forward webhooks:
```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This will give you a webhook secret starting with `whsec_`. Add it to `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Production Deployment:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed` ✅ (required)
   - `payment_intent.succeeded` (optional)
   - `payment_intent.payment_failed` (optional)
5. Copy the **Signing secret** and add to your production environment variables

### 4. Restart Your Development Server

```bash
npm run dev
```

---

## 🧪 Testing the Integration

### Test Cards

Stripe provides test card numbers for different scenarios:

| Card Number | Scenario |
|-------------|----------|
| `4242 4242 4242 4242` | ✅ Successful payment |
| `4000 0000 0000 0002` | ❌ Declined card |
| `4000 0025 0000 3155` | 🔐 Requires authentication (3D Secure) |

- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

### Testing Flow

1. **Add items to cart**
   ```
   http://localhost:3000/shop
   ```

2. **Go to cart**
   ```
   http://localhost:3000/cart
   ```

3. **Click "Proceed to Checkout"**
   ```
   http://localhost:3000/checkout
   ```

4. **Click "Proceed to Secure Checkout"**
   - You'll be redirected to Stripe's hosted checkout page
   - Enter test card: `4242 4242 4242 4242`
   - Fill in shipping address
   - Complete payment

5. **Success!**
   ```
   http://localhost:3000/checkout/success?session_id=cs_test_...
   ```

6. **Test cancellation:**
   - Click "Back" button during Stripe checkout
   ```
   http://localhost:3000/checkout/cancel
   ```

---

## 🔍 How It Works

### Flow Diagram

```
User adds items to cart
       ↓
Clicks "Proceed to Checkout" (/checkout)
       ↓
Optionally enters email
       ↓
Clicks "Proceed to Secure Checkout"
       ↓
Frontend calls: POST /api/stripe/create-checkout-session
       ↓
Backend creates Stripe Checkout Session
       ↓
Returns session.url
       ↓
Browser redirects to Stripe's hosted checkout page
       ↓
User enters payment & shipping details
       ↓
       ├─ Payment succeeds → /checkout/success ✅
       └─ Payment cancelled → /checkout/cancel ❌
       ↓
Stripe sends webhook to /api/stripe/webhook
       ↓
Webhook handler:
  • Verifies signature
  • Creates order in Firebase
  • Updates inventory (TODO)
  • Sends confirmation email (TODO)
```

### Key Features Implemented

✅ **Secure Payment Processing**
- All payment info stays on Stripe's servers
- PCI DSS compliant
- SSL encrypted

✅ **Automatic Order Creation**
- Webhook creates order in Firebase when payment succeeds
- Stores customer email, shipping address, and order items
- Order status: PAID

✅ **Cart Management**
- Cart automatically clears on successful payment
- Cart preserved if payment is cancelled
- Persistent cart (saved in localStorage)

✅ **Email Pre-fill**
- Optional email field on checkout page
- Pre-fills customer email in Stripe Checkout

✅ **Product Details in Stripe**
- Product images displayed in checkout
- Size and color shown in item description
- SKU tracked in metadata

✅ **Success & Cancel Pages**
- Beautiful confirmation page with order reference
- Clear next steps for customer
- Cancel page preserves cart and guides user back

---

## 🎨 Customization

### Modify Checkout Session Options

Edit `app/api/stripe/create-checkout-session/route.ts`:

```typescript
const session = await stripe.checkout.sessions.create({
  // Add more options here:
  allow_promotion_codes: true,  // Enable promo codes
  shipping_options: [...],       // Custom shipping rates
  tax_id_collection: { enabled: true }, // Collect tax IDs
  // ... more options
});
```

[See all Checkout Session options](https://stripe.com/docs/api/checkout/sessions/create)

### Add More Webhook Events

Edit `app/api/stripe/webhook/route.ts`:

```typescript
switch (event.type) {
  case 'checkout.session.completed':
    // Existing handler
    break;
    
  case 'charge.refunded':
    // Handle refunds
    break;
    
  case 'customer.subscription.created':
    // Handle subscriptions
    break;
}
```

---

## 🚨 Important Security Notes

### DO:
✅ Keep `STRIPE_SECRET_KEY` secret - NEVER expose in client-side code
✅ Use `.env.local` for local development
✅ Use environment variables in production (Vercel, Render, etc.)
✅ Verify webhook signatures in production
✅ Use HTTPS in production

### DON'T:
❌ Commit `.env.local` to git
❌ Expose secret keys in frontend JavaScript
❌ Skip webhook signature verification
❌ Use test keys in production

---

## 🌐 Production Deployment

### Environment Variables to Set:

```bash
# Production Stripe Keys
STRIPE_SECRET_KEY=sk_live_your_live_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Production URL
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Firebase (if not already set)
FIREBASE_SERVICE_ACCOUNT_JSON=base64_encoded_json
# ... other Firebase vars
```

### Deployment Checklist:

- [ ] Switch to **live** Stripe keys (not test keys)
- [ ] Create production webhook endpoint in Stripe Dashboard
- [ ] Set `NEXT_PUBLIC_BASE_URL` to your production domain
- [ ] Test with real card in production (then refund)
- [ ] Set up order confirmation emails
- [ ] Configure inventory management
- [ ] Add proper error logging (Sentry, etc.)

---

## 📖 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing](https://stripe.com/docs/testing)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

## 🆘 Troubleshooting

### "STRIPE_SECRET_KEY is not set"
→ Make sure `.env.local` exists with the correct key

### "Webhook signature verification failed"
→ Check that `STRIPE_WEBHOOK_SECRET` matches your webhook endpoint secret

### Redirect loop or blank Stripe page
→ Verify `NEXT_PUBLIC_BASE_URL` is set correctly

### Orders not being created
→ Check browser console and server logs for errors
→ Verify Firebase credentials are correct

### Payment succeeds but cart doesn't clear
→ Make sure `session_id` is in the success URL query params

---

## ✅ Integration Complete!

Your Stripe Checkout integration is **production-ready** and includes:

- ✅ Secure payment processing
- ✅ Webhook handling
- ✅ Order creation in Firebase
- ✅ Success & cancel pages
- ✅ Cart management
- ✅ Error handling
- ✅ Test mode support

**Next Steps:**
1. Add your Stripe API keys to `.env.local`
2. Restart your dev server
3. Test a purchase with test card `4242 4242 4242 4242`
4. Celebrate! 🎉

