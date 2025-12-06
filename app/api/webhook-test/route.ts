import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

/**
 * GET /api/webhook-test
 * Test page to check webhook configuration and recent orders
 */
export async function GET(request: NextRequest) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Webhook & Orders Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 28px;
      color: #111;
    }
    .subtitle {
      color: #666;
      margin: 0 0 32px 0;
    }
    .section {
      margin: 24px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #000;
    }
    .section h2 {
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #111;
    }
    .status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 500;
    }
    .status.success {
      background: #d4edda;
      color: #155724;
    }
    .status.error {
      background: #f8d7da;
      color: #721c24;
    }
    .status.warning {
      background: #fff3cd;
      color: #856404;
    }
    button {
      background: #000;
      color: #fff;
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      margin: 8px 8px 8px 0;
    }
    button:hover {
      background: #333;
    }
    button.secondary {
      background: #6c757d;
    }
    button.secondary:hover {
      background: #5a6268;
    }
    .code {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      margin: 16px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 16px 0;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid #dee2e6;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
    }
    .link {
      color: #007bff;
      text-decoration: none;
    }
    .link:hover {
      text-decoration: underline;
    }
    #loadingOrders {
      display: none;
      color: #666;
      margin: 16px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔧 Webhook & Orders Diagnostic</h1>
    <p class="subtitle">Test webhook configuration and view recent orders</p>

    <div class="section">
      <h2>📋 Environment Check</h2>
      <div id="envCheck">Loading...</div>
    </div>

    <div class="section">
      <h2>📦 Recent Orders</h2>
      <button onclick="loadOrders()">Refresh Orders</button>
      <button class="secondary" onclick="window.open('/api/orders/manual-create', '_blank')">
        Create Test Order
      </button>
      <button class="secondary" onclick="window.open('/admin/orders', '_blank')">
        View Admin Panel
      </button>
      <div id="loadingOrders">Loading orders...</div>
      <div id="ordersTable"></div>
    </div>

    <div class="section">
      <h2>🎯 Stripe Webhook Test</h2>
      <p>To test webhooks locally with Stripe CLI:</p>
      <div class="code">stripe listen --forward-to localhost:3000/api/stripe/webhook</div>
      <p>Then copy the webhook secret (whsec_...) to your .env.local file:</p>
      <div class="code">STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx</div>
      <p><strong>Note:</strong> Without Stripe CLI, webhooks will go to production (Render) instead of localhost.</p>
      <a href="/WEBHOOK_LOCAL_TESTING.md" target="_blank" class="link">View Full Testing Guide →</a>
    </div>

    <div class="section">
      <h2>🔍 Troubleshooting Steps</h2>
      <ol style="margin: 0; padding-left: 24px;">
        <li><strong>Orders not appearing?</strong> Webhooks may be going to production. Use manual order creation to test.</li>
        <li><strong>Check server logs</strong> in your terminal for webhook events</li>
        <li><strong>Verify Firestore</strong> in Firebase Console to see if orders exist</li>
        <li><strong>Check Stripe Dashboard</strong> → Webhooks → Recent events</li>
      </ol>
    </div>
  </div>

  <script>
    // Check environment
    fetch('/api/webhook-status')
      .then(r => r.json())
      .then(data => {
        const envDiv = document.getElementById('envCheck');
        envDiv.innerHTML = \`
          <table>
            <tr>
              <th>Check</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
            <tr>
              <td>Stripe Configured</td>
              <td><span class="status \${data.stripeConfigured ? 'success' : 'error'}">\${data.stripeConfigured ? '✓ Yes' : '✗ No'}</span></td>
              <td>\${data.stripeMode || 'N/A'}</td>
            </tr>
            <tr>
              <td>Webhook Secret</td>
              <td><span class="status \${data.webhookSecretConfigured ? 'success' : 'error'}">\${data.webhookSecretConfigured ? '✓ Set' : '✗ Missing'}</span></td>
              <td>\${data.webhookSecretConfigured ? 'Secret is configured' : 'Add STRIPE_WEBHOOK_SECRET to .env.local'}</td>
            </tr>
            <tr>
              <td>Firebase Admin</td>
              <td><span class="status \${data.firebaseConfigured ? 'success' : 'error'}">\${data.firebaseConfigured ? '✓ Active' : '✗ Error'}</span></td>
              <td>\${data.firebaseConfigured ? 'Connected' : 'Check Firebase credentials'}</td>
            </tr>
          </table>
        \`;
      })
      .catch(err => {
        document.getElementById('envCheck').innerHTML = \`
          <span class="status error">Error checking environment</span>
          <p>\${err.message}</p>
        \`;
      });

    // Load orders
    function loadOrders() {
      const loading = document.getElementById('loadingOrders');
      const table = document.getElementById('ordersTable');
      
      loading.style.display = 'block';
      table.innerHTML = '';
      
      fetch('/api/admin/orders')
        .then(r => r.json())
        .then(data => {
          loading.style.display = 'none';
          
          if (!data.success || !data.orders || data.orders.length === 0) {
            table.innerHTML = '<p style="color: #666; margin: 16px 0;">No orders found. Create a test order to get started.</p>';
            return;
          }
          
          const recentOrders = data.orders.slice(0, 10);
          
          let html = \`
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
          \`;
          
          recentOrders.forEach(order => {
            const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A';
            const total = order.total ? \`$\${(order.total / 100).toFixed(2)}\` : 'N/A';
            const orderNum = order.orderNumber || order.id.slice(-8).toUpperCase();
            
            html += \`
              <tr>
                <td><strong>\${orderNum}</strong></td>
                <td>\${order.email || 'N/A'}</td>
                <td><span class="status \${order.status === 'PAID' ? 'success' : 'warning'}">\${order.status || 'PENDING'}</span></td>
                <td>\${total}</td>
                <td>\${date}</td>
                <td><a href="/admin/orders/\${order.id}" target="_blank" class="link">View →</a></td>
              </tr>
            \`;
          });
          
          html += \`
              </tbody>
            </table>
            <p style="margin-top: 16px; color: #666;">Showing \${recentOrders.length} of \${data.orders.length} total orders</p>
          \`;
          
          table.innerHTML = html;
        })
        .catch(err => {
          loading.style.display = 'none';
          table.innerHTML = \`
            <p style="color: #dc3545; margin: 16px 0;">
              Error loading orders: \${err.message}
            </p>
          \`;
        });
    }
    
    // Load orders on page load
    loadOrders();
  </script>
</body>
</html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

