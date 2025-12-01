import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';

/**
 * GET /api/stripe/get-session
 * Retrieves Stripe checkout session details
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
      id: session.id,
      metadata: session.metadata || {},
      customer_email: session.customer_email,
      amount_total: session.amount_total,
    });
  } catch (error: any) {
    console.error('Error retrieving session:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve session', message: error.message },
      { status: 500 }
    );
  }
}

