import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stripe/check-session
 * Diagnostic endpoint to check checkout session status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      sessionId: session.id,
      status: session.status, // 'complete', 'open', 'expired'
      paymentStatus: session.payment_status, // 'paid', 'unpaid', 'no_payment_required'
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      mode: session.mode, // 'payment', 'subscription', 'setup'
      created: new Date(session.created * 1000).toISOString(),
      metadata: session.metadata || {},
      // Check if payment was actually completed
      isPaid: session.payment_status === 'paid' && session.status === 'complete',
      // Check if webhook event should have been generated
      shouldHaveWebhook: session.payment_status === 'paid' && session.status === 'complete',
    });
  } catch (error: any) {
    console.error('Error checking session:', error);
    return NextResponse.json(
      { error: 'Failed to check session', message: error.message },
      { status: 500 }
    );
  }
}

