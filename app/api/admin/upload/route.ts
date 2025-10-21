import { NextRequest, NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebase/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided', success: false }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image', success: false }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB', success: false }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `products/${timestamp}-${randomString}.${extension}`;

    // Upload to Firebase Storage
    const bucket = adminStorage().bucket();
    const fileUpload = bucket.file(filename);

    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
      public: true, // Make file publicly accessible
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      filename 
    });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to upload file', 
      success: false 
    }, { status: 500 });
  }
}

// DELETE - Remove uploaded image
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json({ error: 'Filename required', success: false }, { status: 400 });
    }

    const bucket = adminStorage().bucket();
    await bucket.file(filename).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to delete file', 
      success: false 
    }, { status: 500 });
  }
}


