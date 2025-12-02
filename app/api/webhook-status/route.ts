import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/webhook-status
 * Comprehensive diagnostic endpoint for webhook configuration
 */
export async function GET() {
  const status: any = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      isProduction: process.env.NODE_ENV === 'production',
    },
    stripe: {
      secretKey: {
        exists: !!process.env.STRIPE_SECRET_KEY,
        length: process.env.STRIPE_SECRET_KEY?.length || 0,
        startsWithSk: process.env.STRIPE_SECRET_KEY?.startsWith('sk_') || false,
        firstChars: process.env.STRIPE_SECRET_KEY?.substring(0, 10) || 'NOT SET',
      },
      webhookSecret: {
        exists: !!process.env.STRIPE_WEBHOOK_SECRET,
        length: process.env.STRIPE_WEBHOOK_SECRET?.length || 0,
        startsWithWhsec: process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') || false,
        firstChars: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) || 'NOT SET',
        lastChars: process.env.STRIPE_WEBHOOK_SECRET?.substring(process.env.STRIPE_WEBHOOK_SECRET.length - 10) || 'NOT SET',
      },
      publishableKey: {
        exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        length: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.length || 0,
        startsWithPk: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_') || false,
        firstChars: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 10) || 'NOT SET',
      },
    },
    email: {
      resendApiKey: {
        exists: !!process.env.RESEND_API_KEY,
        length: process.env.RESEND_API_KEY?.length || 0,
        startsWithRe: process.env.RESEND_API_KEY?.startsWith('re_') || false,
        firstChars: process.env.RESEND_API_KEY?.substring(0, 10) || 'NOT SET',
      },
      fromEmail: process.env.FROM_EMAIL || 'NOT SET',
      replyToEmail: process.env.REPLY_TO_EMAIL || 'NOT SET',
    },
    firebase: {
      serviceAccountJson: {
        exists: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
        length: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.length || 0,
        firstChars: process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.substring(0, 20) || 'NOT SET',
      },
    },
    googleMaps: {
      apiKey: {
        exists: !!process.env.GOOGLE_MAPS_API_KEY,
        length: process.env.GOOGLE_MAPS_API_KEY?.length || 0,
        firstChars: process.env.GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'NOT SET',
      },
      publicApiKey: {
        exists: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        length: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.length || 0,
        firstChars: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.substring(0, 10) || 'NOT SET',
      },
    },
    checks: {
      allStripeConfigured: !!(
        process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_WEBHOOK_SECRET &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
      ),
      allEmailConfigured: !!(
        process.env.RESEND_API_KEY &&
        process.env.FROM_EMAIL &&
        process.env.REPLY_TO_EMAIL
      ),
      allFirebaseConfigured: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      allGoogleMapsConfigured: !!(
        process.env.GOOGLE_MAPS_API_KEY &&
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      ),
    },
  };

  return NextResponse.json(status, { status: 200 });
}

