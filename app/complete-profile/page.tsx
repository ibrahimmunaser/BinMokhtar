'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore, resolveLocation } from '@/store/location';
import { 
  Loader2, 
  User, 
  Phone, 
  MapPin, 
  CheckCircle2,
  LocateFixed,
  ArrowRight
} from 'lucide-react';
import { LOCAL_DELIVERY_FEE_CENTS } from '@/lib/shipping/config';

export default function CompleteProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const finalRedirect = searchParams?.get('redirect') || '/';
  
  const { user, profile, isLoading, isAuthenticated, updateProfile, refreshProfile } = useAuth();
  const setLocationZone = useLocationStore((state) => state.setLocationZone);
  
  // Form state
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Personal Info
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Step 2: Address
  const [addressInput, setAddressInput] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<any>(null);
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Pre-fill from existing profile or Google data
  useEffect(() => {
    if (user) {
      // Use display name from Google if available
      if (user.displayName && !fullName) {
        setFullName(user.displayName);
      }
      // Use profile data if exists
      if (profile) {
        if (profile.displayName && !fullName) {
          setFullName(profile.displayName);
        }
        if (profile.phoneNumber) {
          setPhoneNumber(profile.phoneNumber);
        }
        if (profile.defaultLocationZone) {
          setResolvedAddress(profile.defaultLocationZone);
        }
      }
    }
  }, [user, profile]);
  
  // Check if profile is already complete - redirect to destination
  useEffect(() => {
    // Only redirect if:
    // 1. Not loading
    // 2. User is authenticated
    // 3. Profile exists and is complete
    // 4. We're not currently saving (to prevent redirect during form submission)
    if (!isLoading && isAuthenticated && profile?.isProfileComplete && !isSaving) {
      console.log('🔴 [COMPLETE PROFILE] Profile already complete, redirecting to:', finalRedirect);
      router.push(finalRedirect);
    }
  }, [profile, isLoading, isAuthenticated, isSaving, router, finalRedirect]);
  
  // Handle address resolution
  const handleResolveAddress = async () => {
    if (!addressInput.trim()) {
      setAddressError('Please enter an address');
      return;
    }
    
    setIsResolvingAddress(true);
    setAddressError(null);
    
    try {
      const resolved = await resolveLocation({ address: addressInput });
      setResolvedAddress(resolved);
      setLocationZone(resolved);
    } catch (err: any) {
      setAddressError(err.message || 'Failed to resolve address');
    } finally {
      setIsResolvingAddress(false);
    }
  };
  
  // Handle geolocation
  const handleUseMyLocation = async () => {
    console.log('🔴 [COMPLETE PROFILE] Use My Location clicked');
    setIsResolvingAddress(true);
    setAddressError(null);
    
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      console.error('🔴 [COMPLETE PROFILE] Geolocation not supported');
      setAddressError('Geolocation is not supported by your browser. Please enter your address manually.');
      setIsResolvingAddress(false);
      return;
    }
    
    try {
      console.log('🔴 [COMPLETE PROFILE] Requesting geolocation...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('🔴 [COMPLETE PROFILE] Geolocation success:', pos.coords);
            resolve(pos);
          },
          (err) => {
            console.error('🔴 [COMPLETE PROFILE] Geolocation error:', err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 300000, // 5 minutes cache
          }
        );
      });
      
      const { latitude, longitude } = position.coords;
      console.log('🔴 [COMPLETE PROFILE] Got coordinates:', latitude, longitude);
      
      console.log('🔴 [COMPLETE PROFILE] Resolving location via API...');
      const resolved = await resolveLocation({ lat: latitude, lng: longitude });
      console.log('🔴 [COMPLETE PROFILE] Location resolved:', resolved);
      
      setResolvedAddress({ ...resolved, source: 'geolocation' });
      setLocationZone({ ...resolved, source: 'geolocation' });
      setAddressError(null); // Clear any previous errors
    } catch (err: any) {
      console.error('🔴 [COMPLETE PROFILE] Error in handleUseMyLocation:', err);
      
      // Provide specific error messages based on error code
      if (err.code === 1) {
        // PERMISSION_DENIED
        setAddressError('Location access was denied. Please allow location access or enter your address manually.');
      } else if (err.code === 2) {
        // POSITION_UNAVAILABLE
        setAddressError('Unable to determine your location. Please enter your address manually.');
      } else if (err.code === 3) {
        // TIMEOUT
        setAddressError('Location request timed out. Please try again or enter your address manually.');
      } else if (err.message) {
        // API error from resolveLocation
        setAddressError(err.message);
      } else {
        setAddressError('Could not get your location. Please enter your address manually.');
      }
    } finally {
      setIsResolvingAddress(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Parse name into first/last
      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || null;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;
      
      const result = await updateProfile({
        displayName: fullName || null,
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        defaultLocationZone: resolvedAddress || null,
        isProfileComplete: true, // Mark profile as complete
      });
      
      if (result.success) {
        await refreshProfile();
        router.push(finalRedirect);
      } else {
        setError(result.error || 'Failed to save profile');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Skip to destination
  const handleSkip = async () => {
    // Mark as complete even if skipped
    await updateProfile({ isProfileComplete: true });
    router.push(finalRedirect);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <Container className="py-12 lg:py-20">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-bmr-muted" />
        </div>
      </Container>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const totalSteps = 2;
  
  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-bmr-night/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-bmr-night" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-display mb-3">Welcome to BMR!</h1>
          <p className="text-muted">Let's set up your profile for a better shopping experience</p>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Step {step} of {totalSteps}</span>
            <button
              onClick={handleSkip}
              className="text-sm text-muted hover:text-bmr-night transition-colors"
            >
              Skip for now
            </button>
          </div>
          <div className="h-2 bg-surface-3 rounded-full overflow-hidden">
            <div 
              className="h-full bg-bmr-night transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}
        
        {/* Step 1: Personal Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-bmr-night text-white rounded-full flex items-center justify-center">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl">Personal Information</h2>
                <p className="text-sm text-muted">Tell us a bit about yourself</p>
              </div>
            </div>
            
            {/* Email - Auto-filled and read-only */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg bg-surface-3 text-muted cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-muted">Email from your Google account</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-12 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                />
              </div>
            </div>
            
            <button
              onClick={() => setStep(2)}
              disabled={!fullName.trim() || !phoneNumber.trim()}
              className="w-full px-8 py-4 bg-bmr-night text-surface-2 font-medium uppercase tracking-wider rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {/* Step 2: Delivery Address */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-bmr-night text-white rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl">Delivery Address</h2>
                <p className="text-sm text-muted">Set your default delivery location</p>
              </div>
            </div>
            
            {/* Geolocation Button */}
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isResolvingAddress}
              className="w-full px-4 py-4 border-2 border-dashed border-bmr-night/30 text-bmr-night rounded-lg font-medium hover:bg-bmr-night/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isResolvingAddress ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Getting your location...</span>
                </>
              ) : (
                <>
                  <LocateFixed className="w-5 h-5" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>
            
            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted">or enter address</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Enter address, city, or ZIP code"
                className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                onKeyDown={(e) => e.key === 'Enter' && handleResolveAddress()}
              />
              <button
                onClick={handleResolveAddress}
                disabled={isResolvingAddress}
                className="px-4 py-3 bg-surface-3 rounded-lg hover:bg-surface-3/80 transition-colors disabled:opacity-50"
              >
                {isResolvingAddress ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Find'
                )}
              </button>
            </div>
            
            {addressError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{addressError}</p>
                {typeof window !== 'undefined' && !window.location.protocol.includes('https') && window.location.hostname !== 'localhost' && (
                  <p className="text-xs text-red-600 mt-2">
                    Note: Geolocation requires HTTPS in production. Your browser may block location access on HTTP.
                  </p>
                )}
              </div>
            )}
            
            {/* Resolved Address Display */}
            {resolvedAddress && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">{resolvedAddress.formattedAddress}</p>
                    <p className="text-sm text-green-700 mt-1">
                      {resolvedAddress.distanceMiles.toFixed(1)} miles from store
                      {resolvedAddress?.zone === 'local' 
                        ? ` • Local delivery available ($${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)})`
                        : ' • Shipping only'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-4 border border-border rounded-lg font-medium hover:bg-surface-3 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="flex-1 px-8 py-4 bg-bmr-night text-surface-2 font-medium uppercase tracking-wider rounded-lg hover:bg-bmr-night/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}

