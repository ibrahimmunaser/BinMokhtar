import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { adminDb } from '@/lib/firebase/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-webhook-direct
 * Test endpoint that simulates webhook processing without signature verification
 * Use this to test email sending directly
 */
export async function POST(request: NextRequest) {
  console.log('🧪 ===== TEST WEBHOOK DIRECT - STARTED =====');
  console.log('🧪 Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    const { 
      customerEmail = 'ibrahimmunaser@gmail.com',
      customerName = 'Test User',
      testFirebase = false,
      testEmail = true,
    } = body;

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Firebase initialization
    if (testFirebase) {
      console.log('🧪 Test 1: Testing Firebase initialization...');
      try {
        const db = adminDb();
        console.log('✅ Test 1: Firebase initialized successfully');
        results.tests.firebase = { success: true, message: 'Firebase initialized' };
      } catch (error: any) {
        console.error('❌ Test 1: Firebase initialization failed:', error.message);
        results.tests.firebase = { 
          success: false, 
          error: error.message,
          hint: 'Check FIREBASE_SERVICE_ACCOUNT_JSON in Render environment variables'
        };
      }
    }

    // Test 2: Email sending
    if (testEmail) {
      console.log('🧪 Test 2: Testing email sending...');
      try {
        const emailResult = await sendOrderConfirmationEmail({
          customerEmail,
          customerName,
          orderId: 'test-order-' + Date.now(),
          orderNumber: 'TEST' + Date.now().toString().slice(-6),
          items: [{
            title: 'Test Product',
            qty: 1,
            unitPrice: 3199, // $31.99 in cents
            imageUrl: undefined,
          }],
          subtotal: 3199,
          shipping: 0,
          tax: 0,
          total: 3199,
          currency: 'USD',
          fulfillmentMethod: 'delivery',
          shippingAddress: {
            fullName: customerName,
            address: '10015 Burley Street',
            city: 'Dearborn',
            state: 'NY',
            zip: '12345',
            country: 'US',
          },
        });

        console.log('🧪 Test 2: Email result:', JSON.stringify(emailResult, null, 2));
        results.tests.email = emailResult;
        
        if (emailResult.success) {
          console.log('✅ Test 2: Email sent successfully');
        } else {
          console.error('❌ Test 2: Email send failed:', emailResult.error);
        }
      } catch (error: any) {
        console.error('❌ Test 2: Email send exception:', error);
        results.tests.email = {
          success: false,
          error: error.message,
          stack: error.stack,
        };
      }
    }

    console.log('🧪 ===== TEST WEBHOOK DIRECT - COMPLETE =====');
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('❌ Test webhook direct error:', error);
    return NextResponse.json(
      { error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}

