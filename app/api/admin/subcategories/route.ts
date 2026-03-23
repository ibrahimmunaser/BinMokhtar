import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { FIREBASE_IMAGES } from '@/lib/firebase-images';

// Default subcategories - these should always exist
const DEFAULT_SUBCATEGORIES = [
  { name: 'Emirati Thobes', slug: 'emirati', description: 'Emirati style thobes', parentCategoryId: 'Men', active: true, sort: 1, imageUrl: FIREBASE_IMAGES.HERO_EMIRATI },
  { name: 'Saudi Thobes', slug: 'saudi', description: 'Saudi style thobes', parentCategoryId: 'Men', active: true, sort: 2, imageUrl: FIREBASE_IMAGES.HERO_SAUDI },
  { name: 'Hijabs', slug: 'hijabs', description: 'Elegant hijabs', parentCategoryId: 'Women', active: true, sort: 1 },
  { name: 'Abayas', slug: 'abayas', description: 'Traditional abayas', parentCategoryId: 'Women', active: true, sort: 2 },
  { name: 'Emirati Thobes', slug: 'thobes', description: 'Boys Emirati thobes', parentCategoryId: 'Boys', active: true, sort: 1, imageUrl: FIREBASE_IMAGES.BOYS_HERO },
  { name: 'Traditional', slug: 'traditional', description: 'Traditional shemaghs', parentCategoryId: 'Shemaghs', active: true, sort: 1, imageUrl: FIREBASE_IMAGES.HERO_TRADITIONAL },
  { name: 'Yemeni', slug: 'yemeni', description: 'Yemeni style shemaghs', parentCategoryId: 'Shemaghs', active: true, sort: 2, imageUrl: FIREBASE_IMAGES.HERO_YEMENI },
];

// Ensure default subcategories exist (adds missing ones without removing existing data)
// IMPORTANT: Does NOT re-add deleted categories (active: false or deletedAt exists)
async function ensureDefaultsExist() {
  const subcategoriesRef = adminDb().collection('subcategories');
  
  // Get all existing subcategories (including deleted ones)
  const snapshot = await subcategoriesRef.get();
  const existingBySlug = new Map<string, any>();
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.slug) {
      existingBySlug.set(data.slug, { id: doc.id, ...data });
    }
  });
  
  // Add any missing defaults or update existing ones with missing imageUrl
  const batch = adminDb().batch();
  let addedCount = 0;
  let updatedCount = 0;
  
  for (const sub of DEFAULT_SUBCATEGORIES) {
    const existing = existingBySlug.get(sub.slug);
    
    if (!existing) {
      // Add new subcategory ONLY if it doesn't exist at all
      console.log(`Adding missing default subcategory: ${sub.name} (${sub.slug})`);
      const docRef = subcategoriesRef.doc();
      batch.set(docRef, {
        ...sub,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addedCount++;
    } else if (existing.deletedAt || existing.active === false) {
      // SKIP: Do not re-add deleted categories
      console.log(`Skipping deleted subcategory: ${sub.name} (${sub.slug})`);
    } else if (sub.imageUrl && !existing.imageUrl) {
      // Update existing ACTIVE subcategory with imageUrl if it doesn't have one
      console.log(`Updating subcategory ${sub.name} (${sub.slug}) with imageUrl`);
      const docRef = subcategoriesRef.doc(existing.id);
      batch.update(docRef, {
        imageUrl: sub.imageUrl,
        updatedAt: new Date(),
      });
      updatedCount++;
    }
  }
  
  if (addedCount > 0 || updatedCount > 0) {
    await batch.commit();
    console.log(`Added ${addedCount} and updated ${updatedCount} subcategories`);
  }
  
  return addedCount + updatedCount;
}

// GET all subcategories (optionally filter by parent category)
export async function GET(request: NextRequest) {
  try {
    // Ensure default subcategories exist (adds missing ones)
    await ensureDefaultsExist();
    
    const { searchParams } = new URL(request.url);
    const parentCategoryId = searchParams.get('parentCategoryId');
    
    let query = adminDb().collection('subcategories').orderBy('name');
    
    if (parentCategoryId) {
      query = adminDb().collection('subcategories')
        .where('parentCategoryId', '==', parentCategoryId)
        .orderBy('name');
    }
    
    const snapshot = await query.get();
    
    const subcategories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ subcategories, success: true });
  } catch (error: any) {
    console.error('Error fetching subcategories:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// POST - Create new subcategory
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.name || !body.parentCategoryId) {
      return NextResponse.json({ 
        error: 'Name and parentCategoryId are required', 
        success: false 
      }, { status: 400 });
    }
    
    const subcategoryData = {
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: body.description || '',
      parentCategoryId: body.parentCategoryId,
      imageUrl: body.imageUrl || null, // Add imageUrl support
      active: body.active !== false, // Default to true
      sort: body.sort || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await adminDb().collection('subcategories').add(subcategoryData);
    
    return NextResponse.json({ 
      success: true, 
      subcategory: { id: docRef.id, ...subcategoryData } 
    });
  } catch (error: any) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// PATCH - Update subcategory
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Subcategory ID required', success: false }, { status: 400 });
    }

    // Update the slug if name changes
    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    }
    
    updates.updatedAt = new Date();

    await adminDb().collection('subcategories').doc(id).update(updates);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating subcategory:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// DELETE - Delete subcategory (soft delete by setting active: false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('id');
    const hardDelete = searchParams.get('hard') === 'true'; // Allow hard delete with ?hard=true

    if (!subcategoryId) {
      return NextResponse.json({ error: 'Subcategory ID required', success: false }, { status: 400 });
    }

    if (hardDelete) {
      // HARD DELETE: Permanently remove from database
      console.log(`⚠️ Hard deleting subcategory ${subcategoryId}`);
      await adminDb().collection('subcategories').doc(subcategoryId).delete();
    } else {
      // SOFT DELETE: Mark as inactive (recommended - preserves data)
      console.log(`✅ Soft deleting subcategory ${subcategoryId} (setting active: false)`);
      await adminDb().collection('subcategories').doc(subcategoryId).update({
        active: false,
        deletedAt: new Date(),
        updatedAt: new Date(),
      });
    }
    
    // Return success with cache-busting headers to force homepage refresh
    return NextResponse.json(
      { success: true, hardDelete },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Cache-Invalidated': 'true',
        },
      }
    );
  } catch (error: any) {
    console.error('Error deleting subcategory:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

