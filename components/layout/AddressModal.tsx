'use client';

import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Navigation, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocationStore, resolveLocation } from '@/store/location';
import { LOCAL_DELIVERY_RADIUS_MILES, LOCAL_DELIVERY_FEE_CENTS } from '@/lib/shipping/config';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddressModal({ isOpen, onClose }: AddressModalProps) {
  const [addressInput, setAddressInput] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const locationZone = useLocationStore((state) => state.locationZone);
  const setLocationZone = useLocationStore((state) => state.setLocationZone);
  const clearLocationZone = useLocationStore((state) => state.clearLocationZone);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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

  const handleUseMyLocation = async () => {
    setError(null);
    setSuccess(null);
    setIsLoadingLocation(true);

    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setIsLoadingLocation(false);
      return;
    }

    try {
      // Request location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000, // 5 minutes
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('📍 Got geolocation:', latitude, longitude);

      // Resolve location via API
      const zone = await resolveLocation({ lat: latitude, lng: longitude });
      
      setLocationZone(zone);
      setSuccess(
        zone.zone === 'local'
          ? `Great! Local delivery is available to ${zone.city}, ${zone.state}`
          : `Location set to ${zone.city}, ${zone.state}. Shipping rates will be shown at checkout.`
      );

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Geolocation error:', err);
      
      if (err.code === 1) {
        setError('Location access was denied. Please enter your address manually.');
      } else if (err.code === 2) {
        setError('Unable to determine your location. Please enter your address manually.');
      } else if (err.code === 3) {
        setError('Location request timed out. Please try again or enter your address manually.');
      } else {
        setError(err.message || 'Failed to get your location. Please enter your address manually.');
      }
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedAddress = addressInput.trim();
    if (!trimmedAddress) {
      setError('Please enter an address or ZIP code');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsLoadingAddress(true);

    try {
      const zone = await resolveLocation({ address: trimmedAddress });
      
      setLocationZone(zone);
      setSuccess(
        zone.zone === 'local'
          ? `Great! Local delivery is available to ${zone.city}, ${zone.state}`
          : `Location set to ${zone.city}, ${zone.state}. Shipping rates will be shown at checkout.`
      );

      // Close modal after short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Address resolution error:', err);
      setError(err.message || 'Could not find this address. Please check and try again.');
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const handleClearLocation = () => {
    clearLocationZone();
    setSuccess(null);
    setError(null);
    setAddressInput('');
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
                      Current location: {locationZone.city}, {locationZone.state}
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

            {/* Use My Location Button */}
            <button
              onClick={handleUseMyLocation}
              disabled={isLoadingLocation || isLoadingAddress}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-bmr-night text-white rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoadingLocation ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  <span>Use my current location</span>
                </>
              )}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-muted">or</span>
              </div>
            </div>

            {/* Manual Address Entry */}
            <form onSubmit={handleAddressSubmit} className="space-y-3">
              <div>
                <label htmlFor="address-input" className="block text-sm font-medium mb-2">
                  Enter address or ZIP code
                </label>
                <input
                  ref={inputRef}
                  id="address-input"
                  type="text"
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="e.g., 48120 or 123 Main St, Dearborn, MI"
                  className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                  disabled={isLoadingLocation || isLoadingAddress}
                />
              </div>
              <button
                type="submit"
                disabled={isLoadingLocation || isLoadingAddress || !addressInput.trim()}
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

