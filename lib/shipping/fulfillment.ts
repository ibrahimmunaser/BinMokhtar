/**
 * Fulfillment Label & Packing Slip Generation
 * Handles creating shipping labels and internal packing slips
 */

import { createShippingLabel } from './shippo';
import {
  USE_SHIPPO_LABELS_FOR_ALL_FULFILLMENT,
  FulfillmentMethod,
  OrderFulfillment,
  STORE_ADDRESS,
} from './config';

interface OrderData {
  id: string;
  orderNumber: string;
  fulfillment: {
    method: FulfillmentMethod;
    locationZone?: {
      formattedAddress: string;
      city: string;
      state: string;
      zip: string;
      country: string;
    } | null;
    shippingRateId?: string;
    shippingAmount?: number;
    localDeliveryFee?: number;
  };
  customerName: string;
  customerEmail: string;
  items: Array<{
    title: string;
    sku: string;
    qty: number;
    unitPrice: number;
    size?: string;
    color?: string;
    imageUrl?: string;
  }>;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

/**
 * Create fulfillment documents for an order
 * - For shipping: Creates Shippo shipping label
 * - For pickup/local: Creates internal packing slip
 */
export async function createFulfillmentLabel(
  order: OrderData
): Promise<{
  labelUrl?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  packingSlipUrl?: string;
  shippoTransactionId?: string;
}> {
  const { fulfillment } = order;

  console.log('📦 Creating fulfillment label for order:', order.orderNumber);
  console.log('📦 Fulfillment method:', fulfillment.method);

  // Case 1: Shipping - Create Shippo label
  if (fulfillment.method === 'shipping' && fulfillment.shippingRateId) {
    try {
      console.log('📦 Creating Shippo shipping label...');
      
      const label = await createShippingLabel(fulfillment.shippingRateId);
      
      console.log('✅ Shipping label created:', label.trackingNumber);
      
      return {
        labelUrl: label.labelUrl,
        trackingNumber: label.trackingNumber,
        trackingUrl: label.trackingUrl,
        shippoTransactionId: label.transactionId,
      };
    } catch (error: any) {
      console.error('❌ Failed to create shipping label:', error);
      throw new Error(`Failed to create shipping label: ${error.message}`);
    }
  }

  // Case 2: Pickup or Local Delivery
  if (fulfillment.method === 'pickup' || fulfillment.method === 'local_delivery') {
    // Option A: Route through Shippo if configured
    if (USE_SHIPPO_LABELS_FOR_ALL_FULFILLMENT && fulfillment.shippingRateId) {
      try {
        console.log('📦 Creating Shippo label for local fulfillment...');
        
        const label = await createShippingLabel(fulfillment.shippingRateId);
        
        return {
          labelUrl: label.labelUrl,
          trackingNumber: label.trackingNumber,
          trackingUrl: label.trackingUrl,
          shippoTransactionId: label.transactionId,
        };
      } catch (error: any) {
        console.error('❌ Shippo label failed, falling back to packing slip:', error);
        // Fall through to packing slip generation
      }
    }

    // Option B: Generate internal packing slip
    console.log('📦 Generating internal packing slip...');
    
    const packingSlipUrl = generatePackingSlipUrl(order);
    
    return {
      packingSlipUrl,
    };
  }

  // Fallback: Generate packing slip
  console.log('📦 Generating fallback packing slip...');
  return {
    packingSlipUrl: generatePackingSlipUrl(order),
  };
}

/**
 * Generate URL for internal packing slip
 * This creates a URL that can be used to view/print the packing slip
 */
function generatePackingSlipUrl(order: OrderData): string {
  // The packing slip will be generated on-demand when this URL is accessed
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return `${baseUrl}/api/orders/packing-slip/${order.id}`;
}

/**
 * Generate HTML for packing slip
 * This can be rendered as a printable page or converted to PDF
 */
export function generatePackingSlipHtml(order: OrderData): string {
  const { fulfillment, items, customerName, customerEmail } = order;
  
  const fulfillmentLabel = 
    fulfillment.method === 'pickup' ? 'PICKUP' :
    fulfillment.method === 'local_delivery' ? 'LOCAL DELIVERY' : 'SHIPPING';

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const itemRows = items.map(item => `
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

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Packing Slip - Order ${order.orderNumber}</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
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
    }
    .print-btn:hover { background: #333; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print Packing Slip</button>

  <div class="header">
    <div>
      <div class="logo">BMR</div>
      <div style="font-size: 12px; letter-spacing: 2px;">BIN MUKHTAR RETAIL</div>
    </div>
    <div class="order-info">
      <div class="badge">${fulfillmentLabel}</div>
      <div style="font-size: 18px; font-weight: bold;">Order ${order.orderNumber}</div>
      <div style="color: #666; font-size: 14px;">${new Date().toLocaleDateString()}</div>
    </div>
  </div>

  <div class="addresses">
    <div class="address-box">
      <h3>Ship From</h3>
      <div>
        <strong>${STORE_ADDRESS.name}</strong><br>
        ${STORE_ADDRESS.street1}<br>
        ${STORE_ADDRESS.city}, ${STORE_ADDRESS.state} ${STORE_ADDRESS.zip}
      </div>
    </div>
    <div class="address-box">
      <h3>${fulfillment.method === 'pickup' ? 'Customer' : 'Ship To'}</h3>
      <div>
        <strong>${customerName}</strong><br>
        ${customerEmail}<br>
        ${fulfillment.method !== 'pickup' && fulfillment.locationZone ? `
          ${fulfillment.locationZone.formattedAddress}
        ` : '(Pickup - No shipping address)'}
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
    ${fulfillment.method === 'local_delivery' ? `
      <div class="totals-row">
        <span>Local Delivery:</span>
        <span>${formatPrice(order.shipping)}</span>
      </div>
    ` : fulfillment.method === 'shipping' ? `
      <div class="totals-row">
        <span>Shipping:</span>
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

