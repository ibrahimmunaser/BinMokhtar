'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { useAuth } from '@/contexts/AuthContext';
import { useLocationStore, resolveLocation } from '@/store/location';
import { formatPrice } from '@/lib/utils';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
  LocateFixed
} from 'lucide-react';
import type { Order } from '@/types';
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
  
  // Fetch orders - query by userId first, then by email as fallback
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        const ordersRef = collection(db, 'orders');
        let ordersData: Order[] = [];
        
        // First, try to fetch by userId
        if (user.uid) {
          try {
            const userIdQuery = query(
              ordersRef,
              where('userId', '==', user.uid),
              orderBy('createdAt', 'desc')
            );
            const userIdSnapshot = await getDocs(userIdQuery);
            ordersData = userIdSnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Order[];
          } catch (e) {
            console.log('No orders found by userId, trying email...');
          }
        }
        
        // Also fetch by email to catch orders placed before login
        if (user.email) {
          const emailQuery = query(
            ordersRef,
            where('email', '==', user.email),
            orderBy('createdAt', 'desc')
          );
          const emailSnapshot = await getDocs(emailQuery);
          const emailOrders = emailSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Order[];
          
          // Merge and deduplicate
          const existingIds = new Set(ordersData.map(o => o.id));
          for (const order of emailOrders) {
            if (!existingIds.has(order.id)) {
              ordersData.push(order);
            }
          }
          
          // Sort by date
          ordersData.sort((a, b) => {
            const aDate = toDate(a.createdAt).getTime();
            const bDate = toDate(b.createdAt).getTime();
            return bDate - aDate;
          });
        }
        
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
  const toDate = (timestamp: any): Date => {
    if (timestamp instanceof Date) {
      return timestamp;
    }
    if (timestamp?.seconds) {
      return new Date(timestamp.seconds * 1000);
    }
    return new Date();
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
                      {profile?.createdAt ? toDate(profile.createdAt).toLocaleDateString() : 'Unknown'}
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
                      
                      {/* Default Fulfillment Preference */}
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-medium mb-3">Default Fulfillment Preference</p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleFulfillmentChange('pickup')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                              defaultFulfillment === 'pickup'
                                ? 'border-bmr-night bg-bmr-night/5 text-bmr-night'
                                : 'border-border hover:border-bmr-muted'
                            }`}
                          >
                            <Store className="w-4 h-4" />
                            Pickup
                          </button>
                          
                          <button
                            onClick={() => handleFulfillmentChange('local_delivery')}
                            disabled={!isLocalDelivery}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                              defaultFulfillment === 'local_delivery'
                                ? 'border-bmr-night bg-bmr-night/5 text-bmr-night'
                                : 'border-border hover:border-bmr-muted'
                            }`}
                          >
                            <Truck className="w-4 h-4" />
                            Local Delivery
                          </button>
                          
                          <button
                            onClick={() => handleFulfillmentChange('shipping')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                              defaultFulfillment === 'shipping'
                                ? 'border-bmr-night bg-bmr-night/5 text-bmr-night'
                                : 'border-border hover:border-bmr-muted'
                            }`}
                          >
                            <Package className="w-4 h-4" />
                            Shipping
                          </button>
                        </div>
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
                    <OrderCard key={order.id} order={order} toDate={toDate} />
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

function OrderCard({ order, toDate }: { order: Order & { fulfillmentMethod?: string; labelUrl?: string; trackingNumber?: string; trackingUrl?: string; packingSlipUrl?: string }; toDate: (ts: any) => Date }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fulfillmentLabel = order.fulfillmentMethod === 'pickup' 
    ? 'Pickup' 
    : order.fulfillmentMethod === 'local_delivery' 
      ? 'Local Delivery' 
      : 'Shipping';
  
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
            <p className="text-sm text-muted">{toDate(order.createdAt).toLocaleDateString()}</p>
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
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.imageUrl && (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-12 h-12 object-cover rounded border border-border"
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted">
                    {item.size && `Size: ${item.size}`}
                    {item.size && item.color && ' • '}
                    {item.color && `Color: ${item.color}`}
                    {(item.size || item.color) && ' • '}
                    Qty: {item.qty}
                  </p>
                </div>
                <p className="text-sm font-medium">{formatPrice(item.unitPrice * item.qty, 'USD')}</p>
              </div>
            ))}
          </div>
          
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

