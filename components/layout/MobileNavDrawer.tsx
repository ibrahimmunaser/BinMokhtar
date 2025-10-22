'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import type { NavItem, Language, Currency } from '@/types';

// Navigation structure per request: Men, Women, Kids, Shemaghs, Yemeni Shals, About, Contact
const defaultNavigation: NavItem[] = [
  {
    id: 'men',
    labelEn: 'Men',
    labelAr: 'رجال',
    href: '/shop/mens',
    sort: 1,
    children: [
      { id: 'shop-all-men', labelEn: 'Shop All Men', labelAr: 'تسوق الرجال', href: '/shop/mens', sort: 1 },
      { id: 'thobes-short', labelEn: 'Thobes • Short Sleeve', labelAr: 'ثياب • كم قصير', href: '/category/thobes/short-sleeve', sort: 2 },
      { id: 'thobes-long', labelEn: 'Thobes • Long Sleeve', labelAr: 'ثياب • كم طويل', href: '/category/thobes/long-sleeve', sort: 3 },
    ],
  },
  {
    id: 'women',
    labelEn: 'Women',
    labelAr: 'نساء',
    href: '/shop/womens',
    sort: 2,
    children: [
      { id: 'shop-all-women', labelEn: 'Shop All Women', labelAr: 'تسوق النساء', href: '/shop/womens', sort: 1 },
      { id: 'hijabs', labelEn: 'Hijabs', labelAr: 'حجاب', href: '/category/hijabs', sort: 2 },
      { id: 'abayas', labelEn: 'Abayas', labelAr: 'عباية', href: '/category/abayas', sort: 3 },
    ],
  },
  {
    id: 'kids',
    labelEn: 'Kids',
    labelAr: 'أطفال',
    href: '/shop/children',
    sort: 3,
    children: [
      { id: 'shop-all-kids', labelEn: 'Shop All Kids', labelAr: 'تسوق الأطفال', href: '/shop/children', sort: 1 },
    ],
  },
  { id: 'shemaghs', labelEn: 'Shemaghs', labelAr: 'شماغ', href: '/category/shemaghs', sort: 4 },
  { id: 'yemeni-shals', labelEn: 'Yemeni Shals', labelAr: 'شال يمني', href: '/category/yemeni-shals', sort: 5 },
  { id: 'about', labelEn: 'ABOUT', labelAr: 'عن', href: '/about', sort: 6 },
  { id: 'contact', labelEn: 'CONTACT', labelAr: 'اتصل', href: '/contact', sort: 7 },
];

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavDrawer({ isOpen, onClose }: MobileNavDrawerProps) {
  const { language, currency, setLanguage, setCurrency } = useLocale();
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
      <div
        className={`fixed top-0 ${
          language === 'ar' ? 'left-0' : 'right-0'
        } h-full w-full max-w-sm bg-surface-2 z-50 overflow-y-auto lg:hidden`}
      >
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

          <div className="mt-12 pt-6 border-t border-border space-y-4">
            <div>
              <div className="text-xs font-medium mb-2 uppercase tracking-wideish">
                Language
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 py-2 text-sm border ${
                    language === 'en'
                      ? 'border-bmr-black bg-bmr-black text-bmr-white'
                      : 'border-border'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setLanguage('ar')}
                  className={`px-3 py-2 text-sm border ${
                    language === 'ar'
                      ? 'border-bmr-black bg-bmr-black text-bmr-white'
                      : 'border-border'
                  }`}
                >
                  العربية
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium mb-2 uppercase tracking-wideish">
                Currency
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full px-3 py-2 border border-border bg-bmr-white text-sm"
              >
                <option value="USD">USD $</option>
                <option value="EUR">EUR €</option>
                <option value="GBP">GBP £</option>
                <option value="AED">AED</option>
              </select>
            </div>
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

