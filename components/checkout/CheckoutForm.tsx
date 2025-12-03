'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useLocationStore } from '@/store/location';
import { logBeginCheckout } from '@/lib/analytics';
import { AddressAutocomplete } from './AddressAutocomplete';
import { ShippingRateSelector } from './ShippingRateSelector';
import { AlertCircle, Package, Truck, MapPin, Loader2 } from 'lucide-react';
import {
  FulfillmentMethod,
  LOCAL_DELIVERY_FEE_CENTS,
  ShippingRate,
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

  // Location store
  const locationZone = useLocationStore((state) => state.locationZone);
  const isHydrated = useLocationStore((state) => state.isHydrated);

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

  // Initialize fulfillment method based on location zone
  useEffect(() => {
    if (isHydrated && locationZone) {
      if (locationZone.zone === 'local') {
        setFulfillmentMethod('local_delivery');
        setIsDeliverable(true);
      } else {
        setFulfillmentMethod('shipping');
        setIsDeliverable(false);
      }
    }
  }, [isHydrated, locationZone]);

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
    if (isSubmitting || items.length === 0) return;

    // Validation
    if (fulfillmentMethod === 'local_delivery') {
      if (!locationZone || locationZone.zone !== 'local') {
        setError('Local delivery is not available for your location. Please select pickup or shipping.');
        return;
      }
    }

    if (fulfillmentMethod === 'shipping') {
      if (!selectedRate) {
        setError('Please select a shipping option.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    
    // Track begin checkout
    logBeginCheckout(items, total);

    try {
      // Create Stripe Checkout Session
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
          customerEmail: formData.email || undefined,
          metadata: {
            source: 'web_checkout',
            fulfillmentMethod,
            deliveryAddress: fulfillmentMethod !== 'pickup' && locationZone 
              ? locationZone.formattedAddress 
              : undefined,
            locationZone: locationZone ? JSON.stringify({
              city: locationZone.city,
              state: locationZone.state,
              zip: locationZone.zip,
              zone: locationZone.zone,
              distanceMiles: locationZone.distanceMiles,
            }) : undefined,
            shippingRateId: selectedRate?.id,
            shippingAmount: fulfillmentMethod === 'shipping' ? selectedRate?.amount : 
                           fulfillmentMethod === 'local_delivery' ? LOCAL_DELIVERY_FEE_CENTS : 0,
            shippingCarrier: selectedRate?.carrier,
            shippingService: selectedRate?.serviceLevelName,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error: any) {
      console.error('Stripe Checkout Error:', error);
      setError(error.message || 'Failed to proceed to checkout. Please try again.');
      setIsSubmitting(false);
    }
  };

  const isLocalDeliveryAvailable = locationZone?.zone === 'local';

  return (
    <form onSubmit={handleStripeCheckout} className="space-y-8">
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

      {/* Delivery Location */}
      {isHydrated && locationZone && (
        <div className="p-4 bg-surface-3/50 rounded-lg border border-line">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-bmr-night flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">
                Delivering to: {locationZone.city}, {locationZone.state} {locationZone.zip}
              </p>
              <p className="text-xs text-muted mt-1">
                {locationZone.zone === 'local' 
                  ? `Within local delivery area (${locationZone.distanceMiles.toFixed(1)} miles from store)`
                  : `Shipping required (${locationZone.distanceMiles.toFixed(1)} miles from store)`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fulfillment Method Selection */}
      <div>
        <h2 className="text-xl font-display mb-4">Fulfillment Method</h2>
        <div className="grid grid-cols-1 gap-3">
          {/* Pickup Option */}
          <button
            type="button"
            onClick={() => {
              setFulfillmentMethod('pickup');
              setSelectedRate(null);
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
              if (isLocalDeliveryAvailable) {
                setFulfillmentMethod('local_delivery');
                setSelectedRate(null);
              }
            }}
            disabled={!isLocalDeliveryAvailable}
            className={`p-4 border-2 rounded-lg text-left transition-all ${
              !isLocalDeliveryAvailable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            } ${
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
                    {!isLocalDeliveryAvailable && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Not Available
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{formatPrice(LOCAL_DELIVERY_FEE_CENTS)}</span>
                </div>
                <p className="text-sm text-bmr-muted mt-1">
                  {isLocalDeliveryAvailable 
                    ? 'Delivered to your address within 1-2 business days'
                    : 'Available within 15 miles of our store'}
                </p>
              </div>
            </div>
          </button>

          {/* Shipping Option */}
          <button
            type="button"
            onClick={() => {
              setFulfillmentMethod('shipping');
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
                  <span className="font-semibold">Shipping</span>
                  <span className="text-sm text-muted">
                    {selectedRate ? formatPrice(selectedRate.amount) : 'Select rate below'}
                  </span>
                </div>
                <p className="text-sm text-bmr-muted mt-1">
                  Ship anywhere in the US via USPS, UPS, or FedEx
                </p>
              </div>
            </div>
          </button>
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
            We are located in <strong>Detroit Metro Area</strong>. You'll receive pickup instructions via email after placing your order.
          </p>
        </div>
      )}

      {/* Order Summary */}
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
          (fulfillmentMethod === 'shipping' && !selectedRate)
        }
        className="w-full px-8 py-4 bg-bmr-night text-surface-2 font-medium uppercase tracking-wideish rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Redirecting to checkout...
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
  );
}
