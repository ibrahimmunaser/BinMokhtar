'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, Package, AlertCircle, CheckCircle, RefreshCw, ExternalLink, Printer, LogOut, Download } from 'lucide-react';
import type { Order } from '@/types';
import * as XLSX from 'xlsx';

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

  // Debug logging for label detection
  useEffect(() => {
    if (order) {
      const fulfillmentMethod = order.fulfillmentMethod || 'shipping';
      const orderAny = order as any;
      const shippingLabelUrl = 
        order.shippo_label_url || 
        order.labelUrl || 
        orderAny.shippoLabelUrl || 
        orderAny.label_url ||
        orderAny.labelURL ||
        orderAny.shippo_label_url;
      const hasShippingLabel = !!shippingLabelUrl;
      const hasInternalLabel = !!(order.internal_label_url || order.packingSlipUrl || orderAny.packing_slip_url);
      const labelStatus = order.shippo_label_status === 'failed' 
        ? 'failed' 
        : (hasShippingLabel || hasInternalLabel ? 'success' : 'none');
      
      console.log('🔍 Order Label Debug:');
      console.log('  - orderId:', order.id);
      console.log('  - fulfillmentMethod:', fulfillmentMethod);
      console.log('  - labelStatus:', labelStatus);
      console.log('  - hasShippingLabel:', hasShippingLabel);
      console.log('  - hasInternalLabel:', hasInternalLabel);
      console.log('  - shippingLabelUrl:', shippingLabelUrl);
      console.log('  - shippo_label_url:', order.shippo_label_url);
      console.log('  - labelUrl:', order.labelUrl);
      console.log('  - shippoLabelUrl:', orderAny.shippoLabelUrl);
      console.log('  - label_url:', orderAny.label_url);
      console.log('  - labelURL:', orderAny.labelURL);
      console.log('  - shippo_label_status:', order.shippo_label_status);
      console.log('  - hasShippingAddress:', !!order.shippingAddress);
      const labelKeys = Object.keys(order).filter(k => k.toLowerCase().includes('label') || k.toLowerCase().includes('url'));
      console.log('  - allOrderKeys with label/url:', labelKeys);
      labelKeys.forEach(key => {
        console.log(`    - ${key}:`, (order as any)[key]);
      });
    }
  }, [order]);

  async function loadOrder() {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load order');
      }
      
      // Log what we received from the API
      console.log('📥 Order loaded from API:');
      console.log('  - orderId:', result.order.id);
      console.log('  - shippo_label_url:', result.order.shippo_label_url);
      console.log('  - labelUrl:', result.order.labelUrl);
      console.log('  - shippo_label_status:', result.order.shippo_label_status);
      console.log('  - shippo_tracking_number:', result.order.shippo_tracking_number);
      const labelFields = Object.keys(result.order).filter(k => 
        k.toLowerCase().includes('label') || k.toLowerCase().includes('url')
      );
      console.log('  - allLabelFields:', labelFields);
      labelFields.forEach(field => {
        console.log(`    - ${field}:`, result.order[field]);
      });
      
      // Convert ISO strings back to Date objects for display
      const orderData: OrderWithId = {
        ...result.order,
        createdAt: result.order.createdAt ? new Date(result.order.createdAt) : null,
        updatedAt: result.order.updatedAt ? new Date(result.order.updatedAt) : null,
        paidAt: result.order.paidAt ? new Date(result.order.paidAt) : null,
      };
      
      setOrder(orderData);
      
      // Log after state update
      setTimeout(() => {
        console.log('✅ Order state updated');
      }, 100);
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
      console.log('🚀 Starting label creation for order:', orderId);
      const response = await fetch(`/api/admin/orders/${orderId}/retry-label`, {
        method: 'POST',
      });
      
      const result = await response.json();
      console.log('📦 Label creation API response:', JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('✅ Label created successfully!');
        console.log('  - labelUrl:', result.labelUrl);
        console.log('  - trackingNumber:', result.trackingNumber);
        console.log('  - internalLabelUrl:', result.internalLabelUrl);
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reload order to see updated status
        console.log('🔄 Reloading order...');
        await loadOrder();
        
        // Check if label was loaded
        setTimeout(() => {
          const updatedOrder = order; // This will be stale, but we'll check after reload
          console.log('🔍 After reload - checking if label is visible...');
        }, 500);
        
        alert('Label created successfully! The page will refresh to show the label.');
      } else {
        const errorMsg = result.error || 'Unknown error';
        console.error('❌ Label creation failed:', errorMsg);
        alert(`Failed to create label: ${errorMsg}\n\nPlease check:\n1. Order has complete shipping address\n2. Products have weight information\n3. Shippo API key is configured`);
      }
    } catch (error: any) {
      console.error('❌ Error creating label:', error);
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

  function exportOrderToExcel() {
    if (!order) return;

    // Create comprehensive order export data
    const orderInfo = {
      'Order Number': order.orderNumber || order.id.slice(-8).toUpperCase(),
      'Order ID': order.id,
      'Order Status': order.status,
      'Payment Status': order.paymentStatus || 'N/A',
      'Created At': formatDate(order.createdAt),
      'Updated At': formatDate(order.updatedAt),
      'Paid At': formatDate(order.paidAt),
    };

    const customerInfo = {
      'Customer Name': order.customerName || 'N/A',
      'Customer Email': order.email,
      'Phone': order.phone || 'N/A',
    };

    const shippingInfo = order.shippingAddress ? {
      'Shipping - Full Name': order.shippingAddress.fullName || 'N/A',
      'Shipping - Address Line 1': order.shippingAddress.address || 'N/A',
      'Shipping - Address Line 2': order.shippingAddress.address2 || '',
      'Shipping - City': order.shippingAddress.city || 'N/A',
      'Shipping - State': order.shippingAddress.state || 'N/A',
      'Shipping - ZIP': order.shippingAddress.zip || 'N/A',
      'Shipping - Country': order.shippingAddress.country || 'N/A',
    } : {
      'Shipping - Full Name': 'N/A',
      'Shipping - Address Line 1': 'N/A',
      'Shipping - Address Line 2': '',
      'Shipping - City': 'N/A',
      'Shipping - State': 'N/A',
      'Shipping - ZIP': 'N/A',
      'Shipping - Country': 'N/A',
    };

    const fulfillmentInfo = {
      'Fulfillment Method': getFulfillmentMethodLabel(order.fulfillmentMethod),
      'Shippo Label Status': order.shippo_label_status || 'none',
      'Has Shippo Label': order.shippo_label_url ? 'Yes' : 'No',
      'Shippo Label URL': order.shippo_label_url || 'N/A',
      'Shippo Tracking Number': order.shippo_tracking_number || 'N/A',
      'Shippo Tracking URL': order.shippo_tracking_url || 'N/A',
      'Has Internal Label': order.internal_label_url ? 'Yes' : 'No',
      'Internal Label URL': order.internal_label_url || 'N/A',
      'Shippo Error': order.shippo_error_message || 'N/A',
      'Total Weight (grams)': order.total_weight_grams || 'N/A',
    };

    const financialInfo = {
      'Subtotal': formatPrice(order.subtotal || 0),
      'Shipping Cost': formatPrice(order.shipping || 0),
      'Tax': formatPrice(order.tax || 0),
      'Total': formatPrice(order.total),
    };

    // Create Order Summary Sheet
    const summaryData = [
      { 'Field': 'ORDER INFORMATION', 'Value': '' },
      ...Object.entries(orderInfo).map(([k, v]) => ({ 'Field': k, 'Value': v })),
      { 'Field': '', 'Value': '' },
      { 'Field': 'CUSTOMER INFORMATION', 'Value': '' },
      ...Object.entries(customerInfo).map(([k, v]) => ({ 'Field': k, 'Value': v })),
      { 'Field': '', 'Value': '' },
      { 'Field': 'SHIPPING INFORMATION', 'Value': '' },
      ...Object.entries(shippingInfo).map(([k, v]) => ({ 'Field': k, 'Value': v })),
      { 'Field': '', 'Value': '' },
      { 'Field': 'FULFILLMENT INFORMATION', 'Value': '' },
      ...Object.entries(fulfillmentInfo).map(([k, v]) => ({ 'Field': k, 'Value': v })),
      { 'Field': '', 'Value': '' },
      { 'Field': 'FINANCIAL INFORMATION', 'Value': '' },
      ...Object.entries(financialInfo).map(([k, v]) => ({ 'Field': k, 'Value': v })),
    ];

    // Create Items Sheet
    const itemsData = order.items.map(item => ({
      'Item Name': item.title || item.name || 'N/A',
      'SKU': item.sku || 'N/A',
      'Size': item.size || 'N/A',
      'Color': item.color || 'N/A',
      'Quantity': item.qty,
      'Unit Price': formatPrice(item.unitPrice),
      'Total Price': formatPrice(item.unitPrice * item.qty),
      'Image URL': item.imageUrl || 'N/A',
    }));

    // Create workbook with multiple sheets
    const wb = XLSX.utils.book_new();

    // Add Summary Sheet
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [
      { wch: 30 }, // Field column
      { wch: 50 }, // Value column
    ];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Order Summary');

    // Add Items Sheet
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    wsItems['!cols'] = [
      { wch: 40 }, // Item Name
      { wch: 20 }, // SKU
      { wch: 12 }, // Size
      { wch: 15 }, // Color
      { wch: 10 }, // Quantity
      { wch: 12 }, // Unit Price
      { wch: 12 }, // Total Price
      { wch: 50 }, // Image URL
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Order Items');

    // Generate filename
    const orderNum = order.orderNumber || order.id.slice(-8).toUpperCase();
    const filename = `Order_${orderNum}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);

    console.log(`✅ Exported order ${orderNum} to ${filename}`);
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
  // Check all possible variations of label URL fields (comprehensive check)
  const shippingLabelUrl = 
    order.shippo_label_url || 
    order.labelUrl || 
    orderAny.shippoLabelUrl || 
    orderAny.label_url ||
    orderAny.labelURL ||
    orderAny.shippo_label_url;
  
  const hasShippingLabel = !!shippingLabelUrl;
  const hasInternalLabel = !!(order.internal_label_url || order.packingSlipUrl || orderAny.packing_slip_url);
  // If we have a label URL, status should be success (unless explicitly set to failed)
  const labelStatus = order.shippo_label_status === 'failed' 
    ? 'failed' 
    : (hasShippingLabel || hasInternalLabel ? 'success' : 'none');

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
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-2 text-bmr-muted hover:text-bmr-ink transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <button
            onClick={exportOrderToExcel}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-bmr-night border border-bmr-night rounded hover:bg-opacity-90 transition-colors"
            title="Export this order to Excel"
          >
            <Download className="w-4 h-4" />
            Export to Excel
          </button>
        </div>

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

          {/* Show print button if label exists, regardless of status */}
          {fulfillmentMethod === 'shipping' && hasShippingLabel && shippingLabelUrl && (
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
                href={shippingLabelUrl}
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

          {/* Show tracking info if we have tracking number but no label URL (common in test mode) */}
          {fulfillmentMethod === 'shipping' && !hasShippingLabel && order.shippo_tracking_number && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-900">Shipment Created Successfully</span>
              </div>
              <p className="text-sm text-blue-700 mb-3">
                A shipping transaction was created. {!shippingLabelUrl && '(Label PDF not available in test mode)'}
              </p>
              <div className="mb-3 p-3 bg-blue-100 rounded">
                <span className="text-sm text-blue-700 font-medium">Tracking Number:</span>
                <span className="ml-2 font-mono text-blue-900">{order.shippo_tracking_number}</span>
              </div>
              {orderAny.trackingUrl && (
                <a
                  href={orderAny.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Track Package on USPS
                </a>
              )}
              <p className="text-xs text-blue-600 mt-3 italic">
                💡 To generate printable labels, switch to Shippo live mode in your environment settings.
              </p>
            </div>
          )}

          {labelStatus === 'success' && (
            <div className="space-y-4">
              {/* Internal labels for pickup/delivery */}
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

