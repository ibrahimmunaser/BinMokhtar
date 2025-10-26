import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// GET all products or single product by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const slug = searchParams.get('slug');

    // Get single product by ID
    if (productId) {
      const doc = await adminDb().collection('products').doc(productId).get();
      
      if (!doc.exists) {
        return NextResponse.json({ error: 'Product not found', success: false }, { status: 404 });
      }

      // Fetch variants subcollection
      const variantsSnap = await adminDb().collection('products').doc(productId).collection('variants').get();
      const variants = variantsSnap.docs.map((v) => ({ id: v.id, ...v.data() }));

      const product = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate?.() || new Date(),
        variants,
      };

      return NextResponse.json({ product, success: true });
    }

    // Get product by slug
    if (slug) {
      const snapshot = await adminDb().collection('products').where('slug', '==', slug).limit(1).get();
      if (snapshot.empty) {
        return NextResponse.json({ error: 'Product not found', success: false }, { status: 404 });
      }
      const doc = snapshot.docs[0];

      // Fetch variants subcollection
      const variantsSnap = await adminDb().collection('products').doc(doc.id).collection('variants').get();
      const variants = variantsSnap.docs.map((v) => ({ id: v.id, ...v.data() }));

      const product = {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data()?.createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data()?.updatedAt?.toDate?.() || new Date(),
        variants,
      };

      return NextResponse.json({ product, success: true });
    }

    // Get all products (client may filter)
    const productsRef = adminDb().collection('products');
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
    
    const sizes: string[] = Array.isArray(body.sizes)
      ? body.sizes
      : (typeof body.sizes === 'string' && body.sizes.length > 0
          ? body.sizes.split(',').map((s: string) => s.trim())
          : []);
    const colors: string[] = Array.isArray(body.colors)
      ? body.colors
      : (typeof body.colors === 'string' && body.colors.length > 0
          ? body.colors.split(',').map((c: string) => c.trim())
          : []);

    const variantsInput: any[] = Array.isArray(body.variants) ? body.variants : [];
    const normalizedVariants = variantsInput
      .map((v) => ({
        size: v.size || undefined,
        color: v.color || undefined,
        stock: Math.max(0, parseInt(String(v.stock || 0))),
      }))
      .filter((v) => (v.size || v.color) && Number.isFinite(v.stock));

    const totalStock = normalizedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

    // Handle colorImageMappings
    const colorImageMappings = Array.isArray(body.colorImageMappings) 
      ? body.colorImageMappings.filter((m: any) => m.color && Array.isArray(m.imageUrls))
      : [];

    const productData = {
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      subtitle: body.subtitle || '',
      categoryId: body.categoryId,
      audience: (body.categoryId || body.audience || 'MEN').toUpperCase(),
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      colorImageMappings,
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: body.published,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb().collection('products').add(productData);
    
    // Create variants subcollection
    if (normalizedVariants.length > 0) {
      const batch = adminDb().batch();
      const variantsCol = adminDb().collection('products').doc(docRef.id).collection('variants');
      normalizedVariants.forEach((v, idx) => {
        const variantRef = variantsCol.doc();
        batch.set(variantRef, {
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: `SKU-${Date.now()}-${idx}`,
          active: v.stock > 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }
    
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

    const sizes: string[] = Array.isArray(body.sizes)
      ? body.sizes
      : (typeof body.sizes === 'string' && body.sizes.length > 0
          ? body.sizes.split(',').map((s: string) => s.trim())
          : []);
    const colors: string[] = Array.isArray(body.colors)
      ? body.colors
      : (typeof body.colors === 'string' && body.colors.length > 0
          ? body.colors.split(',').map((c: string) => c.trim())
          : []);

    const variantsInput: any[] = Array.isArray(body.variants) ? body.variants : [];
    const normalizedVariants = variantsInput
      .map((v) => ({
        size: v.size || undefined,
        color: v.color || undefined,
        stock: Math.max(0, parseInt(String(v.stock || 0))),
      }))
      .filter((v) => (v.size || v.color) && Number.isFinite(v.stock));

    const totalStock = normalizedVariants.reduce((sum, v) => sum + (v.stock || 0), 0);

    const productData = {
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      subtitle: body.subtitle || '',
      categoryId: body.categoryId,
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: body.published,
      updatedAt: new Date(),
    };

    await adminDb().collection('products').doc(productId).update(productData);
    
    // Replace variants subcollection
    const variantsColRef = adminDb().collection('products').doc(productId).collection('variants');
    const existing = await variantsColRef.get();
    if (!existing.empty) {
      const delBatch = adminDb().batch();
      existing.docs.forEach((d) => delBatch.delete(d.ref));
      await delBatch.commit();
    }

    if (normalizedVariants.length > 0) {
      const batch = adminDb().batch();
      normalizedVariants.forEach((v, idx) => {
        const ref = variantsColRef.doc();
        batch.set(ref, {
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: `SKU-${Date.now()}-${idx}`,
          active: v.stock > 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
      await batch.commit();
    }
    
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
