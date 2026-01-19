'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useLocationStore } from '@/store/location';
import { useCheckoutStore } from '@/store/checkout';
import { useAuth } from '@/contexts/AuthContext';
import { logBeginCheckout } from '@/lib/analytics';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ShippingRateSelector } from './ShippingRateSelector';
import { AddressModal } from '@/components/layout/AddressModal';
import { AlertCircle, Package, Truck, MapPin, Loader2, Navigation, Trash2, AlertTriangle } from 'lucide-react';
import { useStockValidation, StockValidationResult } from '@/hooks/useStockValidation';
import {
  FulfillmentMethod,
  LOCAL_DELIVERY_FEE_CENTS,
  ShippingRate,
  LocationZone,
} from '@/lib/shipping/config';

interface AddressData {
  formattedAddress: string;
  lat: number;
  lng: number;
  isDeliverable: boolean;
}

export function CheckoutForm() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total());
  const removeItem = useCartStore((state) => state.remove);
  
  // Auth
  const { user, isAuthenticated } = useAuth();
  
  // Stock validation
  const { 
    isValidating: isValidatingStock, 
    validationResults, 
    hasOutOfStockItems, 
    validateStock,
    getItemValidation,
  } = useStockValidation();

  // Location store - use the store directly, no local state needed
  // Subscribe to the entire store state to ensure we get updates
  const storeState = useLocationStore();
  const locationZone = storeState.locationZone;
  const isHydrated = storeState.isHydrated;
  const setLocationZone = storeState.setLocationZone;
  
  // Use locationZone directly - no displayAddress state needed
  const locationZoneObj = locationZone;
  
  // Force re-render counter (used for key prop)
  const [renderKey, setRenderKey] = useState(0);
  
  // Checkout store - for sharing state with OrderSummary
  const setCheckoutFulfillment = useCheckoutStore((state) => state.setFulfillmentMethod);
  const setCheckoutShippingCost = useCheckoutStore((state) => state.setShippingCost);
  const setCheckoutSelectedRate = useCheckoutStore((state) => state.setSelectedRate);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('pickup');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isDeliverable, setIsDeliverable] = useState<boolean>(true);
  
  // Shipping rate selection
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
  });
  
  // Address modal state
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [pendingFulfillmentMethod, setPendingFulfillmentMethod] = useState<FulfillmentMethod | null>(null);
  
  // Track if user has explicitly selected a fulfillment method (prevents auto-selection from overriding)
  const [userSelectedFulfillment, setUserSelectedFulfillment] = useState(false);
  
  // Handle hydration - wait for client to mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    console.log('🔄 CheckoutForm: Component mounted');
  }, []);
  
  // Validate stock when component mounts or items change
  useEffect(() => {
    if (mounted && items.length > 0) {
      console.log('🔄 CheckoutForm: Validating stock for', items.length, 'items');
      validateStock(items);
    }
  }, [mounted, items, validateStock]);
  
  // Pre-fill email from authenticated user
  useEffect(() => {
    if (isAuthenticated && user?.email && !formData.email) {
      setFormData(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [isAuthenticated, user?.email]);

  // Handle address being set after modal closes
  useEffect(() => {
    if (isHydrated && locationZoneObj && !showAddressModal && pendingFulfillmentMethod) {
      // User just set address and had a pending fulfillment method
      if (pendingFulfillmentMethod === 'local_delivery') {
        if (locationZoneObj.zone === 'local') {
          setFulfillmentMethod('local_delivery');
          setIsDeliverable(true);
          setError(null);
        } else {
          setError('Your address is outside our local delivery area. Please update your address or choose shipping.');
          setFulfillmentMethod('pickup'); // Reset to pickup
        }
      } else if (pendingFulfillmentMethod === 'shipping') {
        setFulfillmentMethod('shipping');
        setIsDeliverable(false);
        setError(null);
      }
      setPendingFulfillmentMethod(null);
    }
  }, [isHydrated, locationZoneObj, showAddressModal, pendingFulfillmentMethod]);

  // Initialize fulfillment method based on location zone (only on initial load, before user makes explicit selection)
  useEffect(() => {
    console.log('🔄 CheckoutForm: Auto-select useEffect triggered');
    console.log('🔄 CheckoutForm: isHydrated:', isHydrated);
    console.log('🔄 CheckoutForm: locationZoneObj:', locationZoneObj?.formattedAddress);
    console.log('🔄 CheckoutForm: fulfillmentMethod:', fulfillmentMethod);
    console.log('🔄 CheckoutForm: pendingFulfillmentMethod:', pendingFulfillmentMethod);
    console.log('🔄 CheckoutForm: userSelectedFulfillment:', userSelectedFulfillment);
    
    // Only auto-select if:
    // 1. Component is hydrated
    // 2. Location zone exists
    // 3. Current method is pickup (default)
    // 4. No pending fulfillment method
    // 5. User hasn't explicitly selected a fulfillment method yet
    if (isHydrated && locationZoneObj && fulfillmentMethod === 'pickup' && !pendingFulfillmentMethod && !userSelectedFulfillment) {
      console.log('🔄 CheckoutForm: Auto-selecting fulfillment method based on location zone');
      if (locationZoneObj.zone === 'local') {
        console.log('🔄 CheckoutForm: Auto-selecting local_delivery (zone is local)');
        setFulfillmentMethod('local_delivery');
        setIsDeliverable(true);
      } else {
        console.log('🔄 CheckoutForm: Auto-selecting shipping (zone is not local)');
        setFulfillmentMethod('shipping');
        setIsDeliverable(false);
      }
    } else {
      console.log('🔄 CheckoutForm: Skipping auto-select (conditions not met)');
    }
  }, [isHydrated, locationZoneObj, fulfillmentMethod, pendingFulfillmentMethod, userSelectedFulfillment]);
  
  // Debug: Log locationZone changes to help diagnose update issues
  useEffect(() => {
    console.log('📍 CheckoutForm: locationZone changed:', locationZoneObj);
    console.log('📍 CheckoutForm: locationZone formattedAddress:', locationZoneObj?.formattedAddress);
    console.log('📍 CheckoutForm: locationZone street:', locationZoneObj?.street);
    console.log('📍 CheckoutForm: locationZone city:', locationZoneObj?.city);
  }, [locationZoneObj]);
  
  // Force re-render when locationZone changes by updating a local state
  const [addressKey, setAddressKey] = useState(0);
  useEffect(() => {
    if (locationZoneObj?.formattedAddress) {
      setAddressKey(prev => prev + 1);
    }
  }, [locationZoneObj?.formattedAddress]);
  
  // Log fulfillmentMethod changes
  useEffect(() => {
    console.log('🔄 CheckoutForm: fulfillmentMethod changed to:', fulfillmentMethod);
    console.log('🔄 CheckoutForm: userSelectedFulfillment:', userSelectedFulfillment);
  }, [fulfillmentMethod, userSelectedFulfillment]);
  
  // Sync local state to checkout store for OrderSummary
  useEffect(() => {
    console.log('🔄 CheckoutForm: Syncing fulfillmentMethod to checkout store:', fulfillmentMethod);
    setCheckoutFulfillment(fulfillmentMethod);
    
    // Calculate shipping cost based on method
    let shippingCost = 0;
    if (fulfillmentMethod === 'local_delivery') {
      shippingCost = LOCAL_DELIVERY_FEE_CENTS;
    } else if (fulfillmentMethod === 'shipping' && selectedRate) {
      shippingCost = selectedRate.amount;
    }
    console.log('🔄 CheckoutForm: Shipping cost calculated:', shippingCost);
    setCheckoutShippingCost(shippingCost);
    setCheckoutSelectedRate(selectedRate);
  }, [fulfillmentMethod, selectedRate, setCheckoutFulfillment, setCheckoutShippingCost, setCheckoutSelectedRate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = useCallback((data: AddressData) => {
    console.log('📦 CheckoutForm: handleAddressSelect called with:', data);
    setAddressData(data);
    setIsDeliverable(data.isDeliverable);
    
    // Force pickup if not deliverable
    if (!data.isDeliverable) {
      setFulfillmentMethod('pickup');
    }
  }, []);

  const handleDeliveryStatusChange = useCallback((deliverable: boolean) => {
    console.log('📦 CheckoutForm: handleDeliveryStatusChange called with:', deliverable);
    setIsDeliverable(deliverable);
    
    // Force pickup if not deliverable
    if (!deliverable) {
      setFulfillmentMethod('pickup');
    }
  }, []);

  const handleRateSelect = useCallback((rate: ShippingRate) => {
    setSelectedRate(rate);
    setError(null);
  }, []);

  const calculateTotal = () => {
    let calculatedTotal = total;
    
    if (fulfillmentMethod === 'local_delivery') {
      calculatedTotal += LOCAL_DELIVERY_FEE_CENTS;
    } else if (fulfillmentMethod === 'shipping' && selectedRate) {
      calculatedTotal += selectedRate.amount;
    }
    
    return calculatedTotal;
  };

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 CheckoutForm: handleStripeCheckout called');
    console.log('🚀 CheckoutForm: isSubmitting:', isSubmitting);
    console.log('🚀 CheckoutForm: items.length:', items.length);
    console.log('🚀 CheckoutForm: items:', items);
    console.log('🚀 CheckoutForm: fulfillmentMethod:', fulfillmentMethod);
    console.log('🚀 CheckoutForm: locationZoneObj:', locationZoneObj?.formattedAddress);
    console.log('🚀 CheckoutForm: selectedRate:', selectedRate);
    console.log('🚀 CheckoutForm: formData.email:', formData.email);
    console.log('🚀 CheckoutForm: total:', total);
    
    if (isSubmitting) {
      console.log('❌ CheckoutForm: Submission blocked - already submitting');
      return;
    }
    
    if (items.length === 0) {
      console.error('❌ CheckoutForm: Submission blocked - cart is empty!');
      setError('Your cart is empty. Please add items before checkout.');
      return;
    }

    // Validation
    console.log('🚀 CheckoutForm: Starting validation...');
    if (fulfillmentMethod === 'local_delivery') {
      console.log('🚀 CheckoutForm: Validating local_delivery...');
      if (!locationZoneObj) {
        console.error('❌ CheckoutForm: Local delivery validation failed - no locationZone');
        setError('Please enter a valid address to use local delivery.');
        setShowAddressModal(true);
        return;
      }
      if (locationZoneObj.zone !== 'local') {
        console.error('❌ CheckoutForm: Local delivery validation failed - zone is not local:', locationZoneObj.zone);
        setError('Local delivery is not available for your location. Please update your address or select shipping.');
        setShowAddressModal(true);
        return;
      }
      console.log('✅ CheckoutForm: Local delivery validation passed');
    }

    if (fulfillmentMethod === 'shipping') {
      console.log('🚀 CheckoutForm: Validating shipping...');
      if (!locationZoneObj) {
        console.error('❌ CheckoutForm: Shipping validation failed - no locationZone');
        setError('Please enter a valid shipping address.');
        setShowAddressModal(true);
        return;
      }
      if (!selectedRate) {
        console.error('❌ CheckoutForm: Shipping validation failed - no selectedRate');
        setError('Please select a shipping option.');
        return;
      }
      // Validate shipping amount
      if (!selectedRate.amount || selectedRate.amount <= 0 || isNaN(selectedRate.amount)) {
        console.error('❌ CheckoutForm: Shipping validation failed - invalid amount:', selectedRate);
        setError('Invalid shipping cost. Please refresh the page and try selecting a shipping option again.');
        return;
      }
      console.log('✅ CheckoutForm: Shipping validation passed:', {
        carrier: selectedRate.carrier,
        service: selectedRate.serviceLevelName,
        amount: selectedRate.amount,
      });
    }

    if (fulfillmentMethod === 'pickup') {
      console.log('✅ CheckoutForm: Pickup validation passed (no address required)');
    }

    console.log('🚀 CheckoutForm: All validations passed, proceeding with checkout...');
    setIsSubmitting(true);
    setError(null);
    
    // Track begin checkout
    console.log('🚀 CheckoutForm: Tracking begin checkout event...');
    logBeginCheckout(items, total);

    try {
      console.log('🚀 CheckoutForm: Creating Stripe checkout session...');
      console.log('🚀 CheckoutForm: Request body items:', items.map(item => ({
        productId: item.productId,
        title: item.title || item.name,
        qty: item.qty,
        price: item.priceAtAdd || item.price,
      })));
      
      // Create Stripe Checkout Session
      const startTime = Date.now();
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            title: item.title || item.name || '',
            name: item.title || item.name || '',
            sku: item.sku,
            qty: item.qty,
            priceAtAdd: item.priceAtAdd || item.price || 0,
            price: item.priceAtAdd || item.price || 0,
            imageUrl: item.imageUrl || item.image,
            size: item.size,
            color: item.color,
          })),
          customerEmail: formData.email || user?.email || undefined,
          userId: isAuthenticated ? user?.uid : undefined, // Link order to user
          metadata: {
            source: 'web_checkout',
            fulfillmentMethod,
            deliveryAddress: fulfillmentMethod !== 'pickup' && locationZoneObj 
              ? locationZoneObj.formattedAddress 
              : undefined,
            // Include full locationZone data so webhook can build complete shipping address
            locationZone: locationZoneObj ? JSON.stringify({
              formattedAddress: locationZoneObj.formattedAddress,
              street: locationZoneObj.street,
              city: locationZoneObj.city,
              state: locationZoneObj.state,
              zip: locationZoneObj.zip,
              country: locationZoneObj.country || 'US',
              zone: locationZoneObj.zone,
              distanceMiles: locationZoneObj.distanceMiles,
            }) : undefined,
            shippingRateId: selectedRate?.id,
            shippingAmount: fulfillmentMethod === 'shipping' ? selectedRate?.amount : 
                           fulfillmentMethod === 'local_delivery' ? LOCAL_DELIVERY_FEE_CENTS : 0,
            shippingCarrier: selectedRate?.carrier,
            shippingService: selectedRate?.serviceLevelName,
          },
        }),
      });

      const fetchDuration = Date.now() - startTime;
      console.log('🚀 CheckoutForm: Fetch completed in', fetchDuration, 'ms');
      console.log('🚀 CheckoutForm: Response status:', response.status);
      console.log('🚀 CheckoutForm: Response ok:', response.ok);
      
      const data = await response.json();
      console.log('🚀 CheckoutForm: Response data:', data);

      if (!response.ok) {
        console.error('❌ CheckoutForm: API returned error');
        console.error('❌ CheckoutForm: Error message:', data.error);
        
        // Handle stock validation errors specially
        if (data.stockErrors && Array.isArray(data.stockErrors)) {
          const errorMessage = 'Stock issues:\n• ' + data.stockErrors.join('\n• ');
          throw new Error(errorMessage);
        }
        
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        console.log('✅ CheckoutForm: Checkout URL received, redirecting to:', data.url);
        console.log('✅ CheckoutForm: Redirecting to Stripe checkout...');
        window.location.href = data.url;
      } else {
        console.error('❌ CheckoutForm: No checkout URL in response');
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('❌ CheckoutForm: Stripe Checkout Error');
      console.error('❌ CheckoutForm: Error type:', error?.constructor?.name);
      console.error('❌ CheckoutForm: Error message:', error?.message);
      console.error('❌ CheckoutForm: Error stack:', error?.stack);
      console.error('❌ CheckoutForm: Full error:', error);
      setError(error.message || 'Failed to proceed to checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isLocalDeliveryAvailable = locationZoneObj?.zone === 'local';

  // Get out of stock items for display
  const outOfStockItems = validationResults.filter(r => !r.isAvailable);
  
  // Helper to remove out of stock item
  const handleRemoveOutOfStockItem = (result: StockValidationResult) => {
    // Find the cart item that matches this validation result
    const cartItem = items.find(item => 
      item.productId === result.productId &&
      ((!result.size && !item.size) || item.size === result.size) &&
      ((!result.color && !item.color) || item.color === result.color)
    );
    if (cartItem) {
      removeItem(cartItem.id);
    }
  };
  
  // Remove all out of stock items
  const handleRemoveAllOutOfStock = () => {
    outOfStockItems.forEach(result => {
      handleRemoveOutOfStockItem(result);
    });
  };

  return (
    <>
    <form onSubmit={handleStripeCheckout} className="space-y-8">
      {/* Stock Validation Warning */}
      {mounted && hasOutOfStockItems && outOfStockItems.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 text-lg">
                Some items are no longer available
              </h3>
              <p className="text-sm text-red-700 mt-1">
                Please remove the following items to continue with checkout:
              </p>
            </div>
          </div>
          
          <div className="space-y-3 mb-4">
            {outOfStockItems.map((result, index) => {
              const variantDesc = [result.size, result.color].filter(Boolean).join(' / ');
              return (
                <div 
                  key={`${result.productId}-${result.size}-${result.color}-${index}`}
                  className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200"
                >
                  <div>
                    <p className="font-medium text-red-900">
                      {result.title}
                      {variantDesc && <span className="text-red-700"> ({variantDesc})</span>}
                    </p>
                    <p className="text-sm text-red-600">
                      {result.message || 'Out of stock'}
                      {result.availableStock > 0 && result.availableStock < result.requestedQty && (
                        <span> - You requested {result.requestedQty}</span>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveOutOfStockItem(result)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          
          {outOfStockItems.length > 1 && (
            <button
              type="button"
              onClick={handleRemoveAllOutOfStock}
              className="w-full py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Remove All Unavailable Items
            </button>
          )}
        </div>
      )}
      
      {/* Stock Validation Loading */}
      {mounted && isValidatingStock && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          <span className="text-sm text-blue-700">Checking item availability...</span>
        </div>
      )}
      
      {/* Contact Information */}
      <div>
        <h2 className="text-xl font-display mb-4">Contact Information</h2>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email Address <span className="text-bmr-muted font-normal">(optional)</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
              }
            }}
            placeholder="your.email@example.com"
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
          />
          <p className="mt-2 text-xs text-bmr-muted">
            Pre-fill your email to speed up checkout (you can change it later)
          </p>
        </div>
      </div>

      {/* Delivery Location / Address Input */}
      <div key={`address-display-${locationZone?.formattedAddress || 'none'}-${renderKey}`}>
        {!locationZone && (
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800 font-medium mb-2">
                Address Required
              </p>
              <p className="text-sm text-yellow-700">
                Please enter your full street address (not just ZIP code) to see available shipping options and rates. Shippo requires a complete address for shipping labels.
              </p>
            </div>
            
            {/* Address Autocomplete - Google Maps dropdown */}
            <AddressAutocomplete
              key={locationZoneObj?.formattedAddress || 'new-address'} // Force re-render when address changes
              onAddressSelect={async (result) => {
                console.log('📦 CheckoutForm: Address selected:', result);
                console.log('📦 CheckoutForm: Previous locationZone:', locationZoneObj);
                
                try {
                  // Resolve location zone from the selected address
                  const { resolveLocation } = await import('@/store/location');
                  const zone = await resolveLocation({
                    address: result.formattedAddress,
                    lat: result.lat,
                    lng: result.lng,
                  });
                  
                  console.log('📦 CheckoutForm: New zone resolved:', zone);
                  console.log('📦 CheckoutForm: Zone formattedAddress:', zone.formattedAddress);
                  
                  // Use the hook's setter directly (from component scope) to ensure re-render
                  setLocationZone(zone);
                  setError(null);
                  
                  console.log('✅ CheckoutForm: Location zone updated in store');
                  
                  // Force a small delay to ensure Zustand persist middleware updates
                  await new Promise(resolve => setTimeout(resolve, 50));
                  
                  // Verify the update
                  const updatedZone = useLocationStore.getState().locationZone;
                  console.log('✅ CheckoutForm: Verified locationZone after update:', updatedZone);
                  
                  // Auto-select fulfillment method based on zone
                  // Only if user hasn't explicitly selected Pickup
                  if (userSelectedFulfillment && fulfillmentMethod === 'pickup') {
                    console.log('📦 CheckoutForm: User selected Pickup, NOT auto-selecting fulfillment method');
                  } else {
                    console.log('📦 CheckoutForm: Auto-selecting fulfillment method based on zone:', zone.zone);
                    if (zone.zone === 'local') {
                      setFulfillmentMethod('local_delivery');
                      setIsDeliverable(true);
                    } else {
                      setFulfillmentMethod('shipping');
                      setIsDeliverable(false);
                    }
                  }
                } catch (err: any) {
                  console.error('Error resolving location:', err);
                  setError(err.message || 'Could not process this address. Please try again.');
                }
              }}
              onDeliveryStatusChange={(isDeliverable) => {
                setIsDeliverable(isDeliverable);
              }}
            />
            
            {/* Alternative Options */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-surface-3 transition-colors text-sm"
              >
                <MapPin className="w-4 h-4" />
                Use Address Modal
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.geolocation) {
                      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                      });
                      const { latitude, longitude } = position.coords;
                      const { resolveLocation } = await import('@/store/location');
                      const zone = await resolveLocation({ lat: latitude, lng: longitude });
                      const setLocationZone = useLocationStore.getState().setLocationZone;
                      setLocationZone(zone);
                      setError(null);
                      
                      // Auto-select fulfillment method
                      if (zone.zone === 'local') {
                        setFulfillmentMethod('local_delivery');
                      } else {
                        setFulfillmentMethod('shipping');
                      }
                    }
                  } catch (err: any) {
                    setError('Could not get your location. Please enter your address manually.');
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 border border-border rounded-lg hover:bg-surface-3 transition-colors text-sm"
              >
                <Navigation className="w-4 h-4" />
                Use Location
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Fulfillment Method Selection */}
      <div>
        <h2 className="text-xl font-display mb-4">Fulfillment Method</h2>
        <div className="grid grid-cols-1 gap-3">
          {/* Pickup Option */}
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ CheckoutForm: Pickup button clicked');
              console.log('🖱️ CheckoutForm: Current fulfillmentMethod:', fulfillmentMethod);
              console.log('🖱️ CheckoutForm: Current locationZone:', locationZoneObj?.formattedAddress);
              
              setUserSelectedFulfillment(true);
              setFulfillmentMethod('pickup');
              setSelectedRate(null);
              setError(null);
              setPendingFulfillmentMethod(null);
              
              console.log('🖱️ CheckoutForm: Pickup button - set fulfillmentMethod to pickup');
              console.log('🖱️ CheckoutForm: Pickup button - set userSelectedFulfillment to true');
              
              // Verify the state update
              setTimeout(() => {
                console.log('🖱️ CheckoutForm: Pickup button - verifying state after 50ms');
                console.log('🖱️ CheckoutForm: fulfillmentMethod should be pickup');
              }, 50);
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
              fulfillmentMethod === 'pickup'
                ? 'border-bmr-night bg-bmr-night/5'
                : 'border-border hover:border-bmr-muted'
            }`}
          >
            <div className="flex items-start gap-4">
              <Package className={`w-6 h-6 flex-shrink-0 ${
                fulfillmentMethod === 'pickup' ? 'text-bmr-night' : 'text-bmr-muted'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Pickup</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <p className="text-sm text-bmr-muted mt-1">
                  Collect from our Detroit Metro location
                </p>
              </div>
            </div>
          </button>

          {/* Local Delivery Option */}
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ CheckoutForm: Local Delivery button clicked');
              console.log('🖱️ CheckoutForm: Current fulfillmentMethod:', fulfillmentMethod);
              console.log('🖱️ CheckoutForm: Current locationZone:', locationZone?.formattedAddress);
              
              // Always require address for local delivery
              if (!locationZone) {
                console.log('🖱️ CheckoutForm: Local Delivery - No locationZone, opening address modal');
                setPendingFulfillmentMethod('local_delivery');
                setShowAddressModal(true);
                setError('Please enter a valid address to use local delivery.');
                return;
              }
              
              if (isLocalDeliveryAvailable) {
                console.log('🖱️ CheckoutForm: Local Delivery - Address is in local zone, setting method');
                setUserSelectedFulfillment(true);
                setFulfillmentMethod('local_delivery');
                setSelectedRate(null);
                setError(null);
                setPendingFulfillmentMethod(null);
                console.log('🖱️ CheckoutForm: Local Delivery - Method set to local_delivery');
              } else {
                console.log('🖱️ CheckoutForm: Local Delivery - Address outside zone, opening modal');
                // Address is set but not in local delivery zone
                setPendingFulfillmentMethod('local_delivery');
                setShowAddressModal(true);
                setError('Your address is outside our local delivery area. Please update your address or choose shipping.');
              }
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
              fulfillmentMethod === 'local_delivery'
                ? 'border-bmr-night bg-bmr-night/5'
                : 'border-border hover:border-bmr-muted'
            }`}
          >
            <div className="flex items-start gap-4">
              <Truck className={`w-6 h-6 flex-shrink-0 ${
                fulfillmentMethod === 'local_delivery' ? 'text-bmr-night' : 'text-bmr-muted'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Local Delivery</span>
                    {!locationZone && (
                      <span className="text-xs px-2 py-0.5 bg-bmr-night/10 text-bmr-night rounded flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Set Address
                      </span>
                    )}
                    {locationZone && !isLocalDeliveryAvailable && (
                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                        Outside Area
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatPrice(LOCAL_DELIVERY_FEE_CENTS)}</span>
                </div>
                <p className="text-sm text-bmr-muted mt-1">
                  {!locationZone
                    ? 'Click to enter your delivery address'
                    : isLocalDeliveryAvailable 
                    ? 'Delivered to your address within 1-2 business days'
                    : 'Address outside delivery area - update address or choose shipping'}
                </p>
              </div>
            </div>
          </button>

          {/* Shipping Option */}
          <button
            type="button"
            onClick={() => {
              console.log('🖱️ CheckoutForm: Shipping button clicked');
              console.log('🖱️ CheckoutForm: Current fulfillmentMethod:', fulfillmentMethod);
              console.log('🖱️ CheckoutForm: Current locationZone:', locationZone?.formattedAddress);
              
              // Always require address for shipping
              if (!locationZone) {
                console.log('🖱️ CheckoutForm: Shipping - No locationZone, opening address modal');
                setPendingFulfillmentMethod('shipping');
                setShowAddressModal(true);
                setError('Please enter a valid shipping address.');
                return;
              }
              
              console.log('🖱️ CheckoutForm: Shipping - Address exists, setting method');
              setUserSelectedFulfillment(true);
              setFulfillmentMethod('shipping');
              setError(null);
              setPendingFulfillmentMethod(null);
              console.log('🖱️ CheckoutForm: Shipping - Method set to shipping');
            }}
            className={`p-4 border-2 rounded-lg text-left transition-all cursor-pointer ${
              fulfillmentMethod === 'shipping'
                ? 'border-bmr-night bg-bmr-night/5'
                : 'border-border hover:border-bmr-muted'
            }`}
          >
            <div className="flex items-start gap-4">
              <MapPin className={`w-6 h-6 flex-shrink-0 ${
                fulfillmentMethod === 'shipping' ? 'text-bmr-night' : 'text-bmr-muted'
              }`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Shipping</span>
                    {!locationZone && (
                      <span className="text-xs px-2 py-0.5 bg-bmr-night/10 text-bmr-night rounded flex items-center gap-1">
                        <Navigation className="w-3 h-3" />
                        Set Address
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted">
                    {selectedRate ? formatPrice(selectedRate.amount) : 'Select rate below'}
                  </span>
                </div>
                <p className="text-sm text-bmr-muted mt-1">
                  {!locationZone
                    ? 'Click to enter your shipping address'
                    : 'Ship anywhere in the US via USPS, UPS, or FedEx'}
                </p>
              </div>
            </div>
          </button>
          
          {/* Delivery Address Section - Only show for Local Delivery and Shipping */}
          {(fulfillmentMethod === 'local_delivery' || fulfillmentMethod === 'shipping') && (
            <div className="mt-4">
              <h2 className="text-xl font-display mb-4">Delivery Address</h2>
              
              {/* Address Display - Show when address is set */}
              {locationZone && (
              <div className="p-4 bg-surface-3/50 rounded-lg border border-line">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-bmr-night flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Delivering to: {locationZone.formattedAddress || 
                        (locationZone.street 
                          ? `${locationZone.street}, ${locationZone.city}, ${locationZone.state} ${locationZone.zip}`
                          : `${locationZone.city}, ${locationZone.state} ${locationZone.zip}`)}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {locationZone.zone === 'local' 
                        ? `Within local delivery area (${locationZone.distanceMiles.toFixed(1)} miles from store)`
                        : `Shipping required (${locationZone.distanceMiles.toFixed(1)} miles from store)`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(true)}
                    className="text-sm text-bmr-night hover:underline"
                  >
                    Change
                  </button>
                </div>
              </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Shipping Rate Selector - Only show for shipping method */}
      {fulfillmentMethod === 'shipping' && locationZone && (
        <ShippingRateSelector
          destination={locationZone}
          items={items}
          selectedRate={selectedRate}
          onSelectRate={handleRateSelect}
          onLoadingChange={setIsLoadingRates}
        />
      )}

      {/* Pickup Information */}
      {fulfillmentMethod === 'pickup' && (
        <div className="p-6 bg-surface-3/50 rounded-lg border border-line">
          <h3 className="font-semibold mb-3">Pickup Location</h3>
          <p className="text-sm text-bmr-muted">
            We are located in <strong>Detroit Metro Area</strong>. After placing your order, please DM us on Instagram or email info@binmukhtarretail.com to arrange your pickup time and location.
          </p>
        </div>
      )}

      {/* Order Summary - only show after hydration to avoid mismatch */}
      {mounted && (
        <div className="p-6 bg-surface-3/50 rounded-lg border border-line">
          <h3 className="font-semibold mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            {fulfillmentMethod === 'local_delivery' && (
              <div className="flex justify-between">
                <span className="text-muted">Local Delivery</span>
                <span>{formatPrice(LOCAL_DELIVERY_FEE_CENTS)}</span>
              </div>
            )}
            {fulfillmentMethod === 'shipping' && selectedRate && (
              <div className="flex justify-between">
                <span className="text-muted">
                  Shipping ({selectedRate.carrier} {selectedRate.serviceLevelName})
                </span>
                <span>{formatPrice(selectedRate.amount)}</span>
              </div>
            )}
            <div className="border-t border-line pt-2 mt-2">
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
              <p className="text-xs text-muted mt-1">
                Tax calculated at checkout
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stripe Information */}
      <div className="bg-surface-3/50 p-6 rounded-lg border border-line/50">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          Secure Checkout with Stripe
        </h3>
        <ul className="text-sm text-bmr-muted space-y-1">
          <li>• Industry-leading payment security</li>
          <li>• Multiple payment methods accepted</li>
          <li>• Your payment information is never stored on our servers</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmitting || 
          items.length === 0 || 
          isLoadingRates ||
          isValidatingStock ||
          hasOutOfStockItems ||
          (fulfillmentMethod === 'shipping' && !selectedRate)
        }
        className="w-full px-8 py-4 bg-bmr-night text-surface-2 font-medium uppercase tracking-wideish rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting to checkout...
          </>
        ) : isValidatingStock ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Checking availability...
          </>
        ) : hasOutOfStockItems ? (
          <>
            <AlertTriangle className="w-5 h-5" />
            Remove Unavailable Items First
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Proceed to Secure Checkout
          </>
        )}
      </button>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-6 pt-4">
        <div className="text-xs text-bmr-muted flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>SSL Encrypted & PCI Compliant</span>
        </div>
      </div>
    </form>
    
    {/* Address Modal */}
    <AddressModal 
      isOpen={showAddressModal} 
      onClose={async () => {
        console.log('🚪 CheckoutForm: Modal onClose START');
        console.log('🚪 CheckoutForm: locationZone BEFORE close:', locationZone?.formattedAddress);
        
        setShowAddressModal(false);
        
        // Wait a moment for the store to update, then force a refresh
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Get the current locationZone from the store
        const currentZone = useLocationStore.getState().locationZone;
        console.log('🚪 CheckoutForm: Modal closed');
        console.log('🚪 CheckoutForm: locationZone from getState():', currentZone?.formattedAddress);
        console.log('🚪 CheckoutForm: locationZone from hook:', locationZone?.formattedAddress);
        console.log('🚪 CheckoutForm: Are they the same?', currentZone?.formattedAddress === locationZone?.formattedAddress);
        
        // Check localStorage directly - all keys
        try {
          const keys = ['bmr-location-storage', 'bmr-location-v2', 'bmr-location-v3'];
          keys.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              console.log(`🚪 CheckoutForm: localStorage ${key}:`, parsed?.state?.locationZone?.formattedAddress);
            } else {
              console.log(`🚪 CheckoutForm: localStorage ${key}: empty`);
            }
          });
        } catch (e) {
          console.error('🚪 CheckoutForm: Error reading localStorage:', e);
        }
        
        // Force a re-render to pick up any store changes
        setRenderKey(prev => prev + 1);
        
        // Update fulfillment method based on the current zone
        // BUT: Only if user hasn't explicitly selected Pickup, or if there's a pending fulfillment method
        if (currentZone) {
          console.log('🚪 CheckoutForm: Address modal closed with zone:', currentZone.zone);
          console.log('🚪 CheckoutForm: Current fulfillmentMethod:', fulfillmentMethod);
          console.log('🚪 CheckoutForm: userSelectedFulfillment:', userSelectedFulfillment);
          console.log('🚪 CheckoutForm: pendingFulfillmentMethod:', pendingFulfillmentMethod);
          
          // If there's a pending fulfillment method, use it (user clicked Local Delivery or Shipping)
          if (pendingFulfillmentMethod) {
            console.log('🚪 CheckoutForm: Setting fulfillment method to pending:', pendingFulfillmentMethod);
            setFulfillmentMethod(pendingFulfillmentMethod);
            setUserSelectedFulfillment(true);
            setPendingFulfillmentMethod(null);
          }
          // If user explicitly selected Pickup, don't override it
          else if (userSelectedFulfillment && fulfillmentMethod === 'pickup') {
            console.log('🚪 CheckoutForm: User selected Pickup, NOT overriding fulfillment method');
          }
          // Otherwise, auto-select based on zone (initial load scenario)
          else {
            console.log('🚪 CheckoutForm: Auto-selecting fulfillment method based on zone:', currentZone.zone);
            if (currentZone.zone === 'local') {
              setFulfillmentMethod('local_delivery');
            } else {
              setFulfillmentMethod('shipping');
            }
          }
        }
        
        // If modal closes without address being set, clear pending fulfillment method
        if (!currentZone && pendingFulfillmentMethod) {
          console.log('🚪 CheckoutForm: No zone set, clearing pending fulfillment method');
          setPendingFulfillmentMethod(null);
          // Only reset to pickup if user hasn't explicitly selected something else
          if (!userSelectedFulfillment || fulfillmentMethod === 'pickup') {
            setFulfillmentMethod('pickup');
          }
        }
        
        console.log('🚪 CheckoutForm: Modal onClose END');
      }} 
    />
    </>
  );
}
