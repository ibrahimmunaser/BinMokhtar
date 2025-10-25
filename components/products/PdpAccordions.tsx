'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItem {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

interface PdpAccordionsProps {
  items: AccordionItem[];
}

export function PdpAccordions({ items }: PdpAccordionsProps) {
  const [openItems, setOpenItems] = useState<string[]>(
    items.filter((item) => item.defaultOpen).map((item) => item.title)
  );

  const toggle = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <div className="border-t border-border">
      {items.map((item) => {
        const isOpen = openItems.includes(item.title);
        return (
          <div key={item.title} className="border-b border-border">
            <button
              onClick={() => toggle(item.title)}
              className="w-full flex items-center justify-between py-5 text-left"
            >
              <span className="text-sm font-medium uppercase tracking-wideish">
                {item.title}
              </span>
              <ChevronDown
                className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {isOpen && (
              <div
                className="pb-6 text-sm text-muted prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}









