'use client';

import { useEffect, useState } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationStore } from '@/store/location';
import { AddressModal } from './AddressModal';
import { LOCAL_DELIVERY_FEE_CENTS } from '@/lib/shipping/config';

export function DeliveryBar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const locationZone = useLocationStore((state) => state.locationZone);

  // Handle hydration - wait for client-side mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state during SSR/hydration
  if (!mounted) {
    return (
      <div className="bg-bmr-night text-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-10">
            <div className="flex items-center gap-2 text-sm opacity-50">
              <MapPin className="w-4 h-4" />
              <span>Loading delivery options...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDeliveryFee = () => {
    return `$${(LOCAL_DELIVERY_FEE_CENTS / 100).toFixed(0)}`;
  };

  return (
    <>
      <div className="bg-bmr-night text-white">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 h-10 text-sm hover:bg-white/10 transition-colors cursor-pointer"
          >
            <MapPin className="w-4 h-4 flex-shrink-0" />
            
            {!locationZone ? (
              // No address set
              <span className="flex items-center gap-1">
                <span className="font-medium">Deliver to:</span>
                <span className="text-white/80">Set address to see local delivery & shipping options</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            ) : locationZone.zone === 'local' ? (
              // Within local delivery radius
              <span className="flex items-center gap-1">
                <span className="font-medium">Delivering to {locationZone.city}, {locationZone.state}</span>
                <span className="text-white/80 hidden sm:inline">
                  · Local delivery available ({formatDeliveryFee()})
                </span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            ) : (
              // Outside local delivery radius
              <span className="flex items-center gap-1">
                <span className="font-medium">Delivering to {locationZone.city}, {locationZone.state}</span>
                <span className="text-white/80 hidden sm:inline">· Shipping only (no local delivery)</span>
                <ChevronDown className="w-4 h-4 ml-1" />
              </span>
            )}
          </button>
        </div>
      </div>

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}

