import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { requireAdminSession } from '@/lib/adminSessionToken';

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

      const docData = doc.data();
      
      // Ensure tags are always included, even if empty
      const product = {
        id: doc.id,
        ...docData,
        tags: Array.isArray(docData?.tags) ? docData.tags : (docData?.tags ? [docData.tags] : []),
        createdAt: docData?.createdAt?.toDate?.() || new Date(),
        updatedAt: docData?.updatedAt?.toDate?.() || new Date(),
        variants,
      };

      console.log('📦 API GET - Product tags:', {
        rawTags: docData?.tags,
        tagsType: typeof docData?.tags,
        isArray: Array.isArray(docData?.tags),
        finalTags: product.tags,
      });

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

      const docData = doc.data();
      
      // Ensure tags are always included, even if empty
      const product = {
        id: doc.id,
        ...docData,
        tags: Array.isArray(docData?.tags) ? docData.tags : (docData?.tags ? [docData.tags] : []),
        createdAt: docData?.createdAt?.toDate?.() || new Date(),
        updatedAt: docData?.updatedAt?.toDate?.() || new Date(),
        variants,
      };

      return NextResponse.json({ product, success: true });
    }

    // Get all products (client may filter)
    // Support filtering by status for storefront vs admin
    const statusFilter = searchParams.get('status'); // e.g., 'ACTIVE' for storefront
    
    let query;
    
    // Filter by status if requested (for storefront: only show ACTIVE products)
    if (statusFilter) {
      // Don't use orderBy with status filter to avoid requiring a composite index
      query = adminDb().collection('products').where('status', '==', statusFilter);
    } else {
      // Only use orderBy when not filtering by status
      query = adminDb().collection('products').orderBy('createdAt', 'desc');
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
  const authError = requireAdminSession(request);
  if (authError) return authError;
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
    
    // Calculate total stock from ALL variants BEFORE filtering
    const totalStock = variantsInput.reduce((sum, v) => {
      const stock = Math.max(0, parseInt(String(v.stock || 0)));
      return sum + stock;
    }, 0);
    
    // Normalize variants for storage (only filter out completely invalid entries)
    const normalizedVariants = variantsInput
      .map((v) => ({
        size: v.size || undefined,
        color: v.color || undefined,
        stock: Math.max(0, parseInt(String(v.stock || 0))),
      }))
      .filter((v) => Number.isFinite(v.stock)); // Only filter if stock is invalid, not based on size/color

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
      subcategory: body.subcategory || '', // Save subcategory
      status, // DRAFT, ACTIVE, or ARCHIVED
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents (basePrice)
      weight_grams: body.weight_grams ? Math.round(Number(body.weight_grams)) : undefined, // Weight in grams
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      // Counts object for dashboard display
      counts: {
        variants: normalizedVariants.length,
        activeVariants: normalizedVariants.filter(v => v.stock > 0).length,
        totalStock: Number.isFinite(totalStock) ? totalStock : 0,
        reviewCount: 0,
        ratingAvg: 0,
      },
      // Image fields
      images: body.images || ['/placeholder.svg'], // Legacy
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg', // Legacy
      primaryImageUrl: body.primaryImageUrl || body.images?.[0] || '/placeholder.svg',
      galleryImageUrls: body.galleryImageUrls || body.images || [],
      primaryImageAlt: body.primaryImageAlt || body.name,
      colorImageMappings,
      tags: Array.isArray(body.tags) ? body.tags : [],
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
      
      variantsToCreate.forEach((v: any) => {
        const variantRef = variantsCol.doc();
        // CRITICAL: Form already converts variant prices to cents (line 392 of CreateProductForm.tsx)
        // Do NOT multiply by 100 again or you'll get double conversion bug ($19.99 → 1999 → 199900)
        const variantPrice = v.price !== undefined ? Math.round(parseFloat(v.price)) : Math.round(parseFloat(body.price) * 100);
        const variantSalePrice = v.salePrice ? Math.round(parseFloat(v.salePrice)) : null;
        
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
  const authError = requireAdminSession(request);
  if (authError) return authError;
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
    
    // Calculate total stock from ALL variants BEFORE filtering
    const totalStock = variantsInput.reduce((sum, v) => {
      const stock = Math.max(0, parseInt(String(v.stock || 0)));
      return sum + stock;
    }, 0);
    
    // Normalize variants for storage (only filter out completely invalid entries)
    const normalizedVariants = variantsInput
      .map((v) => ({
        size: v.size || undefined,
        color: v.color || undefined,
        stock: Math.max(0, parseInt(String(v.stock || 0))),
      }))
      .filter((v) => Number.isFinite(v.stock)); // Only filter if stock is invalid, not based on size/color

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
      subcategory: body.subcategory || existingData?.subcategory || '', // Save subcategory
      status, // DRAFT, ACTIVE, or ARCHIVED
      price: Math.round(parseFloat(body.price) * 100), // Convert to cents
      weight_grams: body.weight_grams ? Math.round(Number(body.weight_grams)) : undefined, // Weight in grams
      compareAtPrice: body.compareAtPrice ? Math.round(parseFloat(body.compareAtPrice) * 100) : null,
      colors,
      sizes,
      sleeve: body.sleeve === 'short' || body.sleeve === 'long' ? body.sleeve : null,
      stock: Number.isFinite(totalStock) ? totalStock : 0,
      // Counts object for dashboard display (CRITICAL for inventory management)
      counts: {
        variants: normalizedVariants.length,
        activeVariants: normalizedVariants.filter(v => v.stock > 0).length,
        totalStock: Number.isFinite(totalStock) ? totalStock : 0,
        reviewCount: existingData?.counts?.reviewCount || 0,
        ratingAvg: existingData?.counts?.ratingAvg || 0,
      },
      // Image fields
      images: body.images || ['/placeholder.svg'],
      thumbnail: body.thumbnail || body.images?.[0] || '/placeholder.svg',
      primaryImageUrl: body.primaryImageUrl || body.images?.[0] || existingData?.primaryImageUrl || '/placeholder.svg',
      galleryImageUrls: body.galleryImageUrls || body.images || existingData?.galleryImageUrls || [],
      primaryImageAlt: body.primaryImageAlt || body.name || existingData?.primaryImageAlt,
      colorImageMappings: body.colorImageMappings || [],
      tags: Array.isArray(body.tags) ? body.tags : (existingData?.tags || []),
      descriptionHtml: body.description ? `<p>${body.description}</p>` : '',
      published: status === 'ACTIVE',
      updatedAt: new Date(),
    };

    await adminDb().collection('products').doc(productId).update(productData);
    
    // ── Update variants subcollection (update in-place by SKU, preserve doc IDs) ──
    // This prevents carts that reference a variantId from going stale after every admin save.
    const variantsColRef = adminDb().collection('products').doc(productId).collection('variants');
    const existingVariantsSnap = await variantsColRef.get();

    // Build a map of SKU → existing doc reference
    const existingBySku = new Map<string, FirebaseFirestore.DocumentReference>();
    existingVariantsSnap.docs.forEach((d) => {
      const sku = d.data()?.sku;
      if (sku) existingBySku.set(sku, d.ref);
    });

    const incomingSkus = new Set<string>();
    const finalVariantStocks: number[] = []; // collect delta-adjusted stocks for aggregate recompute

    // Guard: if variants array is explicitly provided but empty AND the product already has
    // variants in Firestore, reject the request — this almost certainly indicates a form
    // serialisation bug that would wipe the entire subcollection.
    if (Array.isArray(body.variants) && body.variants.length === 0 && existingVariantsSnap.size > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot remove all variants via this endpoint. If you intended to remove specific variants, send the remaining variants explicitly.',
          success: false,
        },
        { status: 400 }
      );
    }

    if (Array.isArray(body.variants) && body.variants.length > 0) {
      // Validate
      const skuSet = new Set();
      for (const v of body.variants) {
        if (!v.sku || v.sku.trim() === '') {
          return NextResponse.json({ error: 'Each variant must have a SKU', success: false }, { status: 400 });
        }
        if (skuSet.has(v.sku)) {
          return NextResponse.json({ error: `Duplicate SKU: ${v.sku}`, success: false }, { status: 400 });
        }
        skuSet.add(v.sku);

        const variantPrice = v.price !== undefined ? parseFloat(v.price) : parseFloat(body.price);
        if (isNaN(variantPrice) || variantPrice < 0) {
          return NextResponse.json({ error: 'Variant price must be a non-negative number', success: false }, { status: 400 });
        }
        const variantStock = parseInt(String(v.stock || 0));
        if (isNaN(variantStock) || variantStock < 0) {
          return NextResponse.json({ error: 'Variant stock must be a non-negative integer', success: false }, { status: 400 });
        }
      }

      const batch = adminDb().batch();
      for (const v of body.variants) {
        // CRITICAL: Form already converts variant prices to cents
        const variantPrice = v.price !== undefined ? Math.round(parseFloat(v.price)) : Math.round(parseFloat(body.price) * 100);
        const variantSalePrice = v.salePrice ? Math.round(parseFloat(v.salePrice)) : null;
        const variantStock = Math.max(0, parseInt(String(v.stock || 0)));
        const sku = v.sku.trim();
        incomingSkus.add(sku);

        // Delta-based stock: use the difference between the admin's new value and what
        // they saw when the form loaded (loadedStock), applied to the current DB value.
        // This prevents stale form data from reverting order-decrements while still
        // allowing genuine restocking.
        // Formula: finalStock = currentDB + (incomingStock - loadedStock)
        let finalStock = variantStock;
        if (existingBySku.has(sku) && v.loadedStock !== undefined) {
          const existingDoc = existingVariantsSnap.docs.find(d => d.data()?.sku === sku);
          const currentDbStock: number = existingDoc?.data()?.stock ?? variantStock;
          const delta = variantStock - Math.max(0, parseInt(String(v.loadedStock || 0)));
          finalStock = Math.max(0, currentDbStock + delta);
        }

        const variantData = {
          size: v.size || undefined,
          color: v.color || undefined,
          stock: finalStock,
          sku,
          barcode: v.barcode ? v.barcode.trim() : null,
          price: variantPrice,
          salePrice: variantSalePrice,
          active: finalStock > 0,
          updatedAt: new Date(),
        };

        finalVariantStocks.push(finalStock);

        if (existingBySku.has(sku)) {
          // Update existing doc — preserve its ID
          batch.update(existingBySku.get(sku)!, variantData);
        } else {
          // New SKU → create new doc
          const newRef = variantsColRef.doc();
          batch.set(newRef, { ...variantData, createdAt: new Date() });
        }
      }

      // Delete variants whose SKUs are no longer in the incoming list
      existingVariantsSnap.docs.forEach((d) => {
        if (!incomingSkus.has(d.data()?.sku)) {
          batch.delete(d.ref);
        }
      });

      await batch.commit();

      // Recompute product aggregate with delta-adjusted stocks
      const realTotalStock = finalVariantStocks.reduce((sum, s) => sum + s, 0);
      const realActiveVariants = finalVariantStocks.filter(s => s > 0).length;
      await adminDb().collection('products').doc(productId).update({
        stock: realTotalStock,
        'counts.totalStock': realTotalStock,
        'counts.activeVariants': realActiveVariants,
        'counts.variants': finalVariantStocks.length,
        updatedAt: new Date(),
      });
    } else {
      // No variants sent — delete all existing variants
      if (!existingVariantsSnap.empty) {
        const delBatch = adminDb().batch();
        existingVariantsSnap.docs.forEach((d) => delBatch.delete(d.ref));
        await delBatch.commit();
      }
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
  const authError = requireAdminSession(request);
  if (authError) return authError;
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
