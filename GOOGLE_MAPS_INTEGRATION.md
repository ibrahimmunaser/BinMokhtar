# Google Maps Integration - Address Autocomplete & Delivery Radius

## 🗺️ Overview

Complete Google Maps integration for address autocomplete and delivery radius validation (15 miles).

---

## 📋 Features Implemented

### ✅ 1. Frontend - Google Maps Autocomplete
- **Component:** `components/checkout/AddressAutocomplete.tsx`
- Google Places Autocomplete input
- Extracts: formatted address, latitude, longitude
- Calls backend API to check delivery availability
- Shows green/red status message
- Secure: API key loaded via environment variable

### ✅ 2. Backend - Delivery Check API
- **Route:** `app/api/check-delivery/route.ts`
- Accepts address + optional lat/lng
- Geocodes address if coordinates not provided
- Calculates distance using Haversine formula
- Compares to 15-mile delivery radius
- Returns deliverability status

### ✅ 3. Checkout Integration
- **Component:** `components/checkout/CheckoutForm.tsx`
- Delivery vs Pickup toggle
- Address validation before checkout
- Forces pickup if outside delivery area
- Blocks checkout attempts for invalid delivery addresses
- Smooth UX with loading states

### ✅ 4. Security
- API key stored in environment variables only
- No hard-coded keys anywhere
- Server-side key never exposed to client
- Client key properly scoped to domain

---

## 🔐 Environment Variables Setup

You need to add **ONE MORE VARIABLE** to your `.env.local`:

```bash
# Backend API key (server-side only)
GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE

# Frontend API key (client-side - REQUIRED)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE

# Store location
STORE_LAT=42.28427428899192
STORE_LNG=-83.17141110211989

# Delivery radius
DELIVERY_RADIUS_MILES=15
```

### **Important:**
Both keys should typically be the **SAME KEY**, but:
- `GOOGLE_MAPS_API_KEY` - Used by backend for geocoding
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Used by frontend for autocomplete

**⚠️ REQUIRED ACTION:**
Add this line to your `.env.local`:
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```
(Use the same value as `GOOGLE_MAPS_API_KEY`)

---

## 🚀 How It Works

### **User Flow:**

1. **User visits checkout** → Sees "Delivery" and "Pickup" options
2. **Selects "Delivery"** → Address autocomplete input appears
3. **Types address** → Google autocomplete suggestions appear
4. **Selects address** → System:
   - Extracts lat/lng
   - Calls `/api/check-delivery`
   - Backend calculates distance
   - Shows green (deliverable) or red (not deliverable) message
5. **If deliverable** → Can proceed to checkout
6. **If NOT deliverable** → Must select "Pickup" to continue

### **Technical Flow:**

```
Frontend (AddressAutocomplete.tsx)
  ↓
  User selects address from autocomplete
  ↓
  Extract: formattedAddress, lat, lng
  ↓
  POST /api/check-delivery { address, lat, lng }
  ↓
Backend (route.ts)
  ↓
  Use Haversine formula to calculate distance
  ↓
  Compare distance to DELIVERY_RADIUS_MILES
  ↓
  Return: { isDeliverable, distanceMiles, normalizedAddress }
  ↓
Frontend (CheckoutForm.tsx)
  ↓
  Show status message
  ↓
  Enable/Disable delivery option
  ↓
  Block checkout if delivery selected but not available
```

---

## 📐 Haversine Formula Implementation

```typescript
function haversineDistance(lat1, lng1, lat2, lng2): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
```

**Accuracy:** ±0.5% error for distances up to 100 miles

---

## 🎨 UI/UX Features

### **Address Autocomplete Input:**
- MapPin icon
- Loading spinner while checking
- Placeholder: "Start typing your address..."
- Disabled state while Google Maps loads

### **Delivery Status Messages:**

**✅ Deliverable (Green):**
```
✓ Delivery Available
This address is within our delivery area (X.X miles from store)
```

**❌ Not Deliverable (Red):**
```
Delivery Not Available
This address is X.X miles away. We only deliver within 15 miles of our store.
In-store pickup is available.
```

### **Fulfillment Method Cards:**
- Delivery (with truck icon)
- Pickup (with package icon)
- Visual selection state
- Disabled state for unavailable delivery

### **Checkout Protection:**
- Submit button disabled if:
  - Delivery selected + address outside radius
  - Delivery selected + no address entered
- Clear error messages explaining the issue

---

## 🔒 Security Features

### **✅ API Key Protection:**

1. **Backend Key (`GOOGLE_MAPS_API_KEY`)**
   - Never exposed to client
   - Used only in server-side API routes
   - Used for geocoding addresses

2. **Frontend Key (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)**
   - Required for Google Maps JS API
   - Scoped to your domain in Google Cloud Console
   - Only used for autocomplete UI

### **✅ Best Practices Implemented:**

- ✅ No hard-coded keys in source code
- ✅ Keys loaded from environment variables
- ✅ Server-side geocoding (not client-side)
- ✅ Distance calculation on backend only
- ✅ No sensitive data in API responses
- ✅ Proper TypeScript types for safety

### **✅ API Key Restrictions (Recommended):**

**In Google Cloud Console:**

1. **For Frontend Key:**
   - Application restrictions: HTTP referrers
   - Add: `localhost:3000/*`, `yourdomain.com/*`
   - API restrictions: Maps JavaScript API, Places API

2. **For Backend Key:**
   - Application restrictions: IP addresses (your server IPs)
   - API restrictions: Geocoding API

---

## 📊 API Endpoint Reference

### **POST /api/check-delivery**

**Request:**
```json
{
  "address": "123 Main St, City, State, ZIP",
  "lat": 42.284274,  // Optional
  "lng": -83.171411  // Optional
}
```

**Response (Success):**
```json
{
  "isDeliverable": true,
  "distanceMiles": 8.5,
  "normalizedAddress": "123 Main St, City, MI 48000, USA",
  "error": null,
  "maxRadius": 15
}
```

**Response (Not Deliverable):**
```json
{
  "isDeliverable": false,
  "distanceMiles": 22.3,
  "normalizedAddress": "456 Far St, City, MI 48000, USA",
  "error": null,
  "maxRadius": 15
}
```

**Response (Error):**
```json
{
  "isDeliverable": false,
  "error": "Could not geocode address. Please enter a valid address."
}
```

---

## 🧪 Testing Checklist

### **Manual Testing:**

1. **✅ Autocomplete loads properly**
   - Open checkout page
   - Select "Delivery"
   - Verify autocomplete input appears
   - Verify "Loading address search..." appears briefly

2. **✅ Address selection works**
   - Start typing an address
   - Verify Google suggestions appear
   - Select an address
   - Verify loading spinner appears
   - Verify status message appears (green or red)

3. **✅ Deliverable address (< 15 miles)**
   - Enter address within 15 miles of store
   - Verify green "✓ Delivery Available" message
   - Verify distance shown
   - Verify can proceed to checkout

4. **✅ Non-deliverable address (> 15 miles)**
   - Enter address beyond 15 miles
   - Verify red "Delivery Not Available" message
   - Verify distance shown
   - Verify "Delivery" option becomes disabled
   - Verify must select "Pickup" to proceed

5. **✅ Pickup option**
   - Select "Pickup"
   - Verify address input disappears
   - Verify store location info appears
   - Verify can proceed to checkout

6. **✅ Checkout validation**
   - Try to checkout with delivery to non-deliverable address
   - Verify error message appears
   - Verify button stays disabled
   - Select pickup
   - Verify can now checkout

### **Test Addresses (Relative to Store Location):**

**Store Location:**
- Lat: 42.28427428899192
- Lng: -83.17141110211989

**Within Radius (Should be GREEN):**
- Try addresses in nearby cities
- Distance should be < 15 miles

**Outside Radius (Should be RED):**
- Try addresses in distant cities
- Distance should be > 15 miles

---

## 🐛 Troubleshooting

### **Issue: Autocomplete not loading**

**Possible Causes:**
1. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` not set
2. API key restrictions too strict
3. JavaScript API not enabled in Google Cloud

**Solution:**
1. Check `.env.local` has `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`
2. Check browser console for errors
3. Verify API is enabled in Google Cloud Console

### **Issue: "Could not geocode address"**

**Possible Causes:**
1. `GOOGLE_MAPS_API_KEY` not set
2. Geocoding API not enabled
3. Invalid address format

**Solution:**
1. Check `.env.local` has `GOOGLE_MAPS_API_KEY=...`
2. Enable Geocoding API in Google Cloud Console
3. Try a different, more complete address

### **Issue: Wrong delivery radius**

**Possible Causes:**
1. Store coordinates incorrect
2. Delivery radius setting wrong

**Solution:**
1. Verify `STORE_LAT` and `STORE_LNG` in `.env.local`
2. Verify `DELIVERY_RADIUS_MILES=15` in `.env.local`
3. Restart dev server after changing `.env.local`

---

## 🎯 Future Enhancements

### **Potential Improvements:**

1. **Multiple Store Locations**
   - Support multiple stores
   - Find nearest store automatically
   - Different delivery radii per store

2. **Delivery Zones**
   - Zone-based pricing
   - Different delivery fees per zone
   - Express delivery for close addresses

3. **Map Visualization**
   - Show store on map
   - Show delivery radius circle
   - Show customer location
   - Visual confirmation

4. **Delivery Scheduling**
   - Choose delivery date/time
   - Show available time slots
   - Same-day delivery for close addresses

5. **Address Validation**
   - Verify apartment/unit numbers
   - Suggest corrections for typos
   - Confirm ambiguous addresses

6. **Saved Addresses**
   - Save multiple addresses per user
   - Quick select from saved addresses
   - Default delivery address

---

## 📝 Summary

### **What's Implemented:**

✅ Google Maps autocomplete with Places API  
✅ Backend distance calculation (Haversine)  
✅ 15-mile delivery radius validation  
✅ Delivery vs Pickup selection  
✅ Checkout validation & blocking  
✅ Secure API key management  
✅ Beautiful UI with status messages  
✅ Loading states & error handling  
✅ Mobile-responsive design  

### **Files Modified/Created:**

1. ✅ `app/api/check-delivery/route.ts` - Backend API
2. ✅ `components/checkout/AddressAutocomplete.tsx` - Autocomplete UI
3. ✅ `components/checkout/CheckoutForm.tsx` - Checkout integration
4. ✅ `GOOGLE_MAPS_INTEGRATION.md` - This documentation

### **Required Action:**

⚠️ **Add to `.env.local`:**
```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY_HERE
```

Then restart your dev server:
```bash
npm run dev
```

---

## ✅ Verification Complete

All requirements implemented:
- ✅ Frontend autocomplete with secure key loading
- ✅ Backend API with Haversine formula
- ✅ Delivery radius validation (15 miles)
- ✅ Checkout flow integration
- ✅ Security measures in place
- ✅ No key leaks

**Ready to test!** 🚀

