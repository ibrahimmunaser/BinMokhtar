'use client';

import { useState, useEffect } from 'react';
import { X, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocationStore, resolveLocation } from '@/store/location';
import { LOCAL_DELIVERY_RADIUS_MILES, LOCAL_DELIVERY_FEE_CENTS } from '@/lib/shipping/config';
import { AddressAutocomplete } from '@/components/checkout/AddressAutocomplete';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddressModal({ isOpen, onClose }: AddressModalProps) {
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const locationZone = useLocationStore((state) => state.locationZone);
  const setLocationZone = useLocationStore((state) => state.setLocationZone);
  const clearLocationZone = useLocationStore((state) => state.clearLocationZone);

  // Debug: Log locationZone changes to help diagnose update issues
  useEffect(() => {
    console.log('📍 AddressModal: locationZone changed:', locationZone);
  }, [locationZone]);

  // Note: AddressAutocomplete component handles its own focus

  // Clear states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setSuccess(null);
      setAddressInput('');
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📝 AddressModal: handleAddressSubmit START');
    console.log('📝 AddressModal: addressInput:', addressInput);
    
    const trimmedAddress = addressInput.trim();
    if (!trimmedAddress) {
      console.log('📝 AddressModal: Empty address, showing error');
      setError('Please enter an address or ZIP code');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoadingAddress(true);

    try {
      console.log('📝 AddressModal: Calling resolveLocation with:', trimmedAddress);
      const zone = await resolveLocation({ address: trimmedAddress });
      console.log('📝 AddressModal: resolveLocation returned:', zone);
      console.log('📝 AddressModal: zone.formattedAddress:', zone.formattedAddress);
      console.log('📝 AddressModal: zone.street:', zone.street);
      console.log('📝 AddressModal: zone.city:', zone.city);
      
      console.log('📝 AddressModal: Calling setLocationZone...');
      setLocationZone(zone);
      console.log('📝 AddressModal: setLocationZone called');
      
      // Verify the update
      setTimeout(() => {
        const verifyZone = useLocationStore.getState().locationZone;
        console.log('📝 AddressModal: Verify - locationZone after set:', verifyZone?.formattedAddress);
      }, 50);
      
      setSuccess(
        zone.zone === 'local'
          ? `Great! Local delivery is available to ${zone.city}, ${zone.state}`
          : `Location set to ${zone.city}, ${zone.state}. Shipping rates will be shown at checkout.`
      );

      // Close modal after short delay
      console.log('📝 AddressModal: Will close modal in 1500ms');
      setTimeout(() => {
        console.log('📝 AddressModal: Closing modal now');
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('📝 AddressModal: Address resolution error:', err);
      setError(err.message || 'Could not find this address. Please check and try again.');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleClearLocation = () => {
    console.log('🗑️ AddressModal: handleClearLocation START');
    console.log('🗑️ AddressModal: Current locationZone before clear:', locationZone?.formattedAddress);
    
    // Check localStorage BEFORE clear - all keys
    try {
      const keys = ['bmr-location-storage', 'bmr-location-v2', 'bmr-location-v3'];
      console.log('🗑️ AddressModal: localStorage BEFORE clear:');
      keys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`🗑️ AddressModal: ${key}:`, value ? 'exists' : 'empty');
      });
    } catch (e) {
      console.error('🗑️ AddressModal: Error reading localStorage:', e);
    }
    
    console.log('🗑️ AddressModal: Calling clearLocationZone...');
    clearLocationZone();
    setSuccess(null);
    setError(null);
    setAddressInput('');
    
    // Verify the clear worked
    setTimeout(() => {
      const currentZone = useLocationStore.getState().locationZone;
      console.log('🗑️ AddressModal: locationZone after clear:', currentZone);
      
      // Also check localStorage AFTER clear - all keys
      try {
        const keys = ['bmr-location-storage', 'bmr-location-v2', 'bmr-location-v3'];
        console.log('🗑️ AddressModal: localStorage AFTER clear:');
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          console.log(`🗑️ AddressModal: ${key}:`, value ? 'EXISTS (BUG!)' : 'empty (good)');
        });
      } catch (e) {
        console.error('🗑️ AddressModal: Error reading localStorage after clear:', e);
      }
      
      console.log('🗑️ AddressModal: handleClearLocation END');
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[200]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-display font-semibold">Set Your Delivery Location</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-3 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Current Location Display */}
            {locationZone && (
              <div className={`p-4 rounded-lg border ${
                locationZone.zone === 'local' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 flex-shrink-0 ${
                    locationZone.zone === 'local' ? 'text-green-600' : 'text-blue-600'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      Current location: {locationZone.formattedAddress || 
                        (locationZone.street 
                          ? `${locationZone.street}, ${locationZone.city}, ${locationZone.state} ${locationZone.zip}`
                          : `${locationZone.city}, ${locationZone.state} ${locationZone.zip}`)}
                    </p>
                    <p className={`text-sm mt-1 ${
                      locationZone.zone === 'local' ? 'text-green-700' : 'text-blue-700'
                    }`}>
                      {locationZone.zone === 'local'
                        ? `Local delivery available ($${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)})`
                        : 'Shipping only (outside local delivery area)'}
                    </p>
                    <p className="text-xs text-muted mt-1">
                      {locationZone.distanceMiles.toFixed(1)} miles from store
                    </p>
                  </div>
                  <button
                    onClick={handleClearLocation}
                    className="text-xs text-muted hover:text-bmr-ink underline"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Address Autocomplete - Google Maps dropdown */}
            <div>
              <p className="text-sm text-bmr-muted mb-3">
                Enter your full street address (not just ZIP code). Shippo requires a complete address for shipping labels.
              </p>
              <AddressAutocomplete
                onAddressSelect={async (result) => {
                  console.log('📦 AddressModal: Address selected:', result);
                  try {
                    // Resolve location zone from the selected address
                    const zone = await resolveLocation({
                      address: result.formattedAddress,
                      lat: result.lat,
                      lng: result.lng,
                    });
                    
                    // Update location zone - this will trigger re-render in all subscribed components
                    console.log('🔄 AddressModal: Updating locationZone to:', zone);
                    console.log('🔄 AddressModal: New formattedAddress:', zone.formattedAddress);
                    setLocationZone(zone);
                    
                    // Verify the update immediately
                    setTimeout(() => {
                      const updatedZone = useLocationStore.getState().locationZone;
                      console.log('✅ AddressModal: Verified locationZone after update:', updatedZone);
                      console.log('✅ AddressModal: Verified formattedAddress:', updatedZone?.formattedAddress);
                      console.log('✅ AddressModal: Zone matches?', updatedZone?.formattedAddress === zone.formattedAddress);
                    }, 50);
                    
                    setSuccess(
                      zone.zone === 'local'
                        ? `Great! Local delivery is available to ${zone.city}, ${zone.state}`
                        : `Location set to ${zone.city}, ${zone.state}. Shipping rates will be shown at checkout.`
                    );
                    setError(null);

                    // Close modal after short delay to allow state to propagate
                    setTimeout(() => {
                      console.log('🔄 AddressModal: Closing modal, locationZone should be updated');
                      onClose();
                    }, 1500);
                  } catch (err: any) {
                    console.error('Error resolving location:', err);
                    setError(err.message || 'Could not process this address. Please try again.');
                  }
                }}
                onDeliveryStatusChange={(isDeliverable) => {
                  // Optional: handle delivery status change
                }}
              />
            </div>
            
            {/* Legacy Manual Entry (fallback) */}
            <details className="mt-4">
              <summary className="text-sm text-bmr-muted cursor-pointer hover:text-bmr-ink">
                Or enter address manually
              </summary>
              <form onSubmit={handleAddressSubmit} className="space-y-3 mt-3">
                <div>
                  <label htmlFor="address-input-manual" className="block text-sm font-medium mb-2">
                    Enter address or ZIP code
                  </label>
                  <input
                    id="address-input-manual"
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    placeholder="e.g., 48120 or 123 Main St, Dearborn, MI"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                    disabled={isLoadingAddress}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoadingAddress || !addressInput.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-bmr-night text-bmr-night rounded-lg hover:bg-bmr-night hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingAddress ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Looking up address...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      <span>Apply</span>
                    </>
                  )}
                </button>
              </form>
            </details>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-800">{success}</p>
              </div>
            )}

            {/* Info Text */}
            <div className="text-xs text-muted space-y-1">
              <p>
                <strong>Local Delivery:</strong> Available within {LOCAL_DELIVERY_RADIUS_MILES} miles of our store for ${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)} flat rate.
              </p>
              <p>
                <strong>Shipping:</strong> Available nationwide. Rates calculated at checkout.
              </p>
              <p>
                <strong>Pickup:</strong> Always free! Collect from our Detroit Metro location.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

