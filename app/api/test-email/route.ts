import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Mark as dynamic route (uses request body)
export const dynamic = 'force-dynamic';

/**
 * POST /api/test-email
 * Test endpoint to verify email sending works
 * 
 * Body: { "email": "your@email.com" }
 */
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email address required' },
        { status: 400 }
      );
    }

    console.log('🧪 Testing email send to:', email);
    console.log('🧪 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY);

    // Send test email
    const result = await sendOrderConfirmationEmail({
      customerEmail: email,
      customerName: 'Test Customer',
      orderId: 'test-order-123',
      orderNumber: 'TEST1234',
      items: [
        {
          title: 'Test Product',
          qty: 1,
          unitPrice: 3199, // $31.99 in cents
          imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
        },
      ],
      subtotal: 3199,
      shipping: 0,
      tax: 0,
      total: 3199,
      currency: 'USD',
      fulfillmentMethod: 'pickup',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully!',
        emailId: result.emailId,
        checkYourEmail: email,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: 'Failed to send test email. Check server logs for details.',
        },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('❌ Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: 'Error testing email',
      },
      { status: 500 }
    );
  }
}

