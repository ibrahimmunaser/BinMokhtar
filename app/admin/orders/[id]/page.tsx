'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, Package, AlertCircle, CheckCircle, RefreshCw, ExternalLink, Printer, LogOut } from 'lucide-react';
import type { Order } from '@/types';

interface OrderWithId extends Order {
  id: string;
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [order, setOrder] = useState<OrderWithId | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retrievingAddress, setRetrievingAddress] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      loadOrder();
    }
  }, [router, orderId]);

  async function loadOrder() {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load order');
      }
      
      // Convert ISO strings back to Date objects for display
      const orderData: OrderWithId = {
        ...result.order,
        createdAt: result.order.createdAt ? new Date(result.order.createdAt) : null,
        updatedAt: result.order.updatedAt ? new Date(result.order.updatedAt) : null,
        paidAt: result.order.paidAt ? new Date(result.order.paidAt) : null,
      };
      
      setOrder(orderData);
    } catch (error: any) {
      console.error('Error loading order:', error);
      // Order will remain null, showing "Order not found" message
    } finally {
      setLoading(false);
    }
  }

  async function retrieveAddressFromStripe() {
    if (!order?.stripeSessionId) {
      alert('This order does not have a Stripe session ID. Cannot retrieve address from Stripe.');
      return;
    }

    try {
      setRetrievingAddress(true);
      const response = await fetch(`/api/admin/orders/${orderId}/retrieve-address`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        alert('Shipping address retrieved from Stripe and updated successfully!');
        await loadOrder(); // Reload order to see updated address
      } else {
        alert(`Failed to retrieve address: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error retrieving address:', error);
      alert(`Error: ${error.message || 'Failed to retrieve address. Please try again.'}`);
    } finally {
      setRetrievingAddress(false);
    }
  }

  async function retryLabelCreation() {
    if (!order) return;
    
    // Check if order has shipping address before attempting to create label
    if (fulfillmentMethod === 'shipping' && !order.shippingAddress) {
      alert('Cannot create shipping label: This order is missing a shipping address. Please check the order details.');
      return;
    }
    
    // Validate shipping address fields
    if (fulfillmentMethod === 'shipping' && order.shippingAddress) {
      const addr = order.shippingAddress;
      const missingFields = [];
      if (!addr.fullName) missingFields.push('Full Name');
      if (!addr.address) missingFields.push('Address');
      if (!addr.city) missingFields.push('City');
      if (!addr.state) missingFields.push('State');
      if (!addr.zip) missingFields.push('ZIP Code');
      if (!addr.country) missingFields.push('Country');
      
      if (missingFields.length > 0) {
        alert(`Cannot create shipping label: Missing required address fields:\n${missingFields.join(', ')}\n\nPlease update the order with complete shipping information.`);
        return;
      }
    }
    
    try {
      setRetrying(true);
      const response = await fetch(`/api/admin/orders/${orderId}/retry-label`, {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Label created successfully! The page will refresh to show the label.');
        await loadOrder(); // Reload order to see updated status
      } else {
        const errorMsg = result.error || 'Unknown error';
        alert(`Failed to create label: ${errorMsg}\n\nPlease check:\n1. Order has complete shipping address\n2. Products have weight information\n3. Shippo API key is configured`);
      }
    } catch (error: any) {
      console.error('Error creating label:', error);
      alert(`Error: ${error.message || 'Failed to create label. Please try again.'}`);
    } finally {
      setRetrying(false);
    }
  }

  function formatDate(date: any) {
    if (!date) return 'N/A';
    if (date.toDate) {
      return date.toDate().toLocaleString();
    }
    if (date instanceof Date) {
      return date.toLocaleString();
    }
    return 'N/A';
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getFulfillmentMethodLabel(method?: string) {
    switch (method) {
      case 'pickup':
        return 'Pickup';
      case 'local_delivery':
        return 'Local Delivery';
      case 'shipping':
        return 'Shipping';
      default:
        return 'Unknown';
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-surface-1">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-bmr-muted mx-auto mb-3" />
            <p className="text-bmr-muted">Order not found</p>
            <Link href="/admin/orders" className="mt-4 inline-block text-bmr-night hover:underline">
              Back to Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const fulfillmentMethod = order.fulfillmentMethod || 'shipping';
  // Check multiple possible field names for label URLs
  const orderAny = order as any;
  const hasShippingLabel = !!(order.shippo_label_url || order.labelUrl || orderAny.shippoLabelUrl || orderAny.label_url);
  const hasInternalLabel = !!(order.internal_label_url || order.packingSlipUrl || orderAny.packing_slip_url);
  const labelStatus = order.shippo_label_status || (hasShippingLabel || hasInternalLabel ? 'success' : 'none');
  
  // Get the actual label URL from any possible field
  const shippingLabelUrl = order.shippo_label_url || order.labelUrl || orderAny.shippoLabelUrl || orderAny.label_url;
  
  // Debug logging for label detection
  useEffect(() => {
    if (order) {
      console.log('🔍 Order Label Debug:', {
        orderId: order.id,
        fulfillmentMethod,
        labelStatus,
        hasShippingLabel,
        hasInternalLabel,
        shippingLabelUrl,
        shippo_label_url: order.shippo_label_url,
        labelUrl: order.labelUrl,
        shippoLabelUrl: orderAny.shippoLabelUrl,
        label_url: orderAny.label_url,
        shippo_label_status: order.shippo_label_status,
        hasShippingAddress: !!order.shippingAddress,
      });
    }
  }, [order, fulfillmentMethod, labelStatus, hasShippingLabel, hasInternalLabel, shippingLabelUrl]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="bg-surface-2 border-b border-line sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="font-display text-2xl">BMR Admin</h1>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/admin" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Dashboard
                </Link>
                <Link href="/admin/orders" className="text-sm font-medium text-bmr-ink">
                  Orders
                </Link>
                <Link href="/admin/categories" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Categories
                </Link>
                <Link href="/admin/settings" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" target="_blank" className="text-sm text-bmr-muted hover:text-bmr-ink">
                View Store →
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-bmr-muted hover:text-bmr-acc-red"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 text-bmr-muted hover:text-bmr-ink mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-bmr-ink mb-2">
            Order {order.orderNumber || order.id.slice(-8).toUpperCase()}
          </h1>
          <p className="text-bmr-muted">Created {formatDate(order.createdAt)}</p>
        </div>

        {/* Order Status */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bmr-ink">Order Status</h2>
            <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
              order.status === 'PAID' ? 'bg-green-100 text-green-800' :
              order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {order.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-bmr-muted">Fulfillment:</span>
              <span className="ml-2 font-medium">{getFulfillmentMethodLabel(fulfillmentMethod)}</span>
            </div>
            {order.total_weight_grams && (
              <div>
                <span className="text-bmr-muted">Weight:</span>
                <span className="ml-2 font-medium">{order.total_weight_grams}g</span>
              </div>
            )}
          </div>
        </div>

        {/* Label Status */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-bmr-ink">
                {fulfillmentMethod === 'shipping' ? 'Shipping Label (Shippo)' : 'Fulfillment Label'}
              </h2>
              <p className="text-xs text-bmr-muted mt-1">
                {fulfillmentMethod === 'shipping' 
                  ? 'Carrier shipping label via Shippo' 
                  : fulfillmentMethod === 'pickup'
                  ? 'Internal label for pickup orders'
                  : 'Internal label for local delivery orders'}
              </p>
            </div>
            {labelStatus === 'failed' && fulfillmentMethod === 'shipping' && (
              <button
                onClick={retryLabelCreation}
                disabled={retrying}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Retrying...' : 'Retry Shippo Label'}
              </button>
            )}
            {labelStatus === 'none' && fulfillmentMethod === 'shipping' && (
              <button
                onClick={retryLabelCreation}
                disabled={retrying}
                className="inline-flex items-center gap-2 px-4 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Creating...' : 'Create Shippo Label'}
              </button>
            )}
          </div>

          {labelStatus === 'success' && (
            <div className="space-y-4">
              {fulfillmentMethod === 'shipping' && hasShippingLabel && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">Shippo Carrier Label Ready</span>
                  </div>
                  <p className="text-sm text-green-700 mb-3">This is a carrier shipping label from Shippo for shipping via USPS/UPS.</p>
                  {order.shippo_tracking_number && (
                    <div className="mb-3">
                      <span className="text-sm text-green-700">Tracking Number:</span>
                      <span className="ml-2 font-medium">{order.shippo_tracking_number}</span>
                    </div>
                  )}
                  <a
                    href={shippingLabelUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Shippo Label
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
              {(fulfillmentMethod === 'pickup' || fulfillmentMethod === 'local_delivery') && hasInternalLabel && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Internal Label Ready</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-3">
                    {fulfillmentMethod === 'pickup' 
                      ? 'This is an internal label for pickup orders. Shippo labels are not used for pickup.'
                      : 'This is an internal label for local delivery orders. Shippo labels are not used for local delivery.'}
                  </p>
                  <a
                    href={order.internal_label_url || order.packingSlipUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print Internal Label
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          )}

          {labelStatus === 'failed' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-900">Label Creation Failed</span>
              </div>
              {order.shippo_error_message && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-red-900 mb-1">Error Details:</p>
                  <p className="text-sm text-red-700">{order.shippo_error_message}</p>
                </div>
              )}
              {!order.shippingAddress && fulfillmentMethod === 'shipping' && (
                <div className="mb-3 p-4 bg-red-100 border-2 border-red-400 rounded-lg">
                  <p className="text-sm font-bold text-red-900 mb-2">⚠️ Missing Shipping Address</p>
                  <p className="text-sm text-red-700 mb-4">This order does not have a shipping address. Shippo labels require a complete address with name, street, city, state, ZIP code, and country.</p>
                  {order.stripeSessionId ? (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-2">🔧 Solution: Retrieve Address from Stripe</p>
                      <p className="text-sm text-red-700 mb-3">This order was paid through Stripe. Click the button below to retrieve the shipping address that was collected during checkout.</p>
                      <button
                        onClick={retrieveAddressFromStripe}
                        disabled={retrievingAddress}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                      >
                        <RefreshCw className={`w-5 h-5 ${retrievingAddress ? 'animate-spin' : ''}`} />
                        {retrievingAddress ? 'Retrieving Address...' : '🔍 Retrieve Address from Stripe'}
                      </button>
                      <p className="text-xs text-red-600 mt-2 italic">After retrieving the address, click "Retry Shippo Label" to create the label.</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-red-900 mb-2">⚠️ Cannot Auto-Retrieve</p>
                      <p className="text-sm text-red-700">This order does not have a Stripe session ID, so the address cannot be automatically retrieved from Stripe.</p>
                      <p className="text-sm text-red-700 mt-2">You will need to manually add the shipping address to this order in Firestore, or contact the customer for their shipping address.</p>
                    </div>
                  )}
                </div>
              )}
              {order.shippingAddress && fulfillmentMethod === 'shipping' && (
                <div className="mb-3">
                  <p className="text-sm text-red-700">Common issues:</p>
                  <ul className="text-sm text-red-700 list-disc list-inside mt-1 space-y-1">
                    <li>Missing or incomplete shipping address fields</li>
                    <li>Order weight not calculated (products missing weight)</li>
                    <li>Shippo API configuration issue</li>
                    <li>Invalid shipping address format</li>
                  </ul>
                </div>
              )}
              {order.shippingAddress ? (
                <p className="text-sm text-red-700 mt-3">Click "Retry Shippo Label" above to attempt label creation again after fixing the issue.</p>
              ) : (
                <p className="text-sm text-red-700 mt-3">⚠️ First retrieve the shipping address using the button above, then click "Retry Shippo Label" to create the label.</p>
              )}
            </div>
          )}

          {labelStatus === 'none' && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              {fulfillmentMethod === 'shipping' && (
                <>
                  {!order.shippingAddress ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-red-100 border-2 border-red-400 rounded-lg">
                        <p className="text-sm font-bold text-red-900 mb-2">⚠️ Missing Shipping Address</p>
                        <p className="text-sm text-red-700 mb-3">This order does not have a shipping address. A shipping address is required to create a Shippo carrier label.</p>
                        {order.stripeSessionId ? (
                          <div>
                            <p className="text-sm font-medium text-red-900 mb-2">🔧 Solution: Retrieve Address from Stripe</p>
                            <p className="text-sm text-red-700 mb-3">This order was paid through Stripe. Click the button below to retrieve the shipping address that was collected during checkout.</p>
                            <button
                              onClick={retrieveAddressFromStripe}
                              disabled={retrievingAddress}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            >
                              <RefreshCw className={`w-5 h-5 ${retrievingAddress ? 'animate-spin' : ''}`} />
                              {retrievingAddress ? 'Retrieving Address...' : '🔍 Retrieve Address from Stripe'}
                            </button>
                            <p className="text-xs text-red-600 mt-2 italic">After retrieving the address, click "Create Shippo Label" to create the label.</p>
                          </div>
                        ) : (
                          <p className="text-sm text-red-600 italic">Note: This order does not have a Stripe session ID, so the address cannot be automatically retrieved. You may need to manually add the shipping address.</p>
                        )}
                      </div>
                      {/* Always show Create Label button, even without address */}
                      <div className="flex items-center justify-center">
                        <button
                          onClick={retryLabelCreation}
                          disabled={retrying || !order.shippingAddress}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-bmr-night text-surface-2 rounded-lg font-semibold hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                          <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
                          {retrying ? 'Creating...' : 'Create Shippo Label'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900 mb-1">📦 Ready to Create Shippo Label</p>
                          <p className="text-sm text-blue-700">
                            This order has a complete shipping address. Click the button to generate a carrier shipping label via Shippo (USPS/UPS).
                          </p>
                        </div>
                        <button
                          onClick={retryLabelCreation}
                          disabled={retrying}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md whitespace-nowrap"
                        >
                          <RefreshCw className={`w-5 h-5 ${retrying ? 'animate-spin' : ''}`} />
                          {retrying ? 'Creating...' : 'Create Shippo Label'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
              {(fulfillmentMethod === 'pickup' || fulfillmentMethod === 'local_delivery') && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm font-medium text-yellow-900 mb-1">ℹ️ Note: Shippo Labels Not Used</p>
                  <p className="text-sm text-yellow-700">
                    {fulfillmentMethod === 'pickup' 
                      ? 'This is a pickup order. Shippo carrier labels are only for shipping orders. An internal label will be created automatically for pickup orders.'
                      : 'This is a local delivery order. Shippo carrier labels are only for shipping orders. An internal label will be created automatically for local delivery orders.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <h2 className="text-lg font-semibold text-bmr-ink mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-bmr-muted">Name:</span>
              <span className="ml-2 font-medium">{order.customerName || 'N/A'}</span>
            </div>
            <div>
              <span className="text-bmr-muted">Email:</span>
              <span className="ml-2 font-medium">{order.email}</span>
            </div>
            {order.phone && (
              <div>
                <span className="text-bmr-muted">Phone:</span>
                <span className="ml-2 font-medium">{order.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
            <h2 className="text-lg font-semibold text-bmr-ink mb-4">Shipping Address</h2>
            <div className="text-sm">
              <div className="font-medium">{order.shippingAddress.fullName}</div>
              <div className="text-bmr-muted mt-1">
                {order.shippingAddress.address}
                {order.shippingAddress.address2 && <><br />{order.shippingAddress.address2}</>}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                <br />
                {order.shippingAddress.country}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <h2 className="text-lg font-semibold text-bmr-ink mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={item.id || index} className="flex items-start gap-4 pb-4 border-b border-line last:border-0">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <div className="font-medium text-bmr-ink">{item.title}</div>
                  <div className="text-sm text-bmr-muted mt-1">
                    SKU: {item.sku}
                    {item.size && ` | Size: ${item.size}`}
                    {item.color && ` | Color: ${item.color}`}
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="text-bmr-muted">Qty:</span>
                    <span className="ml-2 font-medium">{item.qty}</span>
                    <span className="ml-4 text-bmr-muted">Price:</span>
                    <span className="ml-2 font-medium">{formatPrice(item.unitPrice * item.qty)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals */}
        <div className="bg-surface-2 rounded-lg border border-line p-6">
          <h2 className="text-lg font-semibold text-bmr-ink mb-4">Order Totals</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-bmr-muted">Subtotal:</span>
              <span className="font-medium">{formatPrice(order.subtotal)}</span>
            </div>
            {order.shipping > 0 && (
              <div className="flex justify-between">
                <span className="text-bmr-muted">Shipping:</span>
                <span className="font-medium">{formatPrice(order.shipping)}</span>
              </div>
            )}
            {order.tax > 0 && (
              <div className="flex justify-between">
                <span className="text-bmr-muted">Tax:</span>
                <span className="font-medium">{formatPrice(order.tax)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-line mt-2">
              <span className="font-semibold text-bmr-ink">Total:</span>
              <span className="font-bold text-lg">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

