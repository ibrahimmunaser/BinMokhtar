# Shippo Shipping Label Integration Guide

This document explains the Shippo shipping label integration implemented for Bin Mukhtar Retail.

## Overview

The integration automatically creates shipping labels when customers complete orders with payment. It supports:
- **Shipping orders**: Creates Shippo carrier labels (USPS/UPS) with tracking
- **Pickup/Local Delivery orders**: Creates internal printable labels for store use

## Environment Variables

Add these to your environment (Render, Vercel, etc.):

```bash
# Shippo API Key (REQUIRED)
SHIPPO_API_KEY=your_shippo_api_key_here

# Optional: Set to 'true' to use test mode (if you have separate test/live keys)
SHIPPO_USE_TEST=false
```

**Important**: 
- The API key provided is a **LIVE** key. For production, keep `SHIPPO_USE_TEST=false` or unset.
- Never expose `SHIPPO_API_KEY` in client-side code - it's only used server-side.
- The key supports both `SHIPPO_API_KEY` (new) and `SHIPPO_API_TOKEN` (legacy) for backward compatibility.

## How It Works

### 1. Payment Success Flow

When a customer completes payment via Stripe:

1. **Stripe webhook** (`app/api/stripe/webhook/route.ts`) receives `checkout.session.completed`
2. Order is created in Firestore with:
   - Payment status
   - Customer info
   - Shipping address
   - Order items
   - **Total weight** (calculated from product/variant weights)
   - Fulfillment method (`pickup`, `local_delivery`, or `shipping`)

3. **Label creation** is triggered automatically:
   - For `shipping`: Creates Shippo shipment → selects rate → purchases label
   - For `pickup`/`local_delivery`: Generates internal label URL

### 2. Shippo Label Creation (Shipping Orders)

The process (`lib/shipping/shippoOrderLabel.ts`):

1. **Validates shipping address** (name, street, city, state, zip, country)
2. **Calculates order weight** from product/variant `weight_grams` fields
3. **Creates Shippo shipment** with:
   - From: Store address (Bin Mukhtar Retail, Dearborn, MI)
   - To: Customer shipping address
   - Parcel: Dimensions (14x10x3 in) + weight (from order)
4. **Selects best rate** (cheapest USPS/UPS domestic service)
5. **Purchases label** (creates transaction)
6. **Saves to order**:
   - `shippo_shipment_id`
   - `shippo_transaction_id`
   - `shippo_label_url` (PDF URL)
   - `shippo_tracking_number`
   - `shippo_label_status` (`success`, `failed`, `pending`, `none`)

### 3. Internal Label Creation (Pickup/Local Delivery)

For non-shipping orders (`lib/shipping/internalLabel.ts`):

1. Generates a URL: `/api/orders/internal-label/[orderId]`
2. When accessed, renders a printable HTML label with:
   - Store name
   - Order number
   - Customer name/address
   - Order items
   - Totals
3. Saved to order as `internal_label_url`

### 4. Idempotency

**Critical**: The system is idempotent - if a label already exists, it won't create a duplicate.

- Checks `shippo_label_url` or `internal_label_url` before creating
- Webhook retries won't create duplicate labels
- Manual retries respect existing labels

## Product Weight Configuration

For accurate shipping calculations, products and variants should have `weight_grams`:

### Adding Weight to Products

**Via Admin UI** (when implemented):
- Add `weight_grams` field to product form
- Default: 500g (about 1.1 lbs for a thobe)

**Via Firestore directly**:
```javascript
// Product document
{
  weight_grams: 500  // Default weight for all variants
}

// Variant document (optional - overrides product weight)
{
  weight_grams: 600  // Specific variant weight
}
```

**Fallback**: If weight is missing, system uses 500g default per item.

## Admin Interface

### Orders List (`/admin/orders`)

Shows all orders with:
- Order number
- Customer name/email
- Fulfillment method
- Payment status
- **Label status** badge:
  - ✅ **Ready** (green) - Label created successfully
  - ⏳ **Pending** (yellow) - Label creation in progress
  - ❌ **Failed** (red) - Label creation failed (hover for error message)
  - **None** (gray) - No label created yet

### Order Detail (`/admin/orders/[id]`)

Shows full order details:
- Order status and fulfillment method
- **Label section**:
  - **Shipping orders**: "Open Shipping Label" button → Opens Shippo PDF in new tab
  - **Pickup/Local**: "Open Internal Label" button → Opens printable HTML label
  - **Failed labels**: "Retry Label" button to attempt creation again
- Customer information
- Shipping address
- Order items
- Order totals

## API Endpoints

### Retry Label Creation

**POST** `/api/admin/orders/[id]/retry-label`

Manually retry label creation for a failed order.

**Response**:
```json
{
  "success": true,
  "message": "Label creation retried successfully",
  "labelUrl": "https://...",
  "trackingNumber": "1Z999AA10123456784"
}
```

### Internal Label

**GET** `/api/orders/internal-label/[orderId]`

Renders internal label HTML for pickup/local_delivery orders.

## Error Handling

### Label Creation Failures

If label creation fails:
1. Order is **still saved** (payment succeeded)
2. `shippo_label_status` = `'failed'`
3. `shippo_error_message` contains error details
4. Admin can see failure in UI and retry manually

### Common Errors

- **Missing address fields**: Check that shipping address has all required fields
- **No rates available**: Address may be invalid or outside service area
- **Weight missing**: Products should have `weight_grams` set
- **API key invalid**: Check `SHIPPO_API_KEY` environment variable

## Store Address Configuration

The store's "from" address is configured in `lib/shipping/config.ts`:

```typescript
export const STORE_ADDRESS = {
  name: 'Bin Mukhtar Retail',
  street1: '10015 Burley Street',
  city: 'Dearborn',
  state: 'MI',
  zip: '48120',
  country: 'US',
  phone: '', // Add if available
  email: 'support@binmukhtarretail.com',
};
```

Update this if the store address changes.

## Testing

### Test Order Flow

1. **Create a test order** with `fulfillmentMethod: 'shipping'`
2. **Check webhook logs** for label creation process
3. **Verify in admin**:
   - Order appears in `/admin/orders`
   - Label status shows "Ready"
   - Click "Open Shipping Label" → PDF opens

### Test Mode

If you have Shippo test credentials:
1. Set `SHIPPO_USE_TEST=true`
2. Use test API key (if different from live)
3. Test labels won't incur real postage costs

## Troubleshooting

### Labels Not Creating

1. **Check webhook logs**: Look for errors in `createShippingArtifactsForOrder`
2. **Verify API key**: Ensure `SHIPPO_API_KEY` is set correctly
3. **Check order data**: Ensure `fulfillmentMethod` and `shippingAddress` are present
4. **Verify weight**: Check that products have `weight_grams` or default is used

### Labels Failing

1. **Check `shippo_error_message`** in order document
2. **Verify shipping address** is complete and valid
3. **Check Shippo dashboard** for account issues
4. **Retry manually** via admin UI

### Weight Calculation Issues

1. **Add `weight_grams`** to products/variants
2. **Check logs** for weight calculation warnings
3. **Default weight** (500g) is used if missing

## Files Modified/Created

### New Files
- `lib/shipping/createShippingArtifacts.ts` - Main label creation orchestrator
- `lib/shipping/shippoOrderLabel.ts` - Shippo label creation logic
- `lib/shipping/shippoApi.ts` - Shippo API client
- `lib/shipping/internalLabel.ts` - Internal label generation
- `lib/shipping/calculateOrderWeight.ts` - Weight calculation helper
- `app/api/orders/internal-label/[orderId]/route.ts` - Internal label API route
- `app/admin/orders/page.tsx` - Orders list page
- `app/admin/orders/[id]/page.tsx` - Order detail page
- `app/api/admin/orders/[id]/retry-label/route.ts` - Retry label API

### Modified Files
- `types/index.ts` - Added Shippo fields to Order, Product, Variant types
- `app/api/stripe/webhook/route.ts` - Added label creation trigger
- `lib/shipping/shippo.ts` - Updated to use new API client
- `app/admin/page.tsx` - Added Orders link to navigation

## Next Steps

1. **Add weight to products**: Set `weight_grams` on existing products
2. **Test with real order**: Place a test order and verify label creation
3. **Monitor logs**: Watch for any errors in production
4. **Update store address**: If needed, update `STORE_ADDRESS` in config

## Support

For Shippo API issues:
- Shippo Dashboard: https://apps.goshippo.com/
- Shippo Docs: https://docs.goshippo.com/

For integration issues:
- Check webhook logs in your hosting platform
- Review order documents in Firestore
- Check admin UI for error messages



