'use client';

import { useHomeSettings } from '@/hooks/useData';

export function TopBar() {
  const { settings } = useHomeSettings();

  // Default values if Firestore isn't set up yet
  const leftLine = settings?.topBar?.leftLine || "Premium Traditional Attire";
  const rightLine = settings?.topBar?.rightLine || "Free shipping over $99";

  return (
    <div className="border-b border-border bg-bmr-white">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center sm:justify-between h-9 text-[11px] tracking-wide">
          <div className="text-muted">{leftLine}</div>
          <div className="h-3 w-px bg-border mx-4 hidden sm:block" />
          <div className="text-muted hidden sm:block">{rightLine}</div>
        </div>
      </div>
    </div>
  );
}

