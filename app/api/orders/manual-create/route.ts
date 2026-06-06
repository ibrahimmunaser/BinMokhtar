import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * POST /api/orders/manual-create
 * Manually create an order for testing (bypasses Stripe webhook)
 * This is useful for local development when webhooks don't reach localhost
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  const timestamp = new Date().toISOString();
  console.log('📦 ===== MANUAL ORDER CREATION STARTED =====');
  console.log('📦 Timestamp:', timestamp);
  
  try {
    const body = await request.json();
    console.log('📦 Request body:', JSON.stringify(body, null, 2));
    
    const {
      customerEmail = 'test@example.com',
      customerName = 'Test Customer',
      fulfillmentMethod = 'shipping',
      items = [],
    } = body;
    
    // Validate
    if (!items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Items are required' },
        { status: 400 }
      );
    }
    
    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => 
      sum + (item.unitPrice || 0) * (item.qty || 1), 0);
    const shipping = fulfillmentMethod === 'shipping' ? 999 : 0; // $9.99 flat rate
    const tax = Math.round(subtotal * 0.06); // 6% tax
    const total = subtotal + shipping + tax;
    
    const orderNumber = `TEST-${Date.now().toString(36).toUpperCase()}`;
    
    const orderData = {
      // Order info
      orderNumber,
      status: 'PAID',
      paymentStatus: 'paid',
      
      // Customer info
      email: customerEmail,
      customerName,
      
      // Fulfillment
      fulfillmentMethod,
      fulfillmentStatus: 'PENDING',
      
      // Items
      items: items.map((item: any, index: number) => ({
        id: `item-${index}`,
        productId: item.productId || `product-${index}`,
        variantId: item.variantId || `variant-${index}`,
        title: item.title || `Test Product ${index + 1}`,
        sku: item.sku || `TEST-SKU-${index}`,
        qty: item.qty || 1,
        unitPrice: item.unitPrice || 5000,
        imageUrl: item.imageUrl || '',
        size: item.size || 'M',
        color: item.color || 'White',
        weight_grams: item.weight_grams || 450,
      })),
      
      // Shipping address (for shipping/local_delivery)
      shippingAddress: fulfillmentMethod !== 'pickup' ? {
        fullName: customerName,
        email: customerEmail,
        address: '10017 Burley Street',
        address2: '',
        city: 'Dearborn',
        state: 'MI',
        zip: '48120',
        country: 'US',
        phone: '+1-313-555-0123',
      } : null,
      
      // Totals
      subtotal,
      shipping,
      tax,
      total,
      currency: 'USD',
      
      // Weight
      total_weight_grams: items.reduce((sum: number, item: any) => 
        sum + ((item.weight_grams || 450) * (item.qty || 1)), 0),
      
      // Stripe (fake for testing)
      stripeSessionId: `cs_test_manual_${Date.now()}`,
      stripePaymentIntentId: `pi_test_manual_${Date.now()}`,
      
      
      // Timestamps
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      paidAt: FieldValue.serverTimestamp(),
    };
    
    console.log('📦 Creating order with data:', JSON.stringify(orderData, null, 2));
    
    const db = adminDb();
    const orderRef = await db.collection('orders').add(orderData);
    const orderId = orderRef.id;
    
    console.log('✅ Order created successfully');
    console.log('✅ Order ID:', orderId);
    console.log('✅ Order number:', orderNumber);
    
    // Verify order was saved
    const savedDoc = await orderRef.get();
    if (savedDoc.exists) {
      const savedData = savedDoc.data();
      console.log('✅ Order verified - exists in database');
      console.log('✅ Saved data status:', savedData?.status);
      console.log('✅ Saved data email:', savedData?.email);
    } else {
      console.error('❌ Order verification failed - document does not exist!');
    }
    
    console.log('✅ ===== MANUAL ORDER CREATION COMPLETE =====');
    
    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      message: 'Order created successfully',
      viewUrl: `/admin/orders/${orderId}`,
    });
    
  } catch (error: any) {
    console.error('❌ ===== MANUAL ORDER CREATION FAILED =====');
    console.error('❌ Error type:', error?.constructor?.name);
    console.error('❌ Error message:', error?.message);
    console.error('❌ Error stack:', error?.stack);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create order',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/orders/manual-create
 * Show a simple form to create test orders
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Manual Order Creation</title>
  <style>
    body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; }
    button { background: #000; color: #fff; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; }
    button:hover { background: #333; }
    input, select { padding: 8px; margin: 8px 0; width: 100%; border: 1px solid #ddd; border-radius: 4px; }
    label { display: block; margin-top: 16px; font-weight: 500; }
    .result { margin-top: 24px; padding: 16px; background: #f0f0f0; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>Manual Order Creation (Testing)</h1>
  <p>Create a test order directly in the database (bypasses Stripe webhook)</p>
  
  <form id="orderForm">
    <label>Customer Email</label>
    <input type="email" id="email" value="test@example.com" required>
    
    <label>Customer Name</label>
    <input type="text" id="name" value="Test Customer" required>
    
    <label>Fulfillment Method</label>
    <select id="fulfillment">
      <option value="shipping">Shipping</option>
      <option value="local_delivery">Local Delivery</option>
      <option value="pickup">Pickup</option>
    </select>
    
    <button type="submit">Create Test Order</button>
  </form>
  
  <div id="result" class="result" style="display:none;"></div>
  
  <script>
    document.getElementById('orderForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const name = document.getElementById('name').value;
      const fulfillmentMethod = document.getElementById('fulfillment').value;
      
      const result = document.getElementById('result');
      result.style.display = 'block';
      result.innerHTML = 'Creating order...';
      
      try {
        const response = await fetch('/api/orders/manual-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerEmail: email,
            customerName: name,
            fulfillmentMethod,
            items: [
              {
                productId: 'test-product-1',
                variantId: 'test-variant-1',
                title: 'Test Emirati Thobe - White',
                sku: 'EMI-WHT-54',
                qty: 1,
                unitPrice: 15000,
                size: '54',
                color: 'White',
                weight_grams: 450,
              }
            ]
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          result.innerHTML = \`
            <h3 style="color: green;">✅ Order Created Successfully!</h3>
            <p><strong>Order ID:</strong> \${data.orderId}</p>
            <p><strong>Order Number:</strong> \${data.orderNumber}</p>
            <p><a href="\${data.viewUrl}" target="_blank">View Order →</a></p>
            <p><a href="/admin/orders" target="_blank">View All Orders →</a></p>
          \`;
        } else {
          result.innerHTML = \`<h3 style="color: red;">❌ Error:</h3><p>\${data.error}</p>\`;
        }
      } catch (error) {
        result.innerHTML = \`<h3 style="color: red;">❌ Error:</h3><p>\${error.message}</p>\`;
      }
    });
  </script>
</body>
</html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

