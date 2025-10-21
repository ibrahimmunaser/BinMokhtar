'use client';

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { Globe, ChevronDown } from 'lucide-react';
import type { Language, Currency } from '@/types';

export function LocaleCurrencySwitch() {
  const { language, currency, setLanguage, setCurrency } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'ar', label: 'العربية' },
  ];

  const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'AED'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm hover:text-muted transition-colors"
        aria-label="Language and currency"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{language.toUpperCase()}</span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">{currency}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-bmr-white border border-border shadow-lg z-50">
          <div className="p-3 border-b border-border">
            <div className="text-xs font-medium mb-2">Language</div>
            <div className="space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'block w-full text-left px-2 py-1 text-sm hover:bg-border transition-colors',
                    language === lang.code && 'font-medium'
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3">
            <div className="text-xs font-medium mb-2">Currency</div>
            <div className="space-y-1">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrency(curr);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'block w-full text-left px-2 py-1 text-sm hover:bg-border transition-colors',
                    currency === curr && 'font-medium'
                  )}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}




