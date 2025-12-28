import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// Helper function to format category display name
function formatCategoryName(subcategoryName: string, parentCategory: string): string {
  // For Shemaghs: subcategory name + "Shemaghs" (e.g., "Traditional Shemaghs")
  if (parentCategory === 'Shemaghs') {
    return `${subcategoryName} Shemaghs`;
  }
  
  // For others: add prefix (e.g., "Men's Emirati Thobes")
  const prefixes: Record<string, string> = {
    'Men': "Men's",
    'Boys': "Boys'",
    'Women': "Women's",
    'Girls': "Girls'",
  };
  
  const prefix = prefixes[parentCategory];
  return prefix ? `${prefix} ${subcategoryName}` : subcategoryName;
}

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
        const displayName = formatCategoryName(data.name, data.parentCategoryId);
        
        return {
          id: doc.id,
          titleEn: displayName,
          titleAr: displayName, // Can be extended later for Arabic names
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

