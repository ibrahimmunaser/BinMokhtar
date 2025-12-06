# Webhook Local Testing Guide

## Problem: Orders Not Appearing in Admin Panel

When you test checkout locally (`localhost:3000`), Stripe sends webhooks to your **production URL** (Render), not to your local machine. This means:

- ✅ Checkout works locally
- ✅ Stripe receives payment
- ❌ Webhook is sent to Render, not localhost
- ❌ Order is NOT created in your local database
- ❌ Order does NOT appear in `/admin/orders`

## Solution 1: Manual Order Creation (Quick Test)

For quick testing without webhooks:

1. **Open Manual Order Creator:**
   ```
   http://localhost:3000/api/orders/manual-create
   ```

2. **Fill in the form:**
   - Customer Email: `test@example.com`
   - Customer Name: `Test Customer`
   - Fulfillment Method: `shipping` / `local_delivery` / `pickup`

3. **Click "Create Test Order"**

4. **View the order:**
   - Check `/admin/orders` - your order should appear!
   - Or click the link provided after creation

### Use the API Directly

```bash
curl -X POST http://localhost:3000/api/orders/manual-create \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "fulfillmentMethod": "shipping",
    "items": [
      {
        "productId": "test-1",
        "variantId": "var-1",
        "title": "Test Thobe",
        "sku": "TEST-001",
        "qty": 1,
        "unitPrice": 15000,
        "size": "54",
        "color": "White"
      }
    ]
  }'
```

## Solution 2: Stripe CLI (Recommended for Full Testing)

To test the complete Stripe → Webhook → Order flow locally:

### Step 1: Install Stripe CLI

**Windows:**
```bash
# Download from: https://github.com/stripe/stripe-cli/releases/latest
# Or use Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download binary from: https://github.com/stripe/stripe-cli/releases/latest
```

### Step 2: Login to Stripe CLI

```bash
stripe login
```

This opens your browser to authenticate with Stripe.

### Step 3: Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### Step 4: Update Local Environment

Copy the webhook secret from the output above and add it to `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

Restart your dev server:
```bash
npm run dev
```

### Step 5: Test Checkout

1. Go to `http://localhost:3000`
2. Add items to cart
3. Go through checkout
4. Complete payment

Now the webhook will be forwarded to your local machine and the order will be created!

### Step 6: View Logs

In the terminal running `stripe listen`, you'll see:
```
2023-01-01 12:00:00  --> checkout.session.completed [evt_xxxxx]
2023-01-01 12:00:00  <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxxxx]
```

In your dev server terminal, you'll see all the webhook processing logs.

## Solution 3: Test with Production Database

If you want to test with real webhooks hitting production:

1. **Complete checkout on localhost** (webhooks go to Render)
2. **Check production logs on Render:**
   ```
   https://dashboard.render.com/web/YOUR-SERVICE/logs
   ```
3. **Orders are created in production Firestore**
4. **View orders in production:**
   ```
   https://your-app.onrender.com/admin/orders
   ```

## Checking if Webhooks Are Working

### Check Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Find your webhook endpoint
3. Click on it
4. Check "Recent events" tab
5. Look for `checkout.session.completed` events
6. Click on an event to see:
   - ✅ Response: 200 (success)
   - ❌ Response: 4xx/5xx (error)

### Check Server Logs

**Local (with Stripe CLI):**
- Look in your terminal running `npm run dev`
- Search for: `checkout.session.completed`

**Production (Render):**
- Go to Render dashboard → Your web service → Logs
- Search for: `checkout.session.completed`

## Common Issues

### Issue: "No orders found" in `/admin/orders`

**Causes:**
1. Webhooks going to production, not localhost
2. Webhook secret mismatch
3. Order creation failed (check logs)

**Solutions:**
- Use manual order creation for quick testing
- Use Stripe CLI to forward webhooks
- Check production logs if testing with production webhooks

### Issue: Webhook signature verification failed

**Cause:** `STRIPE_WEBHOOK_SECRET` doesn't match

**Solution:**
1. Get the correct secret from Stripe Dashboard
2. Update `.env.local` (local) or Render environment variables (production)
3. Restart server

### Issue: Order created but not visible

**Possible causes:**
1. Created in wrong environment (local vs production database)
2. Firebase Admin SDK not initialized
3. Firestore rules blocking read

**Check:**
```bash
# View Firebase console
https://console.firebase.google.com/project/YOUR-PROJECT/firestore/data/orders
```

## Quick Reference

| Scenario | Webhook Destination | Order Created In | How to View |
|----------|---------------------|------------------|-------------|
| Local checkout, no Stripe CLI | Production (Render) | Production Firestore | Production admin panel |
| Local checkout, with Stripe CLI | Localhost | Local Firestore | Local admin panel |
| Production checkout | Production (Render) | Production Firestore | Production admin panel |
| Manual creation | N/A (direct API call) | Local/Production (depends on where called) | Respective admin panel |

## Testing Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Can access homepage (`http://localhost:3000`)
- [ ] Can add items to cart
- [ ] Can proceed to checkout
- [ ] For webhook testing:
  - [ ] Stripe CLI installed
  - [ ] `stripe listen` running
  - [ ] Webhook secret updated in `.env.local`
  - [ ] Dev server restarted after updating `.env.local`
- [ ] For manual testing:
  - [ ] Can access `/api/orders/manual-create`
  - [ ] Can create test order
  - [ ] Order appears in `/admin/orders`

## Logs to Check

When creating an order, you should see these logs:

```
🎯 ===== STRIPE WEBHOOK RECEIVED =====
✅ Webhook signature verified successfully
✅ Received Stripe webhook event: checkout.session.completed
🎉 ===== PROCESSING checkout.session.completed =====
📦 Step 1: Retrieving full session with line items...
✅ Step 1: Session retrieved successfully
...
✅ Step 4: Order created in Firebase
✅ Step 4: Order ID: xxxxx
✅ ===== checkout.session.completed HANDLED SUCCESSFULLY =====
```

If you don't see these logs, the webhook isn't reaching your server.

