import { NextRequest, NextResponse } from 'next/server';
import { adminUpdateSettings } from '@/lib/admin-data';
import { isAdmin } from '@/lib/utils';

async function verifyAdmin(request: NextRequest) {
  const email = request.headers.get('x-user-email');
  return email && isAdmin(email) ? email : null;
}

export async function PUT(request: NextRequest) {
  const email = await verifyAdmin(request);
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { collection, doc, data } = await request.json();
    await adminUpdateSettings(collection, doc, data);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}




