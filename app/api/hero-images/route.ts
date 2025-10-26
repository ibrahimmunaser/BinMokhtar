import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

export async function GET(_req: NextRequest) {
  try {
    const dir = join(process.cwd(), 'public', 'images');
    const files = await readdir(dir);
    const heroes = files
      .filter((f) => /^hero(\d+)?\.(png|jpg|jpeg|webp)$/i.test(f))
      .sort((a, b) => {
        const pa = a.match(/^hero(\d+)?\./i)?.[1];
        const pb = b.match(/^hero(\d+)?\./i)?.[1];
        const na = pa ? parseInt(pa, 10) : 0;
        const nb = pb ? parseInt(pb, 10) : 0;
        return na - nb;
      })
      .map((f) => `/images/${f}`);

    return NextResponse.json({ images: heroes, success: true });
  } catch (error: any) {
    console.error('Failed to list hero images:', error);
    return NextResponse.json({ images: [], success: false, error: error?.message || 'Failed to read images' }, { status: 200 });
  }
}



