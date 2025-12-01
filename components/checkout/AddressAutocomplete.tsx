'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

// Type for Google Maps Autocomplete
type GoogleAutocomplete = {
  getPlace(): {
    formatted_address?: string;
    geometry?: {
      location?: {
        lat(): number;
        lng(): number;
      };
    };
    name?: string;
  };
  addListener(event: string, handler: () => void): { remove(): void };
};

interface AddressResult {
  formattedAddress: string;
  lat: number;
  lng: number;
}

interface DeliveryCheckResult {
  isDeliverable: boolean;
  distanceMiles: number;
  normalizedAddress: string;
  error: string | null;
  maxRadius?: number;
}

interface AddressAutocompleteProps {
  onAddressSelect: (result: AddressResult & { isDeliverable: boolean }) => void;
  onDeliveryStatusChange?: (isDeliverable: boolean) => void;
}

export function AddressAutocomplete({
  onAddressSelect,
  onDeliveryStatusChange,
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null);
  const isInitialized = useRef(false);
  
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryCheckResult | null>(null);
  const [hasApiKey, setHasApiKey] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    // Debug: Check if API key is available
    console.log('🔍 Checking Google Maps API key...');
    console.log('API key present:', !!apiKey);
    console.log('API key length:', apiKey?.length || 0);
    console.log('API key first 10 chars:', apiKey?.substring(0, 10) || 'undefined');
    
    if (!apiKey) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set in environment variables');
      console.error('Make sure you:');
      console.error('1. Added NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_KEY to .env.local');
      console.error('2. Restarted the dev server (npm run dev)');
      console.error('3. Refreshed the browser');
      setHasApiKey(false);
      setLoadError('API key not configured');
      return;
    }
    
    setHasApiKey(true);
    console.log('✅ Google Maps API key found, loading script...');

    // Check if script already loaded
    if (window.google?.maps?.places) {
      console.log('✅ Google Maps already loaded');
      setIsScriptLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('⏳ Google Maps script already loading, waiting...');
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.places) {
          console.log('✅ Google Maps loaded successfully');
          setIsScriptLoaded(true);
          clearInterval(checkLoaded);
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (!window.google?.maps?.places) {
          console.error('❌ Google Maps failed to load after 10 seconds');
          setLoadError('Google Maps script timeout');
          clearInterval(checkLoaded);
        }
      }, 10000);
      
      return;
    }

    // Load the script
    console.log('📥 Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script loaded successfully');
      // Wait a bit for initialization
      setTimeout(() => {
        if (window.google?.maps?.places) {
          setIsScriptLoaded(true);
        } else {
          console.error('❌ Google Maps loaded but Places API not available');
          setLoadError('Places API not available');
        }
      }, 100);
    };

    script.onerror = (e) => {
      console.error('❌ Failed to load Google Maps script');
      console.error('Error:', e);
      console.error('Possible causes:');
      console.error('1. Invalid API key');
      console.error('2. Places API not enabled in Google Cloud Console');
      console.error('3. Billing not enabled');
      console.error('4. Network/CORS issue');
      setLoadError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Check delivery function (defined before use in handlePlaceSelect)
  const checkDelivery = useCallback(async (addressResult: AddressResult) => {
    setIsChecking(true);
    setDeliveryStatus(null);

    try {
      console.log('📍 Checking delivery for:', addressResult);
      
      const response = await fetch('/api/check-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: addressResult.formattedAddress,
          lat: addressResult.lat,
          lng: addressResult.lng,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result: DeliveryCheckResult = await response.json();
      console.log('✅ Delivery check result:', result);
      
      // Check if API returned an error
      if (result.error) {
        throw new Error(result.error);
      }
      
      setDeliveryStatus(result);

      // Notify parent component
      onAddressSelect({
        ...addressResult,
        isDeliverable: result.isDeliverable,
      });

      if (onDeliveryStatusChange) {
        onDeliveryStatusChange(result.isDeliverable);
      }
    } catch (error: any) {
      console.error('❌ Error checking delivery:', error);
      const errorMessage = error.message || 'Failed to check delivery availability';
      setDeliveryStatus({
        isDeliverable: false,
        distanceMiles: 0,
        normalizedAddress: '',
        error: errorMessage,
      });
    } finally {
      setIsChecking(false);
    }
  }, [onAddressSelect, onDeliveryStatusChange]);

  // Handle place selection
  const handlePlaceSelect = useCallback(() => {
    console.log('🔍 Place selected event fired');
    const place = autocompleteRef.current?.getPlace();

    if (!place) {
      console.error('❌ No place object returned');
      return;
    }

    console.log('📍 Place object received:', {
      formatted_address: place.formatted_address,
      has_geometry: !!place.geometry,
      name: place.name
    });

    if (!place.geometry || !place.geometry.location) {
      console.error('❌ No geometry in place object');
      console.error('This usually means:');
      console.error('1. User pressed Enter without selecting from dropdown');
      console.error('2. Or selected a non-specific result');
      console.error('Place object:', place);
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    const addressResult: AddressResult = {
      formattedAddress: place.formatted_address || '',
      lat,
      lng,
    };

    console.log('✅ Address extracted:', addressResult);
    
    // Check delivery availability
    checkDelivery(addressResult);
  }, [checkDelivery]);

  // Initialize autocomplete
  useEffect(() => {
    if (!isScriptLoaded || !inputRef.current) return;

    // If already initialized, don't reinitialize unless input ref changed
    if (isInitialized.current) {
      // Re-focus the input if it exists to ensure autocomplete is active
      if (inputRef.current && document.activeElement !== inputRef.current) {
        // Don't auto-focus, but ensure autocomplete is ready
        console.log('✅ Autocomplete already initialized');
      }
      return;
    }

    console.log('🔧 Initializing Google Places Autocomplete...');

    try {
      // Create autocomplete instance using window.google (available at runtime)
      if (!window.google?.maps?.places) {
        throw new Error('Google Maps Places API not loaded');
      }

      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        componentRestrictions: { country: 'us' }, // Restrict to US addresses
        fields: ['formatted_address', 'geometry', 'name'],
      }) as GoogleAutocomplete;

      console.log('✅ Autocomplete instance created');
      console.log('📝 You should now see suggestions when typing');

      // Listen for place selection
      const listener = autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
      
      console.log('✅ Event listener attached');
      isInitialized.current = true;

      return () => {
        if (listener && window.google?.maps?.event) {
          window.google.maps.event.removeListener(listener);
          console.log('🧹 Cleanup: Event listener removed');
        }
      };
    } catch (error) {
      console.error('❌ Error initializing autocomplete:', error);
      setLoadError('Failed to initialize autocomplete');
    }
  }, [isScriptLoaded, handlePlaceSelect]);

  // Re-initialize autocomplete if input ref changes (e.g., component remounts)
  useEffect(() => {
    if (isScriptLoaded && inputRef.current && !isInitialized.current) {
      // Trigger initialization check
      const timer = setTimeout(() => {
        if (inputRef.current && !isInitialized.current && window.google?.maps?.places) {
          console.log('🔄 Re-checking autocomplete initialization...');
          // The main useEffect should handle this, but this is a safety check
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isScriptLoaded, inputRef.current]);

  return (
    <div className="space-y-4">
      {/* API Key Warning */}
      {!hasApiKey && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">
                Google Maps API Key Not Found
              </p>
              <p className="text-sm text-red-800 mt-1">
                The environment variable <code className="px-1 bg-red-100 rounded text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> is not set.
              </p>
              <p className="text-sm text-red-700 mt-2">
                <strong>To fix:</strong>
              </p>
              <ol className="text-sm text-red-700 mt-1 ml-4 list-decimal">
                <li>Add to <code className="px-1 bg-red-100 rounded text-xs">.env.local</code></li>
                <li>Restart dev server</li>
                <li>Refresh browser</li>
              </ol>
              <p className="text-sm text-red-600 mt-2 font-mono text-xs bg-red-100 p-2 rounded">
                Open browser console (F12) for detailed debugging info
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Load Error Warning */}
      {loadError && hasApiKey && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-900">
                Google Maps Loading Error
              </p>
              <p className="text-sm text-yellow-800 mt-1">
                {loadError}
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                Check browser console (F12) for details
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Address Input */}
      <div>
        <label htmlFor="address-autocomplete" className="block text-sm font-medium mb-2">
          Delivery Address
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bmr-muted" />
          <input
            ref={inputRef}
            type="text"
            id="address-autocomplete"
            placeholder={
              !hasApiKey
                ? "API key required"
                : !isScriptLoaded
                ? "Loading..."
                : "Start typing your address..."
            }
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isScriptLoaded || !hasApiKey}
            onFocus={() => {
              if (isScriptLoaded && hasApiKey) {
                console.log('📝 Input focused - autocomplete should be active');
                // Ensure autocomplete is initialized when input is focused
                if (!isInitialized.current && window.google?.maps?.places && inputRef.current) {
                  console.log('🔄 Initializing autocomplete on focus...');
                  try {
                    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                      types: ['address'],
                      componentRestrictions: { country: 'us' },
                      fields: ['formatted_address', 'geometry', 'name'],
                    }) as GoogleAutocomplete;
                    
                    const listener = autocompleteRef.current.addListener('place_changed', handlePlaceSelect);
                    isInitialized.current = true;
                    console.log('✅ Autocomplete initialized on focus');
                  } catch (error) {
                    console.error('❌ Error initializing on focus:', error);
                  }
                }
              }
            }}
            onKeyDown={(e) => {
              // Prevent form submission when Enter is pressed (let Google Places handle it)
              if (e.key === 'Enter' && !isScriptLoaded) {
                e.preventDefault();
              }
            }}
          />
          {isChecking && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bmr-ink animate-spin" />
          )}
        </div>
        {!isScriptLoaded && hasApiKey && !loadError && (
          <p className="mt-2 text-xs text-bmr-muted flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Loading Google Maps...
          </p>
        )}
        {isScriptLoaded && hasApiKey && (
          <p className="mt-2 text-xs text-green-700 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Ready! Type and select from dropdown
          </p>
        )}
      </div>

      {/* Delivery Status */}
      {deliveryStatus && !isChecking && (
        <div
          className={`p-4 rounded-lg border ${
            deliveryStatus.isDeliverable
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {deliveryStatus.isDeliverable ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              {deliveryStatus.error ? (
                <>
                  <p className="text-sm font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-800">{deliveryStatus.error}</p>
                </>
              ) : deliveryStatus.isDeliverable ? (
                <>
                  <p className="text-sm font-semibold text-green-900">
                    ✓ Delivery Available
                  </p>
                  <p className="text-sm text-green-800">
                    This address is within our delivery area ({deliveryStatus.distanceMiles} miles from store)
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-red-900">
                    Delivery Not Available
                  </p>
                  <p className="text-sm text-red-800">
                    This address is {deliveryStatus.distanceMiles} miles away. We only deliver within{' '}
                    {deliveryStatus.maxRadius} miles of our store.
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    <strong>In-store pickup is available.</strong>
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
