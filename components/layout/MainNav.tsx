'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { NavItem } from '@/types';

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

export function MainNav() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const primaryNav = defaultNavigation;

  return (
    <nav className="hidden lg:flex items-center gap-4 xl:gap-6">
      {primaryNav.map((item) => (
        <NavMenuItem
          key={item.id}
          item={item}
          isActive={activeMenu === item.id}
          onMouseEnter={() => setActiveMenu(item.id)}
          onMouseLeave={() => setActiveMenu(null)}
        />
      ))}
    </nav>
  );
}

function NavMenuItem({
  item,
  isActive,
  onMouseEnter,
  onMouseLeave,
}: {
  item: NavItem;
  isActive: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isMegaMenu = false;

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {item.href ? (
        <Link
          href={item.href}
          className="text-[11px] font-medium uppercase tracking-wider text-bmr-black hover:text-muted transition-colors py-2 whitespace-nowrap"
        >
          {item.labelEn}
        </Link>
      ) : (
        <button className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-bmr-black hover:text-muted transition-colors py-2 whitespace-nowrap">
          {item.labelEn}
          {hasChildren && <ChevronDown className="w-3 h-3" />}
        </button>
      )}

      {hasChildren && isActive && isMegaMenu && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-[640px] bg-bmr-white border border-border shadow-lg z-50">
          <div className="p-8">
            <div className="grid grid-cols-3 gap-8">
              {item.children!.map((child) => (
                <MegaMenuColumn key={child.id} item={child} />
              ))}
            </div>
          </div>
        </div>
      )}

      {hasChildren && isActive && !isMegaMenu && (
        <div className="absolute top-full left-0 mt-0 min-w-[200px] bg-bmr-white border border-border shadow-lg z-50">
          <div className="py-2">
            {item.children!.map((child) => (
              <SubMenuItem key={child.id} item={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MegaMenuColumn({ item }: { item: NavItem }) {
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      {item.href ? (
        <Link
          href={item.href}
          className="font-display text-base font-medium mb-3 block hover:text-muted transition-colors"
        >
          {item.labelEn}
        </Link>
      ) : (
        <div className="font-display text-base font-medium mb-3">
          {item.labelEn}
        </div>
      )}
      
      {hasChildren && (
        <ul className="space-y-2">
          {item.children!.map((child) => (
            <li key={child.id}>
              {child.href ? (
                <Link
                  href={child.href}
                  className="text-sm text-muted hover:text-bmr-black transition-colors block"
                >
                  {child.labelEn}
                </Link>
              ) : (
                <div className="text-sm font-medium mb-1">{child.labelEn}</div>
              )}
              
              {child.children && child.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1">
                  {child.children.map((nested) => (
                    <li key={nested.id}>
                      <Link
                        href={nested.href || '#'}
                        className="text-xs text-muted hover:text-bmr-black transition-colors block"
                      >
                        {nested.labelEn}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SubMenuItem({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href || '#'}
      className="block px-4 py-2 text-sm hover:bg-border transition-colors"
    >
      {item.labelEn}
    </Link>
  );
}

