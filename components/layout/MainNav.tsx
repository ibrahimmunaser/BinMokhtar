'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import type { NavItem } from '@/types';

// Navigation structure matching client IA
const defaultNavigation: NavItem[] = [
  {
    id: 'shop',
    label: 'SHOP',
    position: 'primary',
    children: [
      { 
        id: 'men', 
        label: 'Men', 
        href: '/category/men',
        position: 'primary',
        children: [
          {
            id: 'thobes',
            label: 'Thobes',
            href: '/category/thobes',
            position: 'primary',
            children: [
              { id: 'short-sleeve', label: 'Short Sleeve', href: '/category/thobes/short-sleeve', position: 'primary' },
              { id: 'long-sleeve', label: 'Long Sleeve', href: '/category/thobes/long-sleeve', position: 'primary' },
            ]
          }
        ]
      },
      { id: 'shemaghs', label: 'Shemaghs', href: '/category/shemaghs', position: 'primary' },
      { id: 'yemeni-shals', label: 'Yemeni Shals', href: '/category/yemeni-shals', position: 'primary' },
      {
        id: 'women',
        label: 'Women',
        href: '/category/women',
        position: 'primary',
        children: [
          { id: 'hijabs', label: 'Hijabs', href: '/category/hijabs', position: 'primary' },
          { id: 'abayas', label: 'Abayas', href: '/category/abayas', position: 'primary' },
        ]
      },
      { id: 'kids', label: 'Kids', href: '/category/kids', position: 'primary' },
    ]
  },
  { id: 'about', label: 'ABOUT', href: '/about', position: 'primary' },
  { id: 'contact', label: 'CONTACT', href: '/contact', position: 'primary' },
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
  const isMegaMenu = item.id === 'shop';

  return (
    <div className="relative" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      {item.href ? (
        <Link
          href={item.href}
          className="text-[11px] font-medium uppercase tracking-wider text-bmr-black hover:text-muted transition-colors py-2 whitespace-nowrap"
        >
          {item.label}
        </Link>
      ) : (
        <button className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wider text-bmr-black hover:text-muted transition-colors py-2 whitespace-nowrap">
          {item.label}
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
          {item.label}
        </Link>
      ) : (
        <div className="font-display text-base font-medium mb-3">
          {item.label}
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
                  {child.label}
                </Link>
              ) : (
                <div className="text-sm font-medium mb-1">{child.label}</div>
              )}
              
              {child.children && child.children.length > 0 && (
                <ul className="ml-3 mt-1 space-y-1">
                  {child.children.map((nested) => (
                    <li key={nested.id}>
                      <Link
                        href={nested.href || '#'}
                        className="text-xs text-muted hover:text-bmr-black transition-colors block"
                      >
                        {nested.label}
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
      {item.label}
    </Link>
  );
}

