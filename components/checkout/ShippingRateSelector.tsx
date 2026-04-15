'use client';

import { useEffect } from 'react';
import { Truck } from 'lucide-react';
import { FLAT_SHIPPING_RATE, type ShippingRate } from '@/lib/shipping/config';

interface ShippingRateSelectorProps {
  onSelectRate: (rate: ShippingRate) => void;
}

export function ShippingRateSelector({ onSelectRate }: ShippingRateSelectorProps) {
  // Auto-select the flat rate on mount
  useEffect(() => {
    onSelectRate(FLAT_SHIPPING_RATE);
  }, [onSelectRate]);

  return (
    <div>
      <h3 className="text-lg font-display mb-4">Shipping</h3>
      <div
        className="w-full p-4 border-2 border-bmr-night bg-bmr-night/5 rounded-lg text-left"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2 border-bmr-night flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-bmr-night" />
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-bmr-night" />
              <p className="font-medium text-sm">Standard Shipping</p>
            </div>
          </div>
          <span className="font-semibold">$9.99</span>
        </div>
        <p className="text-xs text-muted mt-2 ml-7">Delivered anywhere in the US</p>
      </div>
    </div>
  );
}
