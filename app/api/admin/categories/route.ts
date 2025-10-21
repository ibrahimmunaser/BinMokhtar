import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/server';

// GET all categories
export async function GET() {
  try {
    const categoriesRef = adminDb().collection('categories');
    const snapshot = await categoriesRef.orderBy('name').get();
    
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ categories, success: true });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const categoryData = {
      name: body.name,
      slug: body.name.toLowerCase().replace(/\s+/g, '-'),
      description: body.description || '',
      active: true,
      productCount: 0,
    };

    const docRef = await adminDb().collection('categories').add(categoryData);
    
    return NextResponse.json({ 
      success: true, 
      category: { id: docRef.id, ...categoryData } 
    });
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// PATCH - Update category
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID required', success: false }, { status: 400 });
    }

    await adminDb().collection('categories').doc(id).update(updates);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}

// DELETE - Delete category
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json({ error: 'Category ID required', success: false }, { status: 400 });
    }

    await adminDb().collection('categories').doc(categoryId).delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: error.message, success: false }, { status: 500 });
  }
}
