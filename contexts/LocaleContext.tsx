'use client';

import React, { createContext, useContext } from 'react';

interface LocaleContextType {
  language: 'en';
  currency: 'USD';
  setLanguage: (lang: 'en') => void;
  setCurrency: (curr: 'USD') => void;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Hardcoded to English and USD only
  const language: 'en' = 'en';
  const currency: 'USD' = 'USD';

  // No-op functions since language/currency can't be changed
  const setLanguage = () => {};
  const setCurrency = () => {};

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















