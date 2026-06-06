'use client';

import { useState, useCallback } from 'react';
import type { CartItem } from '@/types';

export interface StockValidationResult {
  productId: string;
  variantId?: string;
  title: string;
  size?: string;
  color?: string;
  requestedQty: number;
  availableStock: number;
  isAvailable: boolean;
  message?: string;
}

export interface StockValidationResponse {
  valid: boolean;
  results: StockValidationResult[];
  hasOutOfStockItems: boolean;
}

export function useStockValidation() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<StockValidationResult[]>([]);
  const [hasOutOfStockItems, setHasOutOfStockItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateStock = useCallback(async (items: CartItem[]): Promise<StockValidationResponse | null> => {
    if (!items || items.length === 0) {
      setValidationResults([]);
      setHasOutOfStockItems(false);
      return null;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/cart/validate-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            title: item.title || item.name,
            name: item.name || item.title,
            size: item.size,
            color: item.color,
            qty: item.qty,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to validate stock');
      }

      const data: StockValidationResponse = await response.json();
      
      setValidationResults(data.results);
      setHasOutOfStockItems(data.hasOutOfStockItems);
      
      return data;
    } catch (err: any) {
      console.error('Stock validation error:', err);
      setError(err.message || 'Failed to validate stock');
      // Fail closed: treat a network/server error as "stock unavailable"
      // so the checkout button stays disabled until we can confirm stock.
      setHasOutOfStockItems(true);
      return null;
    } finally {
      setIsValidating(false);
    }
  }, []);

  const getItemValidation = useCallback((productId: string, size?: string, color?: string): StockValidationResult | undefined => {
    return validationResults.find(r => 
      r.productId === productId && 
      ((!size && !r.size) || r.size === size) &&
      ((!color && !r.color) || r.color === color)
    );
  }, [validationResults]);

  const clearValidation = useCallback(() => {
    setValidationResults([]);
    setHasOutOfStockItems(false);
    setError(null);
  }, []);

  return {
    isValidating,
    validationResults,
    hasOutOfStockItems,
    error,
    validateStock,
    getItemValidation,
    clearValidation,
  };
}

