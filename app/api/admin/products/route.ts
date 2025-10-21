import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// GET all products or single product by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    // Get single product by ID
    if (productId) {
      const doc = await adminDb().collection('products').doc(productId).get();
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Product not found', success: false }, { status: 404 });
      }

      const product = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate?.() || new Date(),
      };

      return NextResponse.json({ product, success: true });
    }

    // Get all products (optionally by audience: men|women|children)
    const audience = searchParams.get('audience');
    let productsRef = adminDb().collection('products');
    if (audience) {
      productsRef = productsRef.where('audience', '==', audience.toUpperCase());
    }
    const snapshot = await productsRef.orderBy('createdAt', 'desc').get();
    
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    }));

    return NextResponse.json({ products, success: true });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const productData = {
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      subtitle: body.subtitle || '',
      categoryId: body.categoryId,
      audience: (body.audience || 'MEN').toUpperCase(),
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors: body.colors ? body.colors.split(',').map((c: string) => c.trim()) : [],
      sizes: body.sizes ? body.sizes.split(',').map((s: string) => s.trim()) : [],
      stock: parseInt(body.stock),
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: body.published,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb().collection('products').add(productData);
    
    return NextResponse.json({ 
      success: true, 
      product: { id: docRef.id, ...productData } 
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const productId = body.id;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required', success: false }, { status: 400 });
    }

    const productData = {
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      subtitle: body.subtitle || '',
      categoryId: body.categoryId,
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors: body.colors ? body.colors.split(',').map((c: string) => c.trim()) : [],
      sizes: body.sizes ? body.sizes.split(',').map((s: string) => s.trim()) : [],
      stock: parseInt(body.stock),
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: body.published,
      updatedAt: new Date(),
    };

    await adminDb().collection('products').doc(productId).update(productData);
    
    return NextResponse.json({ 
      success: true, 
      product: { id: productId, ...productData } 
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required', success: false }, { status: 400 });
    }

    await adminDb().collection('products').doc(productId).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}
