import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireAdminSession } from '@/lib/adminSessionToken';

export async function POST(request: NextRequest) {
  const authError = requireAdminSession(request);
  if (authError) return authError;
  try {
    const body = await request.json();
    const { type, slug, path } = body;

    // Revalidate based on type
    switch (type) {
      case 'product':
        if (slug) {
          revalidatePath(`/product/${slug}`);
          revalidatePath(`/ar/product/${slug}`);
        }
        revalidateTag('products');
        break;

      case 'category':
        if (slug) {
          revalidatePath(`/category/${slug}`);
          revalidatePath(`/ar/category/${slug}`);
        }
        revalidateTag('categories');
        break;

      case 'homepage':
        revalidatePath('/');
        revalidatePath('/ar');
        revalidateTag('settings');
        break;

      case 'shop':
        revalidatePath('/shop');
        revalidatePath('/ar/shop');
        revalidateTag('products');
        break;

      case 'all-products':
        revalidateTag('products');
        revalidateTag('variants');
        break;

      case 'path':
        if (path) {
          revalidatePath(path);
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid revalidation type' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      revalidated: true,
      timestamp: Date.now()
    });
  } catch (error: any) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: error.message, success: false },
      { status: 500 }
    );
  }
}



