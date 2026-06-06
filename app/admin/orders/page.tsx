'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import Link from 'next/link';
import { Package, AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, LogOut, Download } from 'lucide-react';
import { clearAdminSession } from '@/lib/adminAuth';
import type { Order } from '@/types';
import * as XLSX from 'xlsx';

interface OrderWithId extends Order {
  id: string;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Effect to check DOM after orders are loaded
  useEffect(() => {
    try {
      const authResult = isAdminAuthenticated();
      if (!authResult) {
        router.push('/admin/login');
        return;
      }
      setIsAuthenticated(true);
      loadOrders();
    } catch (err: any) {
      console.error('Admin auth error:', err);
    }
  }, [router]);

  async function loadOrders() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/orders', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      });

      const text = await response.text();
      const result = JSON.parse(text);

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }
      if (!result.success || !Array.isArray(result.orders)) {
        throw new Error(result.error || 'Invalid response format');
      }

      const ordersData: OrderWithId[] = result.orders.map((order: any) => ({
        ...order,
        createdAt: order.createdAt ? new Date(order.createdAt) : null,
        updatedAt: order.updatedAt ? new Date(order.updatedAt) : null,
        paidAt: order.paidAt ? new Date(order.paidAt) : null,
      }));

      setOrders(ordersData);
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      setError(error?.message || 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function getLabelStatusBadge(order: OrderWithId) {
    const orderAny = order as any;
    const hasPackingSlip = !!(order.packingSlipUrl || orderAny.packing_slip_url || order.internal_label_url);

    if (hasPackingSlip) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          Ready
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
        None
      </span>
    );
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

  function formatDate(date: any) {
    if (!date) return 'N/A';
    
    let dateObj: Date | null = null;
    
    if (date.toDate) {
      dateObj = date.toDate();
    } else if (date instanceof Date) {
      dateObj = date;
    }
    
    if (!dateObj) return 'N/A';
    
    // Format: MM/DD/YYYY HH:MM:SS AM/PM
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true // 12-hour format with AM/PM
    });
  }

  function formatPrice(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  function exportToExcel() {
    if (orders.length === 0) {
      alert('No orders to export');
      return;
    }

    // Prepare data for Excel export
    const excelData = orders.map(order => {
      const orderAny = order as any;
      const hasPackingSlip = !!(order.packingSlipUrl || orderAny.packing_slip_url || order.internal_label_url);
      return {
        'Order Number': order.orderNumber || order.id.slice(-8).toUpperCase(),
        'Order ID': order.id,
        'Customer Name': order.customerName || 'Customer',
        'Customer Email': order.email,
        'Fulfillment Method': getFulfillmentMethodLabel(order.fulfillmentMethod),
        'Order Status': order.status,
        'Payment Status': order.paymentStatus || 'N/A',
        'Has Packing Slip': hasPackingSlip ? 'Yes' : 'No',
        'Subtotal': formatPrice(order.subtotal || 0),
        'Shipping Cost': formatPrice(order.shipping || 0),
        'Tax': formatPrice(order.tax || 0),
        'Total': formatPrice(order.total),
        'Items Count': order.items?.length || 0,
        'Items': order.items?.map(item => {
          const parts = [item.title];
          if (item.size || item.color) parts.push(`[${[item.size, item.color].filter(Boolean).join('/')}]`);
          if (item.sku) parts.push(`SKU: ${item.sku}`);
          parts.push(`Qty: ${item.qty}`);
          return parts.join(' ');
        }).join('; ') || 'N/A',
        'Shipping Address': order.shippingAddress ?
          `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}, ${order.shippingAddress.country}` :
          'N/A',
        'Phone': order.shippingAddress?.phone || 'N/A',
        'Created At': formatDate(order.createdAt),
        'Updated At': formatDate(order.updatedAt),
        'Paid At': formatDate(order.paidAt),
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 15 }, // Order Number
      { wch: 25 }, // Order ID
      { wch: 20 }, // Customer Name
      { wch: 30 }, // Customer Email
      { wch: 18 }, // Fulfillment Method
      { wch: 12 }, // Order Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Has Packing Slip
      { wch: 12 }, // Subtotal
      { wch: 12 }, // Shipping Cost
      { wch: 10 }, // Tax
      { wch: 12 }, // Total
      { wch: 12 }, // Items Count
      { wch: 60 }, // Items
      { wch: 60 }, // Shipping Address
      { wch: 15 }, // Phone
      { wch: 20 }, // Created At
      { wch: 20 }, // Updated At
      { wch: 20 }, // Paid At
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Orders');

    // Generate filename with current date
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const filename = `BMR_Orders_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
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
  
  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-bmr-ink mb-2">Orders</h1>
            <p className="text-bmr-muted">Manage orders and shipping labels</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportToExcel}
              disabled={loading || orders.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-bmr-night border border-bmr-night rounded hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={orders.length === 0 ? 'No orders to export' : `Export ${orders.length} orders to Excel`}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-bmr-ink bg-surface-2 border border-line rounded hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadOrders}
              className="inline-flex items-center gap-2 px-4 py-2 bg-bmr-night text-white rounded hover:bg-opacity-90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-bmr-muted mx-auto mb-3" />
            <p className="text-bmr-muted">No orders found</p>
            <p className="text-sm text-bmr-muted mt-2">Orders will appear here after customers complete purchases.</p>
            <div className="mt-4 text-xs text-bmr-muted">
              <p>Debug: Check browser console and server logs for details.</p>
              <p>Test endpoint: <a href="/api/admin/orders/test" target="_blank" className="underline">/api/admin/orders/test</a></p>
            </div>
          </div>
        ) : (
          (() => {
            return (
          <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-3 border-b border-line">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Order</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Customer</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Method</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Label</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-bmr-ink">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-bmr-ink">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-surface-3 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-bmr-ink">
                          {order.orderNumber || order.id.slice(-8).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium">{order.customerName || 'Customer'}</div>
                          <div className="text-bmr-muted text-xs">{order.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm">{getFulfillmentMethodLabel(order.fulfillmentMethod)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getLabelStatusBadge(order)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-bmr-muted">{formatDate(order.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-bmr-night hover:bg-surface-3 rounded transition-colors"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            );
          })()
        )}
      </div>
    </div>
  );
}

