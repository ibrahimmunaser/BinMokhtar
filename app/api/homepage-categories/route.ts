import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// GET homepage categories (subcategories with images)
export async function GET() {
  try {
    const subcategoriesRef = adminDb().collection('subcategories');
    
    // Fetch all subcategories without any where/orderBy to avoid index requirement
    const snapshot = await subcategoriesRef.get();
    
    // Filter for active subcategories with images and sort in memory
    const categories = snapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          titleEn: data.name,
          titleAr: data.name, // Can be extended later for Arabic names
          href: `/category/${data.slug}`,
          image: data.imageUrl,
          parentCategory: data.parentCategoryId,
          active: data.active,
          sort: data.sort || 0,
        };
      })
      .filter(cat => cat.active !== false && cat.image) // Filter in memory
      .sort((a, b) => a.sort - b.sort); // Sort by sort field

    return NextResponse.json({ categories, success: true });
  } catch (error: any) {
    console.error('Error fetching homepage categories:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

