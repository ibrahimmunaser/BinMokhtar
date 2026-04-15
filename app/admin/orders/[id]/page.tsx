'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, Package, CheckCircle, RefreshCw, ExternalLink, Printer, LogOut, Download } from 'lucide-react';
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

  async function loadOrder() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to load order');
      }

      const orderData: OrderWithId = {
        ...result.order,
        createdAt: result.order.createdAt ? new Date(result.order.createdAt) : null,
        updatedAt: result.order.updatedAt ? new Date(result.order.updatedAt) : null,
        paidAt: result.order.paidAt ? new Date(result.order.paidAt) : null,
      };

      setOrder(orderData);
    } catch (error: any) {
      console.error('Error loading order:', error);
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
        await loadOrder();
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

  async function regeneratePackingSlip() {
    if (!order) return;

    try {
      setRetrying(true);
      const response = await fetch(`/api/admin/orders/${orderId}/retry-label`, {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        await loadOrder();
        alert('Packing slip regenerated successfully!');
      } else {
        alert(`Failed to regenerate packing slip: ${result.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error regenerating packing slip:', error);
      alert(`Error: ${error.message || 'Failed to regenerate. Please try again.'}`);
    } finally {
      setRetrying(false);
    }
  }

  function formatDate(date: any) {
    if (!date) return 'N/A';
    if (date.toDate) return date.toDate().toLocaleString();
    if (date instanceof Date) return date.toLocaleString();
    return 'N/A';
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function getFulfillmentMethodLabel(method?: string) {
    switch (method) {
      case 'pickup': return 'Pickup';
      case 'local_delivery': return 'Local Delivery';
      case 'shipping': return 'Shipping';
      default: return 'Unknown';
    }
  }

  function exportOrderToExcel() {
    if (!order) return;

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
      'Has Packing Slip': order.packingSlipUrl ? 'Yes' : 'No',
      'Packing Slip URL': order.packingSlipUrl || 'N/A',
      'Total Weight (grams)': order.total_weight_grams || 'N/A',
    };

    const financialInfo = {
      'Subtotal': formatPrice(order.subtotal || 0),
      'Shipping Cost': formatPrice(order.shipping || 0),
      'Tax': formatPrice(order.tax || 0),
      'Total': formatPrice(order.total),
    };

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

    const itemsData = order.items.map(item => ({
      'Item Name': item.title || 'N/A',
      'SKU': item.sku || 'N/A',
      'Size': item.size || 'N/A',
      'Color': item.color || 'N/A',
      'Quantity': item.qty,
      'Unit Price': formatPrice(item.unitPrice),
      'Total Price': formatPrice(item.unitPrice * item.qty),
      'Image URL': item.imageUrl || 'N/A',
    }));

    const wb = XLSX.utils.book_new();

    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Order Summary');

    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    wsItems['!cols'] = [
      { wch: 40 }, { wch: 20 }, { wch: 12 }, { wch: 15 },
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 50 },
    ];
    XLSX.utils.book_append_sheet(wb, wsItems, 'Order Items');

    const orderNum = order.orderNumber || order.id.slice(-8).toUpperCase();
    XLSX.writeFile(wb, `Order_${orderNum}.xlsx`);
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
  const orderAny = order as any;
  const packingSlipUrl = order.packingSlipUrl || orderAny.packing_slip_url || orderAny.internal_label_url;

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
                <Link href="/admin" className="text-sm text-bmr-muted hover:text-bmr-ink">Dashboard</Link>
                <Link href="/admin/orders" className="text-sm font-medium text-bmr-ink">Orders</Link>
                <Link href="/admin/categories" className="text-sm text-bmr-muted hover:text-bmr-ink">Categories</Link>
                <Link href="/admin/settings" className="text-sm text-bmr-muted hover:text-bmr-ink">Settings</Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a href="/" target="_blank" className="text-sm text-bmr-muted hover:text-bmr-ink">View Store →</a>
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

        {/* Packing Slip */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-bmr-ink">Packing Slip</h2>
            <button
              onClick={regeneratePackingSlip}
              disabled={retrying}
              className="inline-flex items-center gap-2 px-4 py-2 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
              {retrying ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>

          {packingSlipUrl ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-900">Packing Slip Ready</span>
              </div>
              <a
                href={packingSlipUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Print Packing Slip
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-700">No packing slip yet. Click Regenerate to create one.</p>
            </div>
          )}
        </div>

        {/* Missing Address Warning for Shipping Orders */}
        {fulfillmentMethod === 'shipping' && !order.shippingAddress && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Missing Shipping Address</h3>
            <p className="text-sm text-yellow-700 mb-4">This order is missing a shipping address.</p>
            {order.stripeSessionId ? (
              <button
                onClick={retrieveAddressFromStripe}
                disabled={retrievingAddress}
                className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${retrievingAddress ? 'animate-spin' : ''}`} />
                {retrievingAddress ? 'Retrieving...' : 'Retrieve Address from Stripe'}
              </button>
            ) : (
              <p className="text-sm text-yellow-700">No Stripe session ID — address must be added manually.</p>
            )}
          </div>
        )}

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
                  <img src={item.imageUrl} alt={item.title} className="w-16 h-16 object-cover rounded" />
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
