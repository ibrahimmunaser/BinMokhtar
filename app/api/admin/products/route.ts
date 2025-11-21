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
    // Support filtering by status for storefront vs admin
    const statusFilter = searchParams.get('status'); // e.g., 'ACTIVE' for storefront
    
    let query = adminDb().collection('products').orderBy('createdAt', 'desc');
    
    // Filter by status if requested (for storefront: only show ACTIVE products)
    if (statusFilter) {
      query = query.where('status', '==', statusFilter) as any;
    }
    
    const snapshot = await query.get();
    
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

    // Validate required fields
    if (!body.name || !body.slug) {
      return NextResponse.json({ 
        error: 'Product name and slug are required', 
        success: false 
      }, { status: 400 });
    }

    // Validate status
    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    const status = body.status || (body.published ? 'ACTIVE' : 'DRAFT');
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
        success: false 
      }, { status: 400 });
    }

    // Check slug uniqueness
    const slugCheck = await adminDb().collection('products')
      .where('slug', '==', body.slug)
      .limit(1)
      .get();
    if (!slugCheck.empty) {
      return NextResponse.json({ 
        error: 'A product with this slug already exists. Please use a different slug.', 
        success: false 
      }, { status: 400 });
    }

    const productData = {
      slug: body.slug, // Use provided slug
      name: body.name,
      subtitle: body.subtitle || '',
      brand: body.brand || 'Bin Mukhtar Retail',
      categoryId: body.categoryId,
      audience: (body.categoryId || body.audience || 'MEN').toUpperCase(),
      status, // DRAFT, ACTIVE, or ARCHIVED
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents (basePrice)
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      // Image fields
      images: body.images || ['/placeholder.svg'], // Legacy
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg', // Legacy
      primaryImageUrl: body.primaryImageUrl || body.images?.[0] || '/placeholder.svg',
      galleryImageUrls: body.galleryImageUrls || body.images || [],
      primaryImageAlt: body.primaryImageAlt || body.name,
      colorImageMappings,
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: status === 'ACTIVE', // Derived from status
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb().collection('products').add(productData);
    
    // Create variants subcollection with validation
    if (normalizedVariants.length > 0 || (Array.isArray(body.variants) && body.variants.length > 0)) {
      const variantsToCreate = Array.isArray(body.variants) && body.variants.length > 0 
        ? body.variants 
        : normalizedVariants;

      // Validate each variant has required fields
      const skuSet = new Set();
      for (const v of variantsToCreate) {
        // SKU is required
        if (!v.sku || v.sku.trim() === '') {
          return NextResponse.json({ 
            error: 'Each variant must have a SKU', 
            success: false 
          }, { status: 400 });
        }
        
        // Check for duplicate SKUs within this product
        if (skuSet.has(v.sku)) {
          return NextResponse.json({ 
            error: `Duplicate SKU found: ${v.sku}. Each variant must have a unique SKU.`, 
            success: false 
          }, { status: 400 });
        }
        skuSet.add(v.sku);

        // Validate price
        const variantPrice = v.price !== undefined ? parseFloat(v.price) : parseFloat(body.price);
        if (isNaN(variantPrice) || variantPrice < 0) {
          return NextResponse.json({ 
            error: 'Variant price must be a non-negative number', 
            success: false 
          }, { status: 400 });
        }

        // Validate stock
        const variantStock = parseInt(String(v.stock || 0));
        if (isNaN(variantStock) || variantStock < 0) {
          return NextResponse.json({ 
            error: 'Variant stock must be a non-negative integer', 
            success: false 
          }, { status: 400 });
        }
      }

      const batch = adminDb().batch();
      const variantsCol = adminDb().collection('products').doc(docRef.id).collection('variants');
      
      variantsToCreate.forEach((v) => {
        const variantRef = variantsCol.doc();
        const variantPrice = v.price !== undefined ? Math.round(parseFloat(v.price) * 100) : Math.round(parseFloat(body.price) * 100);
        const variantSalePrice = v.salePrice ? Math.round(parseFloat(v.salePrice) * 100) : null;
        
        batch.set(variantRef, {
          size: v.size || undefined,
          color: v.color || undefined,
          stock: Math.max(0, parseInt(String(v.stock || 0))),
          sku: v.sku.trim(), // Required, validated above
          barcode: v.barcode ? v.barcode.trim() : null,
          price: variantPrice, // in cents
          salePrice: variantSalePrice, // in cents, optional
          active: parseInt(String(v.stock || 0)) > 0,
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

    // Validate slug uniqueness (if changed)
    const existingDoc = await adminDb().collection('products').doc(productId).get();
    if (!existingDoc.exists) {
      return NextResponse.json({ 
        error: 'Product not found', 
        success: false 
      }, { status: 404 });
    }
    
    const existingData = existingDoc.data();
    if (body.slug && body.slug !== existingData?.slug) {
      const slugCheck = await adminDb().collection('products')
        .where('slug', '==', body.slug)
        .limit(1)
        .get();
      if (!slugCheck.empty && slugCheck.docs[0].id !== productId) {
        return NextResponse.json({ 
          error: 'A product with this slug already exists. Please use a different slug.', 
          success: false 
        }, { status: 400 });
      }
    }

    // Validate status
    const validStatuses = ['DRAFT', 'ACTIVE', 'ARCHIVED'];
    const status = body.status || (body.published ? 'ACTIVE' : existingData?.status || 'DRAFT');
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 
        success: false 
      }, { status: 400 });
    }

    const productData = {
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-'),
      name: body.name,
      subtitle: body.subtitle || '',
      brand: body.brand || existingData?.brand || 'Bin Mukhtar Retail',
      categoryId: body.categoryId,
      status, // DRAFT, ACTIVE, or ARCHIVED
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      // Image fields
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      primaryImageUrl: body.primaryImageUrl || body.images?.[0] || existingData?.primaryImageUrl || '/placeholder.svg',
      galleryImageUrls: body.galleryImageUrls || body.images || existingData?.galleryImageUrls || [],
      primaryImageAlt: body.primaryImageAlt || body.name || existingData?.primaryImageAlt,
      colorImageMappings: body.colorImageMappings || [],
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: status === 'ACTIVE',
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

    if (normalizedVariants.length > 0 || (Array.isArray(body.variants) && body.variants.length > 0)) {
      const variantsToCreate = Array.isArray(body.variants) && body.variants.length > 0 
        ? body.variants 
        : normalizedVariants;

      // Validate each variant has required fields
      const skuSet = new Set();
      for (const v of variantsToCreate) {
        // SKU is required
        if (!v.sku || v.sku.trim() === '') {
          return NextResponse.json({ 
            error: 'Each variant must have a SKU', 
            success: false 
          }, { status: 400 });
        }
        
        // Check for duplicate SKUs within this product
        if (skuSet.has(v.sku)) {
          return NextResponse.json({ 
            error: `Duplicate SKU found: ${v.sku}. Each variant must have a unique SKU.`, 
            success: false 
          }, { status: 400 });
        }
        skuSet.add(v.sku);

        // Validate price
        const variantPrice = v.price !== undefined ? parseFloat(v.price) : parseFloat(body.price);
        if (isNaN(variantPrice) || variantPrice < 0) {
          return NextResponse.json({ 
            error: 'Variant price must be a non-negative number', 
            success: false 
          }, { status: 400 });
        }

        // Validate stock
        const variantStock = parseInt(String(v.stock || 0));
        if (isNaN(variantStock) || variantStock < 0) {
          return NextResponse.json({ 
            error: 'Variant stock must be a non-negative integer', 
            success: false 
          }, { status: 400 });
        }
      }

      const batch = adminDb().batch();
      variantsToCreate.forEach((v) => {
        const ref = variantsColRef.doc();
        const variantPrice = v.price !== undefined ? Math.round(parseFloat(v.price) * 100) : Math.round(parseFloat(body.price) * 100);
        const variantSalePrice = v.salePrice ? Math.round(parseFloat(v.salePrice) * 100) : null;
        
        batch.set(ref, {
          size: v.size || undefined,
          color: v.color || undefined,
          stock: Math.max(0, parseInt(String(v.stock || 0))),
          sku: v.sku.trim(),
          barcode: v.barcode ? v.barcode.trim() : null,
          price: variantPrice, // in cents
          salePrice: variantSalePrice, // in cents, optional
          active: parseInt(String(v.stock || 0)) > 0,
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
