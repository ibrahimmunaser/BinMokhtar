'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { logBeginCheckout } from '@/lib/analytics';
import { AddressAutocomplete } from './AddressAutocomplete';
import { AlertCircle, Package, Truck } from 'lucide-react';

type FulfillmentMethod = 'delivery' | 'pickup';

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentMethod>('delivery');
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [isDeliverable, setIsDeliverable] = useState<boolean>(true);
  
  const [formData, setFormData] = useState({
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddressSelect = (data: AddressData) => {
    setAddressData(data);
    setIsDeliverable(data.isDeliverable);
    
    // Force pickup if not deliverable
    if (!data.isDeliverable) {
      setFulfillmentMethod('pickup');
    }
  };

  const handleDeliveryStatusChange = (deliverable: boolean) => {
    setIsDeliverable(deliverable);
    
    // Force pickup if not deliverable
    if (!deliverable) {
      setFulfillmentMethod('pickup');
    }
  };

  const handleStripeCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || items.length === 0) return;

    // Validation: Check delivery constraints
    if (fulfillmentMethod === 'delivery' && !addressData) {
      setError('Please select a delivery address from the dropdown list. Type your address and click one of the suggestions that appears.');
      return;
    }

    if (fulfillmentMethod === 'delivery' && !isDeliverable) {
      setError('This address is outside our delivery area. Please select pickup or choose a different address.');
      return;
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
            deliveryAddress: fulfillmentMethod === 'delivery' ? addressData?.formattedAddress : undefined,
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
              // Prevent form submission when Enter is pressed in email field
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

      {/* Fulfillment Method Selection */}
      <div>
        <h2 className="text-xl font-display mb-4">Fulfillment Method</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delivery Option */}
          <button
            type="button"
            onClick={() => {
              if (isDeliverable) {
                setFulfillmentMethod('delivery');
              }
            }}
            disabled={!isDeliverable}
            className={`p-6 border-2 rounded-lg text-left transition-all ${
              fulfillmentMethod === 'delivery'
                ? 'border-bmr-night bg-bmr-night/5'
                : 'border-border hover:border-bmr-muted'
            } ${
              !isDeliverable ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-4">
              <Truck className={`w-6 h-6 flex-shrink-0 ${
                fulfillmentMethod === 'delivery' ? 'text-bmr-night' : 'text-bmr-muted'
              }`} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">Delivery</span>
                  {!isDeliverable && addressData && (
                    <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                      Not Available
                    </span>
                  )}
                </div>
                <p className="text-sm text-bmr-muted">
                  {isDeliverable
                    ? 'We deliver to your address'
                    : 'Address is outside delivery area'}
                </p>
              </div>
            </div>
          </button>

          {/* Pickup Option */}
          <button
            type="button"
            onClick={() => setFulfillmentMethod('pickup')}
            className={`p-6 border-2 rounded-lg text-left transition-all cursor-pointer ${
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
                <div className="font-semibold mb-1">Pickup</div>
                <p className="text-sm text-bmr-muted">DM for pick up</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Address Autocomplete - Always render but conditionally show */}
      <div className={fulfillmentMethod === 'delivery' ? '' : 'hidden'}>
        <h2 className="text-xl font-display mb-4">Delivery Address</h2>
        <AddressAutocomplete
          onAddressSelect={(data) => {
            // Auto-select delivery when address is selected
            if (fulfillmentMethod !== 'delivery') {
              setFulfillmentMethod('delivery');
            }
            handleAddressSelect(data);
          }}
          onDeliveryStatusChange={(deliverable) => {
            // Auto-select delivery when checking address
            if (fulfillmentMethod !== 'delivery' && deliverable) {
              setFulfillmentMethod('delivery');
            }
            handleDeliveryStatusChange(deliverable);
          }}
        />
        {!addressData && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Tip:</strong> Type your address and <strong>click a suggestion</strong> from the dropdown list. 
              Don't just press Enter - you must select an address from the list.
            </p>
          </div>
        )}
      </div>

      {/* Pickup Information */}
      {fulfillmentMethod === 'pickup' && (
        <div className="p-6 bg-surface-3/50 rounded-lg border border-line">
          <h3 className="font-semibold mb-3">Pickup Location</h3>
          <p className="text-sm text-bmr-muted">
            We are located in <strong>Detroit Metro Area</strong>. You'll receive pickup instructions via email after placing your order.
          </p>
        </div>
      )}

      {/* Not Deliverable Warning */}
      {!isDeliverable && addressData && fulfillmentMethod === 'delivery' && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-900">
              Cannot proceed with delivery to this address
            </p>
            <p className="text-sm text-red-800 mt-1">
              Please select <strong>Pickup</strong> or choose a different delivery address within our service area.
            </p>
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
          <li>• {fulfillmentMethod === 'delivery' ? 'Confirm delivery details' : 'Confirm pickup details'} at checkout</li>
          <li>• Multiple payment methods accepted</li>
          <li>• Your payment information is never stored on our servers</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <p className="text-sm font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={
          isSubmitting || 
          items.length === 0 || 
          (fulfillmentMethod === 'delivery' && (!addressData || !isDeliverable))
        }
        className="w-full px-8 py-4 bg-bmr-night text-surface-2 font-medium uppercase tracking-wideish rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-sm"
        title={
          fulfillmentMethod === 'delivery' && !addressData
            ? 'Please select a delivery address from the dropdown. Type your address and click a suggestion.'
            : fulfillmentMethod === 'delivery' && !isDeliverable
            ? 'This address is outside our delivery area. Please select pickup or choose a different address.'
            : undefined
        }
        onClick={(e) => {
          // If delivery is selected but no address, show helpful error and focus input
          if (fulfillmentMethod === 'delivery' && !addressData) {
            e.preventDefault();
            setError('Please select a delivery address from the dropdown list. Type your address and click one of the suggestions that appears.');
            // Scroll to address input
            setTimeout(() => {
              const addressInput = document.getElementById('address-autocomplete');
              if (addressInput) {
                addressInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                addressInput.focus();
              }
            }, 100);
          }
        }}
      >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
