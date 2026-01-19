# Checkout Error Fix - "Failed to create checkout session"

## Problem
Users were getting "Failed to create checkout session" error when trying to buy Moroccan thobes (and potentially other products).

## Root Cause
The error message was too generic and didn't show the actual problem. Possible causes:
1. Invalid price data (negative, zero, or non-integer prices)
2. Missing required product data (productId, variantId, SKU)
3. Invalid metadata
4. Stripe API configuration issues

## Solution Implemented

### 1. Enhanced Error Logging
Added detailed error logging in `app/api/stripe/create-checkout-session/route.ts`:
- Logs full error details (type, code, param, stack trace)
- Shows specific Stripe error types
- Provides development-mode error details

### 2. Pre-Stripe Validation
Added validation before creating Stripe session:
- ✅ Validates prices are positive integers
- ✅ Validates quantities are >= 1
- ✅ Logs each item being processed
- ✅ Ensures prices are rounded to integers (Stripe requirement)
- ✅ Provides specific error messages for each validation failure

### 3. Better User Error Messages
- Shows specific error types instead of generic "Failed to create checkout session"
- Handles Stripe API key errors
- Handles invalid price errors
- Handles metadata errors

## How to Debug Further

### If the error happens again:

1. **Check Server Logs** - Look for these console messages:
   ```
   ❌ Stripe Checkout Session Error
   Error details: { message, type, code, param }
   ```

2. **Check Item Validation** - Look for:
   ```
   ✅ Item 0: { title, price, qty, size, color }
   ❌ Item X has invalid price/quantity
   ```

3. **Common Issues to Check**:
   - Product prices are stored in cents (multiply by 100)
   - Variant prices exist and are valid
   - Weight field is not interfering with checkout
   - Shipping calculations aren't causing errors

## Testing Checklist

After this fix, test:
- [ ] Regular product checkout
- [ ] Moroccan thobe checkout specifically
- [ ] Products with variants (size/color)
- [ ] Different quantities
- [ ] Different fulfillment methods (pickup, delivery, shipping)

## Next Steps

If the error persists:
1. Check the detailed error logs in terminal
2. Verify the Moroccan thobe product has valid:
   - Base price
   - Variant prices
   - SKUs
   - Weight data (if being used)
3. Test with Stripe test cards to isolate the issue

## Files Modified
- `app/api/stripe/create-checkout-session/route.ts` - Enhanced error handling and validation
- `CHECKOUT_ERROR_FIX.md` - This documentation
