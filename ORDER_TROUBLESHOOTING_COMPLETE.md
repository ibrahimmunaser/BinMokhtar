# Order Troubleshooting - COMPLETE ✅

## Problem Identified

Your order was not appearing in `/admin/orders` because:

**Stripe webhooks are configured to send to your production URL (Render), not localhost.**

When you test checkout locally:
1. ✅ Checkout completes successfully
2. ✅ Stripe processes payment  
3. ❌ Webhook is sent to Render (production), NOT localhost
4. ❌ Order is created in production database, NOT local database
5. ❌ `/admin/orders` (localhost) shows no new order

## Solutions Implemented

### 1. Manual Order Creator (Quick Testing)

**URL:** `http://localhost:3000/api/orders/manual-create`

- Create test orders instantly without Stripe
- Perfect for testing order management features
- Orders appear immediately in `/admin/orders`

**Usage:**
```bash
# Browser: Open this URL
http://localhost:3000/api/orders/manual-create

# Or use curl
curl -X POST http://localhost:3000/api/orders/manual-create \
  -H "Content-Type: application/json" \
  -d '{
    "customerEmail": "test@example.com",
    "customerName": "Test Customer",
    "fulfillmentMethod": "shipping",
    "items": [{
      "title": "Test Thobe",
      "sku": "TEST-001",
      "qty": 1,
      "unitPrice": 15000
    }]
  }'
```

### 2. Webhook Test Dashboard

**URL:** `http://localhost:3000/api/webhook-test`

- View environment configuration
- See recent orders
- Access troubleshooting tools
- Create test orders with one click

**Features:**
- ✅ Environment checks (Stripe, Firebase, etc.)
- ✅ Recent orders table
- ✅ Quick links to admin panel
- ✅ Webhook setup instructions

### 3. Enhanced Logging

All webhook events now have comprehensive logging:

```
🎯 ===== STRIPE WEBHOOK RECEIVED =====
✅ Webhook signature verified successfully
✅ Received Stripe webhook event: checkout.session.completed
🎉 ===== PROCESSING checkout.session.completed =====
📦 Step 1: Retrieving full session with line items...
✅ Step 4: Order created in Firebase
✅ Order ID: xxxxx
```

Look for these logs in your terminal to verify webhook processing.

## How to Test Locally with Full Webhook Flow

### Option A: Stripe CLI (Recommended)

1. **Install Stripe CLI:**
   ```bash
   # Windows (with Scoop)
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe
   
   # Mac
   brew install stripe/stripe-cli/stripe
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook secret** (shown in output) to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

5. **Restart dev server:**
   ```bash
   npm run dev
   ```

6. **Test checkout** - webhooks will now reach your local machine!

### Option B: Manual Test Orders (Fastest)

1. **Open:** `http://localhost:3000/api/orders/manual-create`
2. **Fill form** and click "Create Test Order"
3. **View order** in `/admin/orders`

### Option C: Production Testing

1. Complete checkout on localhost
2. Webhooks go to production (Render)
3. Check production admin panel: `https://your-app.onrender.com/admin/orders`

## Verification Checklist

### ✅ Local Development (with Stripe CLI)
- [ ] `npm run dev` is running
- [ ] `stripe listen` is running in another terminal
- [ ] Webhook secret updated in `.env.local`
- [ ] Dev server restarted after updating `.env.local`
- [ ] Test checkout completes
- [ ] Order appears in local `/admin/orders`

### ✅ Local Development (without Stripe CLI)
- [ ] `npm run dev` is running
- [ ] Open `/api/orders/manual-create`
- [ ] Create test order
- [ ] Order appears in `/admin/orders`

### ✅ Production
- [ ] Complete checkout
- [ ] Check Render logs for webhook events
- [ ] Check production `/admin/orders`
- [ ] Order appears correctly

## Quick Reference URLs

| Tool | URL | Purpose |
|------|-----|---------|
| Manual Order Creator | `/api/orders/manual-create` | Create test orders instantly |
| Webhook Test Dashboard | `/api/webhook-test` | Check configuration & view orders |
| Admin Orders | `/admin/orders` | View all orders |
| Webhook Status | `/api/webhook-status` | Environment diagnostics (JSON) |

## Common Issues & Solutions

### Issue: No orders in admin panel

**Cause:** Webhooks going to production, not localhost

**Solution:**
1. Use manual order creator for quick testing
2. Or set up Stripe CLI to forward webhooks

### Issue: Webhook signature verification failed

**Cause:** Wrong webhook secret

**Solution:**
1. Get correct secret from Stripe Dashboard or Stripe CLI output
2. Update `.env.local` with correct secret
3. Restart dev server

### Issue: Order created but can't see it

**Possible causes:**
- Created in production database (check production admin panel)
- Firebase permissions issue
- Wrong project ID

**Check:**
1. Firebase Console: `https://console.firebase.google.com`
2. Navigate to Firestore → `orders` collection
3. Verify orders exist

## Log Patterns to Look For

### Successful Webhook Processing
```
🎯 ===== STRIPE WEBHOOK RECEIVED =====
✅ Webhook signature verified successfully
checkout.session.completed
✅ Order created in Firebase
```

### Failed Webhook
```
❌ Webhook signature verification failed
❌ STRIPE_WEBHOOK_SECRET doesn't match
```

### Manual Order Creation
```
📦 ===== MANUAL ORDER CREATION STARTED =====
✅ Order created successfully
✅ Order ID: xxxxx
```

### Admin Orders Page Loading
```
📋 ===== ADMIN ORDERS API CALLED =====
✅ Step 2: Documents found: 43
✅ Returning 43 orders
```

## Files Created/Modified

### New Files:
- `app/api/orders/manual-create/route.ts` - Manual order creation endpoint
- `app/api/webhook-test/route.ts` - Diagnostic dashboard
- `WEBHOOK_LOCAL_TESTING.md` - Comprehensive testing guide
- `ORDER_TROUBLESHOOTING_COMPLETE.md` - This file

### Modified Files:
- `app/api/webhook-status/route.ts` - Added simplified status fields
- `app/api/admin/orders/route.ts` - Fixed TypeScript type issues
- `app/api/stripe/webhook/route.ts` - Fixed type issues
- `app/page.tsx` - Fixed image path issue

## Next Steps

1. **Test the manual order creator:**
   ```
   http://localhost:3000/api/orders/manual-create
   ```

2. **Verify orders appear:**
   ```
   http://localhost:3000/admin/orders
   ```

3. **For full webhook testing, set up Stripe CLI** (see above)

4. **Monitor logs** in your terminal for any issues

## Success Criteria

You'll know everything is working when:

- ✅ You can create orders via manual endpoint
- ✅ Orders appear in `/admin/orders` immediately
- ✅ Order details are correct (customer, items, totals)
- ✅ Labels/tracking info displays properly
- ✅ Can view individual order details

---

**Ready to test?** Start here: `http://localhost:3000/api/webhook-test`

