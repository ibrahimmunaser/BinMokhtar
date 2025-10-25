import { Currency } from '@/types';

/**
 * Format price in cents to localized currency string
 */
export function formatPrice(
  priceInCents: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  const priceInDollars = priceInCents / 100;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(priceInDollars);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

/**
 * Format price range
 */
export function formatPriceRange(
  minPriceInCents: number,
  maxPriceInCents: number,
  currency: Currency = 'USD',
  locale: string = 'en-US'
): string {
  if (minPriceInCents === maxPriceInCents) {
    return formatPrice(minPriceInCents, currency, locale);
  }
  
  const minFormatted = formatPrice(minPriceInCents, currency, locale);
  const maxFormatted = formatPrice(maxPriceInCents, currency, locale);
  
  return `${minFormatted} – ${maxFormatted}`;
}







