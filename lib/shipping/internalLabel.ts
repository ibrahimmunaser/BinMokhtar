/**
 * Internal Label Generation
 * 
 * Creates internal labels (PDF/HTML) for pickup and local_delivery orders.
 * These are not Shippo labels - they're simple printable labels for store use.
 */

import type { Order } from '@/types';
import { STORE_ADDRESS } from './config';

/**
 * Create internal label URL for an order
 * Returns a URL that will render the label when accessed
 */
export async function createInternalLabelForOrder(
  order: Order
): Promise<string> {
  // Generate a URL that will render the label on-demand
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                  'http://localhost:3000';
  
  return `${baseUrl}/api/orders/internal-label/${order.id}`;
}

/**
 * Generate HTML for internal label
 * This is used by the API route to render the label
 */
export function generateInternalLabelHtml(order: Order): string {
  const fulfillmentMethod = order.fulfillmentMethod || 'pickup';
  const fulfillmentLabel = 
    fulfillmentMethod === 'pickup' ? 'PICKUP ORDER' :
    fulfillmentMethod === 'local_delivery' ? 'LOCAL DELIVERY' :
    'ORDER';

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const itemRows = order.items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #eee;">
        <strong>${item.title}</strong><br>
        <span style="color: #666; font-size: 12px;">
          SKU: ${item.sku}
          ${item.size ? ` | Size: ${item.size}` : ''}
          ${item.color ? ` | Color: ${item.color}` : ''}
        </span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.qty}</td>
      <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.unitPrice * item.qty)}</td>
    </tr>
  `).join('');

  const customerName = order.customerName || order.shippingAddress?.fullName || 'Customer';
  const customerEmail = order.email || order.shippingAddress?.email || '';
  const customerPhone = order.phone || order.shippingAddress?.phone || '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${fulfillmentLabel} - Order ${order.orderNumber || order.id}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
      @page { margin: 0.5in; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.5;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .logo {
      font-size: 32px;
      font-weight: bold;
      letter-spacing: 2px;
    }
    .order-info {
      text-align: right;
    }
    .badge {
      display: inline-block;
      padding: 6px 16px;
      background: #000;
      color: #fff;
      font-size: 14px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-bottom: 10px;
    }
    .addresses {
      display: flex;
      gap: 40px;
      margin-bottom: 40px;
    }
    .address-box {
      flex: 1;
    }
    .address-box h3 {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #666;
      margin-bottom: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    th {
      text-align: left;
      padding: 12px;
      background: #f5f5f5;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    th:last-child { text-align: right; }
    .totals {
      text-align: right;
      margin-top: 20px;
    }
    .totals-row {
      display: flex;
      justify-content: flex-end;
      gap: 40px;
      padding: 8px 0;
    }
    .totals-row.total {
      font-size: 18px;
      font-weight: bold;
      border-top: 2px solid #000;
      padding-top: 12px;
      margin-top: 8px;
    }
    .footer {
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      background: #000;
      color: #fff;
      border: none;
      cursor: pointer;
      font-size: 14px;
      z-index: 1000;
    }
    .print-btn:hover { background: #333; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Label</button>

  <div class="header">
    <div>
      <div class="logo">BMR</div>
      <div style="font-size: 12px; letter-spacing: 2px;">BIN MUKHTAR RETAIL</div>
    </div>
    <div class="order-info">
      <div class="badge">${fulfillmentLabel}</div>
      <div style="font-size: 18px; font-weight: bold;">Order ${order.orderNumber || order.id.slice(-8).toUpperCase()}</div>
      <div style="color: #666; font-size: 14px;">${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-box">
      <h3>Store</h3>
      <div>
        <strong>${STORE_ADDRESS.name}</strong><br>
        ${STORE_ADDRESS.street1}<br>
        ${STORE_ADDRESS.city}, ${STORE_ADDRESS.state} ${STORE_ADDRESS.zip}
      </div>
    </div>
    <div class="address-box">
      <h3>${fulfillmentMethod === 'pickup' ? 'Customer' : 'Delivery Address'}</h3>
      <div>
        <strong>${customerName}</strong><br>
        ${customerEmail ? `${customerEmail}<br>` : ''}
        ${customerPhone ? `${customerPhone}<br>` : ''}
        ${fulfillmentMethod !== 'pickup' && order.shippingAddress ? `
          ${order.shippingAddress.address}<br>
          ${order.shippingAddress.address2 ? `${order.shippingAddress.address2}<br>` : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}
        ` : '(Pickup - No delivery address)'}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Item</th>
        <th style="text-align: center;">Qty</th>
        <th style="text-align: right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="totals">
    <div class="totals-row">
      <span>Subtotal:</span>
      <span>${formatPrice(order.subtotal)}</span>
    </div>
    ${fulfillmentMethod === 'local_delivery' && order.shipping > 0 ? `
      <div class="totals-row">
        <span>Local Delivery:</span>
        <span>${formatPrice(order.shipping)}</span>
      </div>
    ` : ''}
    ${order.tax > 0 ? `
      <div class="totals-row">
        <span>Tax:</span>
        <span>${formatPrice(order.tax)}</span>
      </div>
    ` : ''}
    <div class="totals-row total">
      <span>Total:</span>
      <span>${formatPrice(order.total)}</span>
    </div>
  </div>

  <div class="footer">
    <p>Thank you for shopping with Bin Mukhtar Retail!</p>
    <p>${STORE_ADDRESS.email}</p>
  </div>
</body>
</html>
  `.trim();
}





