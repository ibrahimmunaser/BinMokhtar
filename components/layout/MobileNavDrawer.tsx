'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import type { NavItem } from '@/types';

// Subcategory data from Firebase
interface SubcategoryData {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  active: boolean;
}

// Fallback subcategories (shown only if Firebase returns empty)
const FALLBACK_NAV_SUBCATEGORIES: Record<string, NavItem[]> = {
  men: [
    { id: 'emirati', labelEn: 'Emirati Thobes', labelAr: 'ثوب إماراتي', href: '/category/emirati', sort: 1 },
    { id: 'saudi', labelEn: 'Saudi Thobes', labelAr: 'ثوب سعودي', href: '/category/saudi', sort: 2 },
  ],
  boys: [
    { id: 'thobes', labelEn: 'Emirati Thobes', labelAr: 'ثوب إماراتي', href: '/category/thobes', sort: 1 },
  ],
  shemaghs: [
    { id: 'traditional', labelEn: 'Traditional', labelAr: 'تقليدي', href: '/category/traditional', sort: 1 },
    { id: 'yemeni', labelEn: 'Yemeni', labelAr: 'يمني', href: '/category/yemeni', sort: 2 },
  ],
};

// Main navigation structure (subcategories loaded dynamically)
const mainCategories: NavItem[] = [
  {
    id: 'men',
    labelEn: 'Men',
    labelAr: 'رجال',
    href: '/category/men',
    sort: 1,
    children: FALLBACK_NAV_SUBCATEGORIES.men, // Fallback children until Firebase loads
  },
  {
    id: 'boys',
    labelEn: 'Boys',
    labelAr: 'أولاد',
    href: '/category/boys',
    sort: 2,
    children: FALLBACK_NAV_SUBCATEGORIES.boys, // Fallback children until Firebase loads
  },
  {
    id: 'shemaghs',
    labelEn: 'Shemaghs',
    labelAr: 'شماغ',
    href: '/category/shemaghs',
    sort: 3,
    children: FALLBACK_NAV_SUBCATEGORIES.shemaghs, // Fallback children until Firebase loads
  },
  { id: 'about', labelEn: 'ABOUT', labelAr: 'عن', href: '/about', sort: 4 },
  { id: 'contact', labelEn: 'CONTACT', labelAr: 'اتصل', href: '/contact', sort: 5 },
];

// Map category IDs to their Firebase parent IDs (case-sensitive)
const categoryIdToParentId: Record<string, string> = {
  'men': 'Men',
  'boys': 'Boys',
  'shemaghs': 'Shemaghs',
  'women': 'Women',
  'girls': 'Girls',
};

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryData[]>([]);
  
  // Fetch subcategories on mount
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const response = await fetch('/api/admin/subcategories');
        const data = await response.json();
        if (data.success) {
          setSubcategories(data.subcategories || []);
        }
      } catch (error) {
        console.error('Error fetching subcategories for mobile nav:', error);
      }
    };
    fetchSubcategories();
  }, []);
  
  // Build navigation with dynamic subcategories (from Firebase, with fallback)
  const primaryNav = useMemo(() => {
    return mainCategories.map(category => {
      // Skip categories that don't have subcategories (About, Contact)
      if (!['men', 'boys', 'shemaghs', 'women', 'girls'].includes(category.id)) {
        return category;
      }
      
      // Get the Firebase parent ID for this category
      const parentId = categoryIdToParentId[category.id];
      
      // Find subcategories from Firebase
      const firebaseSubcategories = subcategories
        .filter(sub => sub.parentCategoryId === parentId && sub.active !== false)
        .map(sub => ({
          id: sub.slug,
          labelEn: sub.name,
          labelAr: sub.name,
          href: `/category/${sub.slug}`,
          sort: 0,
        }));
      
      // If Firebase has data, use it; otherwise fall back to defaults
      if (firebaseSubcategories.length > 0) {
        return {
          ...category,
          children: firebaseSubcategories,
        };
      }
      
      // Fall back to default subcategories
      return {
        ...category,
        children: FALLBACK_NAV_SUBCATEGORIES[category.id] || [],
      };
    });
  }, [subcategories]);

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

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-bmr-black/50 z-[110] lg:hidden"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-surface-2 z-[120] overflow-y-auto lg:hidden">
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
