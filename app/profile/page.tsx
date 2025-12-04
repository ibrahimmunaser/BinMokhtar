'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore, resolveLocation } from '@/store/location';
import { formatPrice } from '@/lib/utils';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Loader2, 
  User, 
  MapPin, 
  Package, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Edit2,
  Truck,
  Store,
  ExternalLink,
  FileText,
  ChevronRight,
  LocateFixed,
  Star,
  MessageSquare
} from 'lucide-react';
import { ReviewModal } from '@/components/reviews/ReviewModal';
import type { Order, OrderItem, Review } from '@/types';
import type { FulfillmentMethod, LocationZone } from '@/lib/shipping/config';
import { LOCAL_DELIVERY_RADIUS_MILES, LOCAL_DELIVERY_FEE_CENTS } from '@/lib/shipping/config';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isLoading, isAuthenticated, signOut, updateProfile, refreshProfile } = useAuth();
  
  // Location store
  const locationZone = useLocationStore((state) => state.locationZone);
  const setLocationZone = useLocationStore((state) => state.setLocationZone);
  
  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  
  // Form states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Profile form data
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phoneNumber: '',
  });
  
  // Address form data
  const [addressInput, setAddressInput] = useState('');
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  
  // Default fulfillment preference
  const [defaultFulfillment, setDefaultFulfillment] = useState<FulfillmentMethod | null>(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // Initialize form data from profile
  useEffect(() => {
    if (profile) {
      setProfileForm({
        displayName: profile.displayName || '',
        phoneNumber: profile.phoneNumber || '',
      });
      setDefaultFulfillment(profile.defaultFulfillmentMethod || null);
    }
  }, [profile]);
  
  // Fetch orders - query by userId and email
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      setLoadingOrders(true);
      
      try {
        const ordersRef = collection(db, 'orders');
        let ordersData: Order[] = [];
        
        // Try to fetch by userId (without orderBy to avoid index requirement)
        if (user.uid) {
          try {
            const userIdQuery = query(
              ordersRef,
              where('userId', '==', user.uid)
            );
            const userIdSnapshot = await getDocs(userIdQuery);
            ordersData = userIdSnapshot.docs.map((doc) => {
              const data = doc.data();
              
              // Convert Firestore Timestamps to Date objects
              let createdAt = data.createdAt;
              let updatedAt = data.updatedAt;
              
              // Helper function to convert timestamp
              const convertTimestamp = (ts: any): Date | null => {
                if (!ts) return null;
                
                // Already a Date
                if (ts instanceof Date) {
                  return isNaN(ts.getTime()) ? null : ts;
                }
                
                // Firestore Timestamp instance
                if (ts instanceof Timestamp) {
                  return ts.toDate();
                }
                
                // Has toDate method (check this before checking properties)
                if (ts && typeof ts.toDate === 'function') {
                  try {
                    return ts.toDate();
                  } catch (e) {
                    console.error('Error calling toDate():', e);
                  }
                }
                
                // Check for seconds property (most common Firestore Timestamp format)
                // This handles serialized Timestamps that lost their prototype
                if (typeof ts === 'object' && ts.seconds !== undefined && typeof ts.seconds === 'number') {
                  const milliseconds = ts.seconds * 1000;
                  if (ts.nanoseconds !== undefined && typeof ts.nanoseconds === 'number') {
                    return new Date(milliseconds + ts.nanoseconds / 1000000);
                  }
                  return new Date(milliseconds);
                }
                
                // Has _seconds property (alternative format)
                if (ts._seconds !== undefined && typeof ts._seconds === 'number') {
                  return new Date(ts._seconds * 1000);
                }
                
                // Try to reconstruct Timestamp if it looks like one
                // Sometimes Firestore Timestamps get serialized as {seconds: X, nanoseconds: Y}
                const keys = ts ? Object.keys(ts) : [];
                if (keys.includes('seconds') || keys.includes('_seconds')) {
                  const sec = ts.seconds || ts._seconds;
                  const nano = ts.nanoseconds || ts._nanoseconds || 0;
                  if (typeof sec === 'number') {
                    return new Date(sec * 1000 + (nano / 1000000));
                  }
                }
                
                // Timestamp could not be converted - return null
                return null;
              };
              
              createdAt = convertTimestamp(createdAt) || createdAt;
              updatedAt = convertTimestamp(updatedAt) || updatedAt;
              
              
              return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt,
              };
            }) as Order[];
          } catch (e: any) {
            console.error('Error fetching orders by userId:', e.message);
          }
        }
        
        // Also fetch by email to catch orders placed before login or as guest
        if (user.email) {
          try {
            const emailQuery = query(
              ordersRef,
              where('email', '==', user.email)
            );
            const emailSnapshot = await getDocs(emailQuery);
            const emailOrders = emailSnapshot.docs.map((doc) => {
              const data = doc.data();
              
              // Convert Firestore Timestamps to Date objects
              let createdAt = data.createdAt;
              let updatedAt = data.updatedAt;
              
              // Helper function to convert timestamp
              const convertTimestamp = (ts: any): Date | null => {
                if (!ts) return null;
                
                // Already a Date
                if (ts instanceof Date) {
                  return isNaN(ts.getTime()) ? null : ts;
                }
                
                // Firestore Timestamp instance
                if (ts instanceof Timestamp) {
                  return ts.toDate();
                }
                
                // Has toDate method
                if (ts && typeof ts.toDate === 'function') {
                  try {
                    return ts.toDate();
                  } catch (e) {
                    console.error('Error calling toDate():', e);
                  }
                }
                
                // Has seconds property
                if (ts.seconds !== undefined) {
                  const milliseconds = ts.seconds * 1000;
                  if (ts.nanoseconds) {
                    return new Date(milliseconds + ts.nanoseconds / 1000000);
                  }
                  return new Date(milliseconds);
                }
                
                // Has _seconds property
                if (ts._seconds !== undefined) {
                  return new Date(ts._seconds * 1000);
                }
                
                return null;
              };
              
              createdAt = convertTimestamp(createdAt) || createdAt;
              updatedAt = convertTimestamp(updatedAt) || updatedAt;
              
              return {
                id: doc.id,
                ...data,
                createdAt,
                updatedAt,
              };
            }) as Order[];
            
            // Merge and deduplicate
            const existingIds = new Set(ordersData.map(o => o.id));
            for (const order of emailOrders) {
              if (!existingIds.has(order.id)) {
                ordersData.push(order);
              }
            }
          } catch {
            // Email-based query may fail due to Firestore rules - this is expected
            // The userId query above is the primary method
          }
        }
        
        // Sort by date client-side
        ordersData.sort((a, b) => {
          const getTime = (ts: any): number => {
            if (!ts) return 0;
            if (ts instanceof Date) return ts.getTime() || 0;
            if (ts?.seconds) return ts.seconds * 1000;
            if (typeof ts === 'string') return new Date(ts).getTime() || 0;
            return 0;
          };
          return getTime(b.createdAt) - getTime(a.createdAt);
        });
        
        setOrders(ordersData);
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    }

    if (user) {
      fetchOrders();
    }
  }, [user]);
  
  // Helper to convert Firestore Timestamp or Date to Date object
  const toDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    
    // Firestore Timestamp instance (from firebase/firestore)
    if (timestamp instanceof Timestamp) {
      try {
        return timestamp.toDate();
      } catch {
        return null;
      }
    }
    
    // Firestore Timestamp with toDate() method (from Admin SDK or other formats)
    if (timestamp && typeof timestamp.toDate === 'function') {
      try {
        const date = timestamp.toDate();
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }
    
    // Already a Date object
    if (timestamp instanceof Date) {
      return isNaN(timestamp.getTime()) ? null : timestamp;
    }
    
    // Firestore Timestamp with seconds property
    if (timestamp?.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }
    
    // Firestore Timestamp with _seconds property (alternative format)
    if (timestamp?._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000);
    }
    
    // String date
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Number (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
    
    return null;
  };
  
  // Format date safely
  const formatDate = (timestamp: any, fallback: string = 'Recently'): string => {
    const date = toDate(timestamp);
    if (date) {
      return date.toLocaleDateString();
    }
    return fallback;
  };
  
  // Handle profile save
  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    
    const result = await updateProfile({
      displayName: profileForm.displayName || null,
      phoneNumber: profileForm.phoneNumber || null,
    });
    
    if (result.success) {
      setSaveSuccess('Profile updated successfully');
      setIsEditingProfile(false);
      await refreshProfile();
    } else {
      setSaveError(result.error || 'Failed to save profile');
    }
    
    setIsSaving(false);
    
    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(null), 3000);
  };
  
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
      setLocationZone(resolved);
      
      // Save to profile
      const result = await updateProfile({
        defaultLocationZone: resolved,
      });
      
      if (result.success) {
        setSaveSuccess('Default address updated');
        setIsEditingAddress(false);
        setAddressInput('');
      } else {
        setAddressError(result.error || 'Failed to save address');
      }
    } catch (err: any) {
      setAddressError(err.message || 'Failed to resolve address');
    } finally {
      setIsResolvingAddress(false);
    }
    
    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(null), 3000);
  };
  
  // Handle geolocation
  const handleUseMyLocation = async () => {
    setIsResolvingAddress(true);
    setAddressError(null);
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      
      const { latitude, longitude } = position.coords;
      const resolved = await resolveLocation({ lat: latitude, lng: longitude });
      setLocationZone({ ...resolved, source: 'geolocation' });
      
      // Save to profile
      const result = await updateProfile({
        defaultLocationZone: { ...resolved, source: 'geolocation' },
      });
      
      if (result.success) {
        setSaveSuccess('Default address updated');
        setIsEditingAddress(false);
      } else {
        setAddressError(result.error || 'Failed to save address');
      }
    } catch (err: any) {
      setAddressError('Could not get your location. Please enter an address manually.');
    } finally {
      setIsResolvingAddress(false);
    }
    
    // Clear success message after 3 seconds
    setTimeout(() => setSaveSuccess(null), 3000);
  };
  
  // Handle fulfillment preference change
  const handleFulfillmentChange = async (method: FulfillmentMethod | null) => {
    setDefaultFulfillment(method);
    
    const result = await updateProfile({
      defaultFulfillmentMethod: method,
    });
    
    if (!result.success) {
      console.error('Failed to save fulfillment preference:', result.error);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.push('/');
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
  
  // Not authenticated (should redirect)
  if (!isAuthenticated || !user) {
    return null;
  }
  
  const currentAddress = profile?.defaultLocationZone || locationZone;
  const isLocalDelivery = currentAddress?.zone === 'local';
  
  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl lg:text-4xl font-display mb-2">My Profile</h1>
            <p className="text-muted">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-surface-3 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
        
        {/* Success/Error Messages */}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{saveSuccess}</p>
          </div>
        )}
        
        {saveError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{saveError}</p>
          </div>
        )}
        
        <div className="space-y-8">
          {/* Personal Information Section */}
          <section className="bg-surface-2 border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-3/50">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-bmr-night" />
                <h2 className="font-display text-lg">Personal Information</h2>
              </div>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className="flex items-center gap-1 text-sm text-bmr-night hover:underline"
              >
                <Edit2 className="w-4 h-4" />
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </button>
            </div>
            
            <div className="p-6">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.displayName}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))}
                      placeholder="Your name"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <input
                      type="email"
                      value={user.email || ''}
                      disabled
                      className="w-full px-4 py-3 border border-border rounded-lg bg-surface-3 text-muted cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-muted">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                    />
                  </div>
                  
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="px-6 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted mb-1">Full Name</p>
                    <p className="font-medium">{profile?.displayName || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Phone Number</p>
                    <p className="font-medium">{profile?.phoneNumber || 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted mb-1">Account Created</p>
                    <p className="font-medium">
                      {formatDate(profile?.createdAt) !== 'Recently'
                        ? formatDate(profile?.createdAt)
                        : user?.metadata?.creationTime 
                          ? formatDate(user.metadata.creationTime)
                          : 'Recently'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
          
          {/* Default Delivery Address Section */}
          <section id="address" className="bg-surface-2 border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-3/50">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-bmr-night" />
                <h2 className="font-display text-lg">Default Delivery Address</h2>
              </div>
              <button
                onClick={() => setIsEditingAddress(!isEditingAddress)}
                className="flex items-center gap-1 text-sm text-bmr-night hover:underline"
              >
                <Edit2 className="w-4 h-4" />
                {isEditingAddress ? 'Cancel' : 'Change'}
              </button>
            </div>
            
            <div className="p-6">
              {isEditingAddress ? (
                <div className="space-y-4">
                  {/* Geolocation Button */}
                  <button
                    onClick={handleUseMyLocation}
                    disabled={isResolvingAddress}
                    className="w-full px-4 py-3 border border-bmr-night text-bmr-night rounded-lg font-medium hover:bg-bmr-night/5 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {isResolvingAddress ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <LocateFixed className="w-5 h-5" />
                    )}
                    Use My Current Location
                  </button>
                  
                  <div className="relative flex items-center gap-4">
                    <div className="flex-1 h-px bg-border"></div>
                    <span className="text-sm text-muted">or enter address</span>
                    <div className="flex-1 h-px bg-border"></div>
                  </div>
                  
                  <div>
                    <input
                      type="text"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                      placeholder="Enter address or ZIP code"
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-night"
                    />
                  </div>
                  
                  {addressError && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {addressError}
                    </p>
                  )}
                  
                  <button
                    onClick={handleResolveAddress}
                    disabled={isResolvingAddress}
                    className="px-6 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    {isResolvingAddress && <Loader2 className="w-4 h-4 animate-spin" />}
                    Set Address
                  </button>
                </div>
              ) : (
                <div>
                  {currentAddress ? (
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium">{currentAddress.formattedAddress}</p>
                        <p className="text-sm text-muted mt-1">
                          {currentAddress.distanceMiles.toFixed(1)} miles from store
                        </p>
                      </div>
                      
                      {/* Zone Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
                        isLocalDelivery 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isLocalDelivery ? (
                          <>
                            <Truck className="w-4 h-4" />
                            Within {LOCAL_DELIVERY_RADIUS_MILES} miles – Local delivery available (${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)})
                          </>
                        ) : (
                          <>
                            <Package className="w-4 h-4" />
                            Outside local delivery area – Shipping only
                          </>
                        )}
                      </div>
                      
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <MapPin className="w-12 h-12 text-muted mx-auto mb-3" />
                      <p className="text-muted mb-4">No default address set</p>
                      <button
                        onClick={() => setIsEditingAddress(true)}
                        className="px-6 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors"
                      >
                        Set Default Address
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>
          
          {/* Order History Section */}
          <section id="orders" className="bg-surface-2 border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-3/50">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-bmr-night" />
                <h2 className="font-display text-lg">Order History</h2>
              </div>
              {orders.length > 0 && (
                <span className="text-sm text-muted">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
              )}
            </div>
            
            <div className="p-6">
              {loadingOrders ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-muted mx-auto mb-3" />
                  <p className="text-muted mb-4">You haven't placed any orders yet.</p>
                  <a
                    href="/shop"
                    className="inline-block px-6 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors"
                  >
                    Start Shopping
                  </a>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderCard 
                      key={order.id} 
                      order={order} 
                      toDate={toDate}
                      userId={user?.uid || ''}
                      userDisplayName={profile?.displayName || user?.displayName || 'Customer'}
                      userPhotoURL={profile?.photoURL || user?.photoURL || undefined}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </Container>
  );
}

interface OrderCardProps {
  order: Order & { fulfillmentMethod?: string; labelUrl?: string; trackingNumber?: string; trackingUrl?: string; packingSlipUrl?: string };
  toDate: (ts: any) => Date | null;
  userId: string;
  userDisplayName: string;
  userPhotoURL?: string;
}

function OrderCard({ order, toDate, userId, userDisplayName, userPhotoURL }: OrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [reviewModalItem, setReviewModalItem] = useState<OrderItem | null>(null);
  const [existingReviews, setExistingReviews] = useState<Map<string, Review>>(new Map());
  const [loadingReviews, setLoadingReviews] = useState(false);
  
  const fulfillmentLabel = order.fulfillmentMethod === 'pickup' 
    ? 'Pickup' 
    : order.fulfillmentMethod === 'local_delivery' 
      ? 'Local Delivery' 
      : 'Shipping';

  // Fetch existing reviews for this order when expanded
  useEffect(() => {
    if (isExpanded && userId && existingReviews.size === 0 && !loadingReviews) {
      setLoadingReviews(true);
      fetch(`/api/reviews?userId=${userId}&orderId=${order.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.reviews) {
            const reviewMap = new Map<string, Review>();
            data.reviews.forEach((review: Review) => {
              reviewMap.set(review.orderItemId, review);
            });
            setExistingReviews(reviewMap);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingReviews(false));
    }
  }, [isExpanded, userId, order.id, existingReviews.size, loadingReviews]);

  const handleSubmitReview = async (item: OrderItem, data: { rating: number; title: string; body: string }) => {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: item.productId,
        productSlug: '', // Will be filled by backend if needed
        productTitle: item.title,
        orderId: order.id,
        orderItemId: item.id || `${order.id}-${item.variantId}`,
        userId,
        userDisplayName,
        userPhotoURL,
        rating: data.rating,
        title: data.title,
        body: data.body,
        size: item.size || null,
        color: item.color || null,
      }),
    });

    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to submit review');
    }

    // Update local state
    setExistingReviews(prev => {
      const newMap = new Map(prev);
      newMap.set(item.id || `${order.id}-${item.variantId}`, {
        id: result.reviewId,
        productId: item.productId,
        productSlug: '',
        productTitle: item.title,
        orderId: order.id,
        orderItemId: item.id || `${order.id}-${item.variantId}`,
        userId,
        userDisplayName,
        rating: data.rating,
        title: data.title,
        body: data.body,
        approved: true,
        createdAt: new Date(),
      });
      return newMap;
    });
  };
  
  // Format order date with better error handling
  const formatOrderDate = (): string => {
    // Try direct conversion first (if already a Date)
    if (order.createdAt instanceof Date && !isNaN(order.createdAt.getTime())) {
      return order.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Use toDate function
    const date = toDate(order.createdAt);
    if (date && !isNaN(date.getTime())) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Check paidAt as fallback (Stripe webhook orders may have this)
    if ((order as any).paidAt) {
      const paidDate = toDate((order as any).paidAt);
      if (paidDate && !isNaN(paidDate.getTime())) {
        return paidDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
    }
    
    // Fallback: Return "Recently" for orders with missing dates
    // This is better UX than showing "Unknown date"
    return 'Recently';
  };
  
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Order Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-4 flex items-center justify-between hover:bg-surface-3/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm text-muted">{formatOrderDate()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-medium">{formatPrice(order.total, 'USD')}</p>
            <p className="text-sm text-muted capitalize">{order.status?.toLowerCase() || 'pending'}</p>
          </div>
          <ChevronRight className={`w-5 h-5 text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
        </div>
      </button>
      
      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-border pt-4">
          {/* Fulfillment Method */}
          <div className="flex items-center gap-2 mb-4">
            {order.fulfillmentMethod === 'pickup' ? (
              <Store className="w-4 h-4 text-muted" />
            ) : order.fulfillmentMethod === 'local_delivery' ? (
              <Truck className="w-4 h-4 text-muted" />
            ) : (
              <Package className="w-4 h-4 text-muted" />
            )}
            <span className="text-sm">{fulfillmentLabel}</span>
          </div>
          
          {/* Items */}
          <div className="space-y-3 mb-4">
            <p className="text-sm font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
            {order.items.map((item, idx) => {
              const itemKey = item.id || `${order.id}-${item.variantId}`;
              const existingReview = existingReviews.get(itemKey);
              
              return (
                <div key={idx} className="flex items-start gap-3 py-2">
                  {item.imageUrl && (
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-14 h-14 object-cover rounded border border-border"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' • '}
                      {item.color && `Color: ${item.color}`}
                      {(item.size || item.color) && ' • '}
                      Qty: {item.qty}
                    </p>
                    <p className="text-sm font-medium mt-1">{formatPrice(item.unitPrice * item.qty, 'USD')}</p>
                    
                    {/* Review Button */}
                    {order.status === 'PAID' || order.status === 'FULFILLED' ? (
                      existingReview ? (
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex text-yellow-400">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${star <= existingReview.rating ? 'fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted ml-1">Reviewed</span>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReviewModalItem(item);
                          }}
                          className="mt-2 flex items-center gap-1.5 text-xs text-bmr-night hover:underline"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Write a Review
                        </button>
                      )
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Review Modal */}
          {reviewModalItem && (
            <ReviewModal
              isOpen={!!reviewModalItem}
              onClose={() => setReviewModalItem(null)}
              onSubmit={(data) => handleSubmitReview(reviewModalItem, data)}
              productTitle={reviewModalItem.title}
              productImage={reviewModalItem.imageUrl}
            />
          )}
          
          {/* Shipping Address */}
          {order.shippingAddress && order.fulfillmentMethod !== 'pickup' && (
            <div className="mb-4 p-3 bg-surface-3/50 rounded-lg">
              <p className="text-xs text-muted mb-1">Delivery Address</p>
              <p className="text-sm">
                {order.shippingAddress.fullName}<br />
                {order.shippingAddress.address}<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
              </p>
            </div>
          )}
          
          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-600 mb-1">Tracking Number</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono">{order.trackingNumber}</p>
                {order.trackingUrl && (
                  <a 
                    href={order.trackingUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          )}
          
          {/* Action Links */}
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href={`/order-confirmation/${order.id}`}
              className="text-sm text-bmr-night hover:underline flex items-center gap-1"
            >
              View Details
              <ChevronRight className="w-4 h-4" />
            </a>
            
            {order.labelUrl && (
              <a
                href={order.labelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-bmr-night hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Shipping Label
              </a>
            )}
            
            {order.packingSlipUrl && (
              <a
                href={order.packingSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-bmr-night hover:underline flex items-center gap-1"
              >
                <FileText className="w-4 h-4" />
                Packing Slip
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

