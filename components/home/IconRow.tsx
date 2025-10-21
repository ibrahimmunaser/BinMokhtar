'use client';

import { IconItem } from '@/types';
import * as Icons from 'lucide-react';

interface IconRowProps {
  items: IconItem[];
  locale?: string;
}

export function IconRow({ items, locale = 'en' }: IconRowProps) {
  if (!items || items.length === 0) return null;

  const isRtl = locale === 'ar';

  return (
    <section className="py-12 lg:py-16 bg-surface-3 border-t border-b border-line">
      <div className="container-wide">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {items.map((item, index) => {
            const label = isRtl ? item.labelAr : item.labelEn;
            
            // Dynamically get icon component
            const IconComponent = (Icons as any)[item.iconName] || Icons.Package;

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 flex items-center justify-center mb-4">
                  <IconComponent className="w-10 h-10 text-bmr-stone" strokeWidth={1.5} />
                </div>
                <p className="text-sm uppercase tracking-wide text-bmr-ink font-medium">
                  {label}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


