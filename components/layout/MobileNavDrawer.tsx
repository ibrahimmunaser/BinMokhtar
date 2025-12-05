'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { NavItem } from '@/types';

// Navigation structure: Men, Boys, Shemaghs, About, Contact
const defaultNavigation: NavItem[] = [
  {
    id: 'men',
    labelEn: 'Men',
    labelAr: 'رجال',
    href: '/category/men',
    sort: 1,
    children: [
      { id: 'emirati', labelEn: 'Emirati Thobes', labelAr: 'ثوب إماراتي', href: '/category/emirati', sort: 1 },
      { id: 'saudi', labelEn: 'Saudi Thobes', labelAr: 'ثوب سعودي', href: '/category/saudi', sort: 2 },
    ],
  },
  {
    id: 'boys',
    labelEn: 'Boys',
    labelAr: 'أولاد',
    href: '/category/boys',
    sort: 2,
    children: [
      { id: 'thobes', labelEn: 'Emirati Thobes', labelAr: 'ثوب إماراتي', href: '/category/thobes', sort: 1 },
    ],
  },
  {
    id: 'shemaghs',
    labelEn: 'Shemaghs',
    labelAr: 'شماغ',
    href: '/category/shemaghs',
    sort: 3,
    children: [
      { id: 'traditional', labelEn: 'Traditional', labelAr: 'تقليدي', href: '/category/traditional', sort: 1 },
      { id: 'yemeni', labelEn: 'Yemeni', labelAr: 'يمني', href: '/category/yemeni', sort: 2 },
    ],
  },
  { id: 'about', labelEn: 'ABOUT', labelAr: 'عن', href: '/about', sort: 4 },
  { id: 'contact', labelEn: 'CONTACT', labelAr: 'اتصل', href: '/contact', sort: 5 },
];

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const primaryNav = defaultNavigation;

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-bmr-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface-2 z-50 overflow-y-auto lg:hidden">
        <div className="p-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-bmr-black hover:text-muted"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="mt-12 space-y-1">
            {primaryNav.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                isExpanded={expandedItems.includes(item.id)}
                onToggle={() => toggleExpand(item.id)}
                onClose={onClose}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function MobileNavItem({
  item,
  isExpanded,
  onToggle,
  onClose,
  expandedItems,
  setExpandedItems,
  level = 0,
}: {
  item: NavItem;
  isExpanded: boolean;
  onToggle: () => void;
  onClose: () => void;
  expandedItems: string[];
  setExpandedItems: (items: string[]) => void;
  level?: number;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const paddingLeft = level * 16;

  const toggleChild = (childId: string) => {
    setExpandedItems(
      expandedItems.includes(childId)
        ? expandedItems.filter((i) => i !== childId)
        : [...expandedItems, childId]
    );
  };

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between py-3 text-base font-medium hover:text-muted transition-colors"
          style={{ paddingLeft }}
        >
          <span>{item.labelEn}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        {isExpanded && (
          <div className="space-y-1 bg-border/30 py-2">
            {item.children!.map((child) => (
              <MobileNavItem
                key={child.id}
                item={child}
                isExpanded={expandedItems.includes(child.id)}
                onToggle={() => toggleChild(child.id)}
                onClose={onClose}
                expandedItems={expandedItems}
                setExpandedItems={setExpandedItems}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || '#'}
      onClick={onClose}
      className="block py-3 text-sm text-bmr-black hover:text-muted transition-colors"
      style={{ paddingLeft }}
    >
      {item.labelEn}
    </Link>
  );
}

