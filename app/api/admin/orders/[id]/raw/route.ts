import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const db = adminDb();
    const orderDoc = await db.collection('orders').doc(params.id).get();
    
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'Order not found', success: false }, { status: 404 });
    }
    
    const data = orderDoc.data();
    
    // Return raw data with type information
    return NextResponse.json({
      success: true,
      order: {
        id: orderDoc.id,
        ...data,
        _debug: {
          createdAt_type: typeof data?.createdAt,
          createdAt_constructor: data?.createdAt?.constructor?.name,
          createdAt_hasToDate: typeof data?.createdAt?.toDate === 'function',
          createdAt_raw: data?.createdAt?.toString?.() || String(data?.createdAt),
          createdAt_toDate: data?.createdAt?.toDate?.() || null,
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching raw order:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}

