'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language, Currency } from '@/types';

interface LocaleContextType {
  language: Language;
  currency: Currency;
  setLanguage: (lang: Language) => void;
  setCurrency: (curr: Currency) => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Initialize with default values to avoid hydration mismatch
  const [language, setLanguageState] = useState<Language>('en');
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Only access localStorage on client side after mount
    if (typeof window === 'undefined') return;
    
    // Load from localStorage on mount
    try {
      const savedLang = localStorage.getItem('bmr-language') as Language;
      const savedCurr = localStorage.getItem('bmr-currency') as Currency;
      if (savedLang && (savedLang === 'en' || savedLang === 'ar')) {
        setLanguageState(savedLang);
      }
      if (savedCurr && (savedCurr === 'USD' || savedCurr === 'EUR' || savedCurr === 'GBP' || savedCurr === 'AED')) {
        setCurrencyState(savedCurr);
      }
    } catch (error) {
      console.warn('Failed to load locale from localStorage:', error);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only update document on client side
    if (typeof window === 'undefined' || !mounted) return;
    
    try {
      // Update document direction
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    } catch (error) {
      console.warn('Failed to update document direction:', error);
    }
  }, [language, mounted]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('bmr-language', lang);
  };

  const setCurrency = (curr: Currency) => {
    setCurrencyState(curr);
    localStorage.setItem('bmr-currency', curr);
  };

  return (
    <LocaleContext.Provider value={{ language, currency, setLanguage, setCurrency }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
}















