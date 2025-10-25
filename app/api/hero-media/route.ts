import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { join } from 'path';

type Slide = { type: 'image' | 'video'; src: string; poster?: string | null; order: number };

function parseOrder(name: string): number {
  const m = name.match(/^hero(?:video)?(\d+)?\./i);
  if (!m) return 0;
  const n = m[1] ? parseInt(m[1], 10) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function GET(_req: NextRequest) {
  try {
    const imagesDir = join(process.cwd(), 'public', 'images');
    const videosDir = join(process.cwd(), 'public', 'videos');

    let imageFiles: string[] = [];
    let videoFiles: string[] = [];

    try { imageFiles = await readdir(imagesDir); } catch {}
    try { videoFiles = await readdir(videosDir); } catch {}

    const imageRegex = /^hero(\d+)?\.(png|jpg|jpeg|webp)$/i;
    const videoRegex = /^hero(?:video)?(\d+)?\.(mp4|webm|ogg)$/i;

    const images = imageFiles
      .filter((f) => imageRegex.test(f))
      .map<Slide>((f) => ({ type: 'image', src: `/images/${f}`, order: parseOrder(f) }));

    // Map for posters by base name (e.g., hero2)
    const posterMap = new Map<string, string>();
    for (const f of imageFiles.filter((f) => imageRegex.test(f))) {
      const base = f.replace(/\.(png|jpg|jpeg|webp)$/i, '');
      posterMap.set(base.toLowerCase(), `/images/${f}`);
    }

    const videos = videoFiles
      .filter((f) => videoRegex.test(f))
      .map<Slide>((f) => {
        const base = f.replace(/\.(mp4|webm|ogg)$/i, '');
        const poster = posterMap.get(base.toLowerCase()) || null;
        return { type: 'video', src: `/videos/${f}`, poster, order: parseOrder(f) };
      });

    const slides = [...images, ...videos]
      .sort((a, b) => a.order - b.order)
      .map(({ order, ...rest }) => rest);

    return NextResponse.json({ slides, success: true });
  } catch (error: any) {
    console.error('Failed to list hero media:', error);
    return NextResponse.json({ slides: [], success: false, error: error?.message || 'Failed to read hero media' }, { status: 200 });
  }
}


