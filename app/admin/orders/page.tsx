'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';
import Link from 'next/link';
import { Package, AlertCircle, CheckCircle, Clock, ExternalLink, RefreshCw, LogOut, Download } from 'lucide-react';
import { clearAdminSession } from '@/lib/adminAuth';
import type { Order } from '@/types';
import * as XLSX from 'xlsx';

// Module-level log to verify file is loaded (runs when module is imported)
if (typeof window !== 'undefined') {
  console.log('📋 ===== AdminOrdersPage MODULE LOADED =====');
  console.log('📋 AdminOrdersPage: Module loaded at:', new Date().toISOString());
  console.log('📋 AdminOrdersPage: Current URL:', window.location.href);
}

interface OrderWithId extends Order {
  id: string;
}

export default function AdminOrdersPage() {
  // CRITICAL: These logs MUST appear - if they don't, the component isn't loading
  console.log('📋 ===== AdminOrdersPage COMPONENT RENDERED =====');
  console.log('📋 AdminOrdersPage: Component function called at:', new Date().toISOString());
  console.log('📋 AdminOrdersPage: Window location:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  console.log('📋 AdminOrdersPage: Component render count check');
  console.error('🔴 CRITICAL: If you see this, the component IS loading!');
  console.warn('🟡 WARNING: If you see this, the component IS loading!');
  
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [orders, setOrders] = useState<OrderWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('📋 AdminOrdersPage: State values:', {
    isAuthenticated,
    ordersCount: orders.length,
    loading,
    error,
  });

  // Effect to check DOM after orders are loaded
  useEffect(() => {
    if (!loading && orders.length > 0 && !error) {
      console.log('🔍 ===== DOM CHECK AFTER ORDERS LOADED =====');
      setTimeout(() => {
        const table = document.querySelector('table');
        const tbody = document.querySelector('tbody');
        const rows = document.querySelectorAll('tbody tr');
        console.log('🔍 Table element exists:', !!table);
        console.log('🔍 Tbody element exists:', !!tbody);
        console.log('🔍 Number of rows in DOM:', rows.length);
        console.log('🔍 First row HTML:', rows[0]?.outerHTML?.substring(0, 200));
        if (table) {
          console.log('🔍 Table computed styles:', {
            display: window.getComputedStyle(table).display,
            visibility: window.getComputedStyle(table).visibility,
            opacity: window.getComputedStyle(table).opacity,
            height: window.getComputedStyle(table).height,
            width: window.getComputedStyle(table).width,
          });
        }
      }, 500);
    }
  }, [loading, orders.length, error]);

  useEffect(() => {
    console.log('📋 ===== AdminOrdersPage: useEffect TRIGGERED =====');
    console.log('📋 AdminOrdersPage: useEffect timestamp:', new Date().toISOString());
    console.log('📋 AdminOrdersPage: Router object:', router ? 'present' : 'missing');
    console.log('📋 AdminOrdersPage: Window object:', typeof window !== 'undefined' ? 'present' : 'missing');
    console.log('📋 AdminOrdersPage: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
    console.log('📋 AdminOrdersPage: Current pathname:', typeof window !== 'undefined' ? window.location.pathname : 'SSR');
    
    // Check sessionStorage BEFORE calling isAdminAuthenticated
    if (typeof window !== 'undefined') {
      const sessionValue = sessionStorage.getItem('bmr_admin_session');
      console.log('📋 AdminOrdersPage: Raw sessionStorage value:', sessionValue);
      console.log('📋 AdminOrdersPage: SessionStorage keys:', Object.keys(sessionStorage));
      console.log('📋 AdminOrdersPage: All sessionStorage:', Object.fromEntries(Object.entries(sessionStorage)));
    }
    
    try {
      console.log('📋 AdminOrdersPage: Calling isAdminAuthenticated()...');
      const authResult = isAdminAuthenticated();
      console.log('📋 AdminOrdersPage: isAdminAuthenticated() result:', authResult);
      console.log('📋 AdminOrdersPage: Auth result type:', typeof authResult);
      
      if (!authResult) {
        console.error('❌ ===== AdminOrdersPage: NOT AUTHENTICATED =====');
        console.error('❌ AdminOrdersPage: Authentication check failed');
        console.error('❌ AdminOrdersPage: SessionStorage value was:', typeof window !== 'undefined' ? sessionStorage.getItem('bmr_admin_session') : 'N/A');
        console.error('❌ AdminOrdersPage: Redirecting to /admin/login in 100ms...');
        
        // Delay redirect slightly to ensure logs are visible
        setTimeout(() => {
          console.error('❌ AdminOrdersPage: Executing redirect now');
          router.push('/admin/login');
        }, 100);
        
        return; // Exit early
      }
      
      console.log('✅ ===== AdminOrdersPage: AUTHENTICATED =====');
      console.log('✅ AdminOrdersPage: Authentication check passed');
      console.log('✅ AdminOrdersPage: Setting isAuthenticated to true');
      setIsAuthenticated(true);
      console.log('✅ AdminOrdersPage: Calling loadOrders()');
      loadOrders();
    } catch (err: any) {
      console.error('❌ ===== AdminOrdersPage: ERROR IN useEffect =====');
      console.error('❌ AdminOrdersPage: Error type:', err?.constructor?.name);
      console.error('❌ AdminOrdersPage: Error name:', err?.name);
      console.error('❌ AdminOrdersPage: Error message:', err?.message);
      console.error('❌ AdminOrdersPage: Error stack:', err?.stack);
      console.error('❌ AdminOrdersPage: Full error:', err);
    }
  }, [router]);

  async function loadOrders() {
    console.log('📋 ===== AdminOrdersPage: loadOrders() CALLED =====');
    console.log('📋 AdminOrdersPage: loadOrders timestamp:', new Date().toISOString());
    console.log('📋 AdminOrdersPage: Current state before load:', {
      loading,
      ordersCount: orders.length,
      error,
      isAuthenticated,
    });
    
    try {
      console.log('📋 AdminOrdersPage: Setting loading to true, clearing error');
      setLoading(true);
      setError(null);
      
      console.log('📋 AdminOrdersPage: Preparing fetch request...');
      console.log('📋 AdminOrdersPage: Fetch URL: /api/admin/orders');
      console.log('📋 AdminOrdersPage: Window location:', typeof window !== 'undefined' ? window.location.origin : 'SSR');
      console.log('📋 AdminOrdersPage: Full URL will be:', typeof window !== 'undefined' ? `${window.location.origin}/api/admin/orders` : 'SSR');
      
      const startTime = Date.now();
      console.log('📋 AdminOrdersPage: Starting fetch at:', startTime);
      
      let response: Response;
      try {
        response = await fetch('/api/admin/orders', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });
        console.log('✅ AdminOrdersPage: Fetch promise resolved');
      } catch (fetchError: any) {
        console.error('❌ AdminOrdersPage: Fetch promise rejected');
        console.error('❌ AdminOrdersPage: Fetch error type:', fetchError?.constructor?.name);
        console.error('❌ AdminOrdersPage: Fetch error message:', fetchError?.message);
        console.error('❌ AdminOrdersPage: Fetch error stack:', fetchError?.stack);
        throw fetchError;
      }
      
      const fetchDuration = Date.now() - startTime;
      console.log('📋 AdminOrdersPage: Fetch completed in', fetchDuration, 'ms');
      console.log('📋 AdminOrdersPage: Response received');
      console.log('📋 AdminOrdersPage: Response status:', response.status);
      console.log('📋 AdminOrdersPage: Response statusText:', response.statusText);
      console.log('📋 AdminOrdersPage: Response ok:', response.ok);
      console.log('📋 AdminOrdersPage: Response type:', response.type);
      console.log('📋 AdminOrdersPage: Response headers count:', response.headers ? Array.from(response.headers.entries()).length : 0);
      
      if (response.headers) {
        const headersObj = Object.fromEntries(response.headers.entries());
        console.log('📋 AdminOrdersPage: Response headers:', headersObj);
      }
      
      console.log('📋 AdminOrdersPage: Reading response body as JSON...');
      let result: any;
      try {
        const text = await response.text();
        console.log('📋 AdminOrdersPage: Response text length:', text.length);
        console.log('📋 AdminOrdersPage: Response text preview (first 500 chars):', text.substring(0, 500));
        
        result = JSON.parse(text);
        console.log('✅ AdminOrdersPage: JSON parsed successfully');
      } catch (parseError: any) {
        console.error('❌ AdminOrdersPage: JSON parse failed');
        console.error('❌ AdminOrdersPage: Parse error:', parseError?.message);
        throw new Error(`Failed to parse response: ${parseError?.message}`);
      }
      
      console.log('📋 AdminOrdersPage: Parsed result object:', {
        hasSuccess: 'success' in result,
        success: result.success,
        hasOrders: 'orders' in result,
        ordersType: Array.isArray(result.orders) ? 'array' : typeof result.orders,
        ordersLength: Array.isArray(result.orders) ? result.orders.length : 'N/A',
        hasError: 'error' in result,
        error: result.error,
      });
      console.log('📋 AdminOrdersPage: result.success:', result.success);
      console.log('📋 AdminOrdersPage: result.orders length:', result.orders?.length || 0);
      console.log('📋 AdminOrdersPage: result.error:', result.error);
      
      if (!response.ok) {
        console.error('❌ AdminOrdersPage: Response not OK');
        console.error('❌ AdminOrdersPage: Status:', response.status);
        console.error('❌ AdminOrdersPage: StatusText:', response.statusText);
        console.error('❌ AdminOrdersPage: Result error:', result.error);
        console.error('❌ AdminOrdersPage: Full result:', result);
        throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (!result.success) {
        console.error('❌ AdminOrdersPage: API returned success: false');
        console.error('❌ AdminOrdersPage: Result error:', result.error);
        console.error('❌ AdminOrdersPage: Full result:', result);
        throw new Error(result.error || 'API returned success: false');
      }
      
      if (!Array.isArray(result.orders)) {
        console.error('❌ AdminOrdersPage: result.orders is not an array');
        console.error('❌ AdminOrdersPage: result.orders type:', typeof result.orders);
        console.error('❌ AdminOrdersPage: result.orders value:', result.orders);
        throw new Error('Invalid response: orders is not an array');
      }
      
      console.log('✅ AdminOrdersPage: Response validation passed');
      console.log('📋 AdminOrdersPage: Processing', result.orders.length, 'orders');
      
      // Convert ISO strings back to Date objects for display
      console.log('📋 AdminOrdersPage: Mapping orders array...');
      const ordersData: OrderWithId[] = result.orders.map((order: any, index: number) => {
        if (index < 5) {
          console.log(`📋 AdminOrdersPage: Order ${index + 1} details:`, {
            id: order.id,
            status: order.status,
            email: order.email,
            createdAt: order.createdAt,
            fulfillmentMethod: order.fulfillmentMethod,
            itemsCount: order.items?.length,
            total: order.total,
            paymentStatus: order.paymentStatus,
          });
        }
        
        const converted = {
          ...order,
          createdAt: order.createdAt ? new Date(order.createdAt) : null,
          updatedAt: order.updatedAt ? new Date(order.updatedAt) : null,
          paidAt: order.paidAt ? new Date(order.paidAt) : null,
        };
        
        return converted;
      });
      
      console.log('✅ AdminOrdersPage: Orders mapping completed');
      console.log('📋 AdminOrdersPage: Converted', ordersData.length, 'orders');
      console.log('📋 AdminOrdersPage: First order ID:', ordersData[0]?.id);
      console.log('📋 AdminOrdersPage: Last order ID:', ordersData[ordersData.length - 1]?.id);
      
      console.log('📋 AdminOrdersPage: Setting orders state with', ordersData.length, 'orders');
      console.log('📋 AdminOrdersPage: Sample order data:', ordersData[0]);
      setOrders(ordersData);
      console.log('✅ AdminOrdersPage: Orders state updated');
      console.log('✅ AdminOrdersPage: Orders loaded successfully - total:', ordersData.length);
      
      // Use setTimeout to check state after React has updated
      setTimeout(() => {
        console.log('🔍 Post-render check: Orders should now be visible in UI');
        console.log('🔍 If table is not visible, check CSS classes and DOM structure');
      }, 100);
    } catch (error: any) {
      console.error('❌ ===== AdminOrdersPage: ERROR IN loadOrders() =====');
      console.error('❌ AdminOrdersPage: Error timestamp:', new Date().toISOString());
      console.error('❌ AdminOrdersPage: Error type:', error?.constructor?.name);
      console.error('❌ AdminOrdersPage: Error name:', error?.name);
      console.error('❌ AdminOrdersPage: Error message:', error?.message);
      console.error('❌ AdminOrdersPage: Error stack:', error?.stack);
      console.error('❌ AdminOrdersPage: Error cause:', error?.cause);
      console.error('❌ AdminOrdersPage: Full error object:', error);
      console.error('❌ AdminOrdersPage: Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      
      const errorMessage = error?.message || 'Failed to load orders. Please try again.';
      console.error('❌ AdminOrdersPage: Setting error state to:', errorMessage);
      setError(errorMessage);
    } finally {
      console.log('📋 AdminOrdersPage: Finally block - setting loading to false');
      setLoading(false);
      console.log('📋 AdminOrdersPage: loadOrders() completed, loading set to false');
      console.log('📋 AdminOrdersPage: Final state:', {
        loading: false,
        ordersCount: orders.length,
        error,
      });
    }
  }

  function getLabelStatusBadge(order: OrderWithId) {
    const fulfillmentMethod = order.fulfillmentMethod || 'shipping';
    const status = order.shippo_label_status || 
                   (order.shippo_label_url ? 'success' : 
                    order.internal_label_url ? 'success' : 
                    'none');
    
    // For pickup/local_delivery, check internal label
    if ((fulfillmentMethod === 'pickup' || fulfillmentMethod === 'local_delivery') && order.internal_label_url) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Internal label (not Shippo)">
          <CheckCircle className="w-3 h-3" />
          Internal
        </span>
      );
    }
    
    // For shipping orders, check Shippo label
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800" title="Shippo carrier label">
            <CheckCircle className="w-3 h-3" />
            Shippo
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800" title="Creating Shippo label...">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800" title={order.shippo_error_message || 'Shippo label creation failed'}>
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        if (fulfillmentMethod === 'shipping') {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800" title="No Shippo label yet">
              None
            </span>
          );
        } else {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800" title="Shippo not used for pickup/local delivery">
              N/A
            </span>
          );
        }
    }
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
    const excelData = orders.map(order => ({
      'Order Number': order.orderNumber || order.id.slice(-8).toUpperCase(),
      'Order ID': order.id,
      'Customer Name': order.customerName || 'Customer',
      'Customer Email': order.email,
      'Fulfillment Method': getFulfillmentMethodLabel(order.fulfillmentMethod),
      'Order Status': order.status,
      'Payment Status': order.paymentStatus || 'N/A',
      'Shippo Label Status': order.shippo_label_status || 'none',
      'Has Shippo Label': order.shippo_label_url ? 'Yes' : 'No',
      'Has Internal Label': order.internal_label_url ? 'Yes' : 'No',
      'Shippo Tracking Number': order.shippo_tracking_number || 'N/A',
      'Shippo Tracking URL': order.trackingUrl || 'N/A',
      'Subtotal': formatPrice(order.subtotal || 0),
      'Shipping Cost': formatPrice(order.shippingCost || 0),
      'Tax': formatPrice(order.tax || 0),
      'Total': formatPrice(order.total),
      'Items Count': order.items?.length || 0,
      'Items': order.items?.map(item => `${item.title} (Qty: ${item.qty})`).join('; ') || 'N/A',
      'Shipping Address': order.shippingAddress ? 
        `${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}, ${order.shippingAddress.country}` : 
        'N/A',
      'Phone': order.shippingAddress?.phone || 'N/A',
      'Created At': formatDate(order.createdAt),
      'Updated At': formatDate(order.updatedAt),
      'Paid At': formatDate(order.paidAt),
      'Shippo Error': order.shippo_error_message || 'N/A',
    }));

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
      { wch: 18 }, // Shippo Label Status
      { wch: 15 }, // Has Shippo Label
      { wch: 18 }, // Has Internal Label
      { wch: 25 }, // Tracking Number
      { wch: 50 }, // Tracking URL
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
      { wch: 40 }, // Shippo Error
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

    console.log(`✅ Exported ${orders.length} orders to ${filename}`);
  }

  console.log('📋 AdminOrdersPage: Render - isAuthenticated:', isAuthenticated);
  console.log('📋 AdminOrdersPage: Render - loading:', loading);
  console.log('📋 AdminOrdersPage: Render - orders.length:', orders.length);
  console.log('📋 AdminOrdersPage: Render - error:', error);
  console.log('📋 AdminOrdersPage: Render - Conditional check:', {
    shouldShowLoading: loading,
    shouldShowError: !!error,
    shouldShowEmpty: orders.length === 0,
    shouldShowTable: !loading && !error && orders.length > 0,
  });

  if (!isAuthenticated) {
    console.log('📋 AdminOrdersPage: Rendering loading screen (not authenticated)');
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading...</p>
        </div>
      </div>
    );
  }
  
  console.log('📋 AdminOrdersPage: Rendering main content (authenticated)');

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
            console.log('🎯 ===== RENDERING ORDERS TABLE =====');
            console.log('🎯 Orders count:', orders.length);
            console.log('🎯 First order:', orders[0]);
            console.log('🎯 About to render table with', orders.length, 'rows');
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

