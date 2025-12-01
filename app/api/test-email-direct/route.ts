import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Direct email test endpoint
 * Tests email sending with detailed logging
 * 
 * Usage: POST /api/test-email-direct
 * Body: { "email": "your@email.com" }
 */
export async function POST(request: NextRequest) {
  console.log('🧪 ===== EMAIL TEST STARTED =====');
  console.log('🧪 Timestamp:', new Date().toISOString());
  
  try {
    const body = await request.json();
    const testEmail = body.email || 'test@example.com';
    
    console.log('🧪 Test email address:', testEmail);
    console.log('🧪 Environment check:');
    console.log('  - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('  - RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length || 0);
    console.log('  - RESEND_API_KEY starts with "re_":', process.env.RESEND_API_KEY?.startsWith('re_') || false);
    console.log('  - FROM_EMAIL:', process.env.FROM_EMAIL || 'Bin Mukhtar Retail <orders@binmukhtarretail.com>');
    console.log('  - REPLY_TO_EMAIL:', process.env.REPLY_TO_EMAIL || 'info@binmukhtarretail.com');
    
    // Test email sending
    console.log('🧪 Calling sendOrderConfirmationEmail...');
    const result = await sendOrderConfirmationEmail({
      customerEmail: testEmail,
      customerName: 'Test User',
      orderId: 'test-order-123',
      orderNumber: 'TEST123',
      items: [
        {
          title: 'Test Product',
          qty: 1,
          unitPrice: 3199, // $31.99 in cents
          imageUrl: 'https://via.placeholder.com/150',
        },
      ],
      subtotal: 3199,
      shipping: 0,
      tax: 0,
      total: 3199,
      currency: 'USD',
      fulfillmentMethod: 'delivery',
      shippingAddress: {
        fullName: 'Test User',
        address: '123 Test St',
        city: 'Test City',
        state: 'MI',
        zip: '12345',
        country: 'US',
      },
    });
    
    console.log('🧪 Email result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ ===== EMAIL TEST SUCCESS =====');
      return NextResponse.json({
        success: true,
        message: 'Email sent successfully',
        emailId: result.emailId,
        testEmail,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('❌ ===== EMAIL TEST FAILED =====');
      console.error('❌ Error:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        testEmail,
        timestamp: new Date().toISOString(),
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('❌ ===== EMAIL TEST EXCEPTION =====');
    console.error('❌ Error:', error);
    console.error('❌ Message:', error.message);
    console.error('❌ Stack:', error.stack);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

/**
 * GET endpoint to show configuration status
 */
export async function GET() {
  const config = {
    resendApiKey: {
      exists: !!process.env.RESEND_API_KEY,
      length: process.env.RESEND_API_KEY?.length || 0,
      startsWithRe: process.env.RESEND_API_KEY?.startsWith('re_') || false,
      firstChars: process.env.RESEND_API_KEY?.substring(0, 10) || 'NOT SET',
    },
    fromEmail: process.env.FROM_EMAIL || 'Bin Mukhtar Retail <orders@binmukhtarretail.com>',
    replyToEmail: process.env.REPLY_TO_EMAIL || 'info@binmukhtarretail.com',
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(config);
}

