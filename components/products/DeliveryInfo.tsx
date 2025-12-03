'use client';

import { useEffect, useState } from 'react';
import { Truck, Package, MapPin } from 'lucide-react';
import { useLocationStore } from '@/store/location';
import { LOCAL_DELIVERY_FEE_CENTS, DEFAULT_SHIPPING_ESTIMATE_DAYS } from '@/lib/shipping/config';

interface DeliveryInfoProps {
  compact?: boolean;
  onSetAddress?: () => void;
}

export function DeliveryInfo({ compact = false, onSetAddress }: DeliveryInfoProps) {
  const [mounted, setMounted] = useState(false);
  const locationZone = useLocationStore((state) => state.locationZone);
  const isHydrated = useLocationStore((state) => state.isHydrated);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until hydrated
  if (!mounted || !isHydrated) {
    return (
      <div className="text-xs text-muted animate-pulse">
        Loading delivery options...
      </div>
    );
  }

  const formatDeliveryFee = () => `$${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)}`;

  // No location set
  if (!locationZone) {
    if (compact) {
      return (
        <button
          onClick={onSetAddress}
          className="text-xs text-bmr-night hover:underline flex items-center gap-1"
        >
          <MapPin className="w-3 h-3" />
          Set location for delivery options
        </button>
      );
    }

    return (
      <div className="space-y-1 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5" />
          <span>Pickup in store</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Truck className="w-3.5 h-3.5" />
          <span>Local delivery within 15 miles ({formatDeliveryFee()})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          <span>Shipping available nationwide</span>
        </div>
        {onSetAddress && (
          <button
            onClick={onSetAddress}
            className="text-bmr-night hover:underline mt-1"
          >
            Set address for personalized options →
          </button>
        )}
      </div>
    );
  }

  // Local delivery available
  if (locationZone.zone === 'local') {
    if (compact) {
      return (
        <div className="text-xs text-green-700 flex items-center gap-1">
          <Truck className="w-3 h-3" />
          Local delivery {formatDeliveryFee()} · {locationZone.city}
        </div>
      );
    }

    return (
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-muted">
          <Package className="w-3.5 h-3.5" />
          <span>Pickup: Ready in 1-2 days</span>
        </div>
        <div className="flex items-center gap-1.5 text-green-700 font-medium">
          <Truck className="w-3.5 h-3.5" />
          <span>Local delivery to {locationZone.city}: {formatDeliveryFee()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted">
          <MapPin className="w-3.5 h-3.5" />
          <span>Shipping also available</span>
        </div>
      </div>
    );
  }

  // Shipping only (outside local delivery area)
  if (compact) {
    return (
      <div className="text-xs text-muted flex items-center gap-1">
        <Truck className="w-3 h-3" />
        Ships to {locationZone.city}, {locationZone.state}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-xs">
      <div className="flex items-center gap-1.5 text-muted">
        <Package className="w-3.5 h-3.5" />
        <span>Pickup: Ready in 1-2 days</span>
      </div>
      <div className="flex items-center gap-1.5 text-muted">
        <Truck className="w-3.5 h-3.5" />
        <span>
          Shipping to {locationZone.city}, {locationZone.state} · 
          Est. {DEFAULT_SHIPPING_ESTIMATE_DAYS.min}-{DEFAULT_SHIPPING_ESTIMATE_DAYS.max} days
        </span>
      </div>
      <p className="text-muted/70 text-[10px]">
        Exact shipping cost at checkout
      </p>
    </div>
  );
}

