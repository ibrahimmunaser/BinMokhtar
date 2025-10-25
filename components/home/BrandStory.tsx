'use client';

import Link from 'next/link';
import { StoryBlock } from '@/types';

interface BrandStoryProps {
  title?: string;
  storyBlocks: StoryBlock[];
  locale?: string;
}

export function BrandStory({
  title = 'BMR — Luxury Thobes & Modest Fashion',
  storyBlocks,
  locale = 'en',
}: BrandStoryProps) {
  if (!storyBlocks || storyBlocks.length === 0) return null;

  const isRtl = locale === 'ar';

  return (
    <section className="py-16 lg:py-24 bg-surface-2">
      <div className="container-narrow">
        <h2 className="font-display text-3xl md:text-4xl font-medium text-center mb-12">
          {title}
        </h2>

        <div className="space-y-8 max-w-3xl mx-auto">
          {storyBlocks.map((block, index) => {
            const blockTitle = isRtl ? block.titleAr : block.titleEn;
            const body = isRtl ? block.bodyAr : block.bodyEn;

            return (
              <div key={index} className="prose prose-lg max-w-none">
                {blockTitle && (
                  <h3 className="font-display text-2xl font-medium mb-4">
                    {blockTitle}
                  </h3>
                )}
                <p className="text-bmr-muted leading-relaxed">
                  {body}
                </p>
              </div>
            );
          })}
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
          <Link
            href="/size-guide"
            className="text-sm uppercase tracking-wide text-bmr-ink hover:underline"
          >
            Size Guide
          </Link>
          <span className="text-bmr-muted">•</span>
          <Link
            href="/care"
            className="text-sm uppercase tracking-wide text-bmr-ink hover:underline"
          >
            Care Instructions
          </Link>
        </div>
      </div>
    </section>
  );
}







