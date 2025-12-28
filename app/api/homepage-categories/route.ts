import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// GET homepage categories (subcategories with images)
export async function GET() {
  try {
    const subcategoriesRef = adminDb().collection('subcategories');
    const snapshot = await subcategoriesRef
      .where('active', '==', true)
      .where('imageUrl', '!=', null)
      .orderBy('imageUrl') // Required for '!=' query
      .orderBy('sort')
      .orderBy('name')
      .get();
    
    const categories = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        titleEn: data.name,
        titleAr: data.name, // Can be extended later for Arabic names
        href: `/category/${data.slug}`,
        image: data.imageUrl,
        parentCategory: data.parentCategoryId,
      };
    });

    return NextResponse.json({ categories, success: true });
  } catch (error: any) {
    console.error('Error fetching homepage categories:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

