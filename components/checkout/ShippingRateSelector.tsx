'use client';

import { useState, useEffect } from 'react';
import { Loader2, Truck, AlertCircle, RefreshCw } from 'lucide-react';
import type { LocationZone, ShippingRate, ShippingCartItem } from '@/lib/shipping/config';
import type { CartItem } from '@/types';

interface ShippingRateSelectorProps {
  destination: LocationZone;
  items: CartItem[];
  selectedRate: ShippingRate | null;
  onSelectRate: (rate: ShippingRate) => void;
  onLoadingChange?: (loading: boolean) => void;
}

export function ShippingRateSelector({
  destination,
  items,
  selectedRate,
  onSelectRate,
  onLoadingChange,
}: ShippingRateSelectorProps) {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setIsLoading(true);
    setError(null);
    onLoadingChange?.(true);

    try {
      // Convert cart items to shipping items
      const shippingItems: ShippingCartItem[] = items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        sku: item.sku,
        name: item.title || item.name || '',
        qty: item.qty,
        weight: item.weight, // Weight in ounces (from product data)
        // Dimensions could be added here if needed in the future
      }));

      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          items: shippingItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch shipping rates');
      }

      setRates(data.rates || []);
      
      // Auto-select cheapest rate if none selected
      if (data.rates?.length > 0 && !selectedRate) {
        onSelectRate(data.rates[0]);
      }

    } catch (err: any) {
      console.error('Error fetching shipping rates:', err);
      setError(err.message || 'Failed to load shipping rates');
    } finally {
      setIsLoading(false);
      onLoadingChange?.(false);
    }
  };

  // Fetch rates when destination or items change
  useEffect(() => {
    if (destination && items.length > 0) {
      fetchRates();
    }
  }, [destination.zip, items.length]);

  const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const formatDeliveryEstimate = (rate: ShippingRate) => {
    if (rate.estimatedDays) {
      return `${rate.estimatedDays} business day${rate.estimatedDays > 1 ? 's' : ''}`;
    }
    if (rate.durationTerms) {
      return rate.durationTerms;
    }
    return 'Estimated at delivery';
  };

  if (isLoading) {
    return (
      <div className="p-6 border border-border rounded-lg">
        <div className="flex items-center justify-center gap-3 text-muted">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading shipping rates...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-red-800 font-medium">
              Unable to load shipping rates
            </p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <button
              onClick={fetchRates}
              className="mt-3 flex items-center gap-2 text-sm text-red-700 hover:text-red-800 font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rates.length === 0) {
    return (
      <div className="p-6 border border-border rounded-lg">
        <div className="text-center text-muted">
          <Truck className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No shipping rates available for this address.</p>
          <p className="text-xs mt-1">Please check your address or contact support.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-display mb-4">Select Shipping Option</h3>
      <div className="space-y-2">
        {rates.map((rate) => (
          <button
            key={rate.id}
            type="button"
            onClick={() => onSelectRate(rate)}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
              selectedRate?.id === rate.id
                ? 'border-bmr-night bg-bmr-night/5'
                : 'border-border hover:border-bmr-muted'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedRate?.id === rate.id
                    ? 'border-bmr-night'
                    : 'border-gray-300'
                }`}>
                  {selectedRate?.id === rate.id && (
                    <div className="w-2 h-2 rounded-full bg-bmr-night" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {rate.carrier} {rate.serviceLevelName}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatDeliveryEstimate(rate)}
                  </p>
                </div>
              </div>
              <span className="font-semibold">
                {formatPrice(rate.amount)}
              </span>
            </div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-muted mt-3">
        Shipping to {destination.city}, {destination.state} {destination.zip}
      </p>
    </div>
  );
}

