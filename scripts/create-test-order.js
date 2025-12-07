const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'binmokhtar2-967ad-firebase-adminsdk-fbsvc-a56edc343f.json');
const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function createTestOrder() {
  try {
    const orderData = {
      orderNumber: `TEST-${Date.now()}`,
      email: 'test@example.com',
      customerName: 'Test Customer',
      phone: '123-456-7890',
      status: 'PAID',
      fulfillmentStatus: 'PENDING',
      fulfillmentMethod: 'shipping',
      
      // Shipping address
      shippingAddress: {
        fullName: 'Test Customer',
        email: 'test@example.com',
        address: '123 Test Street',
        address2: 'Apt 4B',
        city: 'Dearborn',
        state: 'MI',
        zip: '48126',
        country: 'US',
        phone: '123-456-7890',
      },
      
      // Order items
      items: [
        {
          productId: 'qVy3GpPSirXmRg1w32OI',
          variantId: 'test-variant-1',
          title: 'Test Product',
          sku: 'TEST-SKU-001',
          qty: 1,
          unitPrice: 2200, // $22.00 in cents
          size: '56',
          color: 'White',
        },
      ],
      
      // Financial details (all in cents)
      subtotal: 2200,
      shipping: 500,
      tax: 200,
      total: 2900,
      currency: 'USD',
      
      // Stripe info
      stripeSessionId: `cs_test_${Date.now()}`,
      stripePaymentIntentId: `pi_test_${Date.now()}`,
      paymentStatus: 'paid',
      
      // Timestamps
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      paidAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const orderRef = await db.collection('orders').add(orderData);
    console.log('✅ Test order created with ID:', orderRef.id);
    console.log('📋 Order Number:', orderData.orderNumber);
    
    return orderRef.id;
  } catch (error) {
    console.error('❌ Error creating test order:', error);
    throw error;
  }
}

createTestOrder()
  .then((orderId) => {
    console.log('\n✅ Success! Test order created.');
    console.log('🔗 Check admin orders page: http://localhost:3000/admin/orders');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to create test order:', error);
    process.exit(1);
  });



