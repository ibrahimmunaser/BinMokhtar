/**
 * Location/Zone Store
 * Manages customer delivery location state with localStorage persistence
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationZone, DeliveryZone } from '@/lib/shipping/config';

interface LocationState {
  // Current location zone data
  locationZone: LocationZone | null;
  
  // Loading state for async operations
  isLoading: boolean;
  
  // Error state
  error: string | null;
  
  // Hydration flag to prevent SSR mismatch
  isHydrated: boolean;
  
  // Actions
  setLocationZone: (zone: LocationZone) => void;
  clearLocationZone: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHydrated: (hydrated: boolean) => void;
  
  // Computed helpers
  isLocalDeliveryAvailable: () => boolean;
  getZone: () => DeliveryZone | null;
  getDisplayAddress: () => string;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      locationZone: null,
      isLoading: false,
      error: null,
      isHydrated: false,

      setLocationZone: (zone) => {
        set({ locationZone: zone, error: null });
      },

      clearLocationZone: () => {
        set({ locationZone: null, error: null });
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      setError: (error) => {
        set({ error, isLoading: false });
      },

      setHydrated: (hydrated) => {
        set({ isHydrated: hydrated });
      },

      isLocalDeliveryAvailable: () => {
        const { locationZone } = get();
        return locationZone?.zone === 'local';
      },

      getZone: () => {
        const { locationZone } = get();
        return locationZone?.zone || null;
      },

      getDisplayAddress: () => {
        const { locationZone } = get();
        if (!locationZone) return '';
        
        if (locationZone.city && locationZone.state) {
          return `${locationZone.city}, ${locationZone.state}`;
        }
        
        return locationZone.formattedAddress || '';
      },
    }),
    {
      name: 'bmr-location-storage',
      // Only persist locationZone, not loading/error states
      partialize: (state) => ({ locationZone: state.locationZone }),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after rehydration
        if (state) {
          state.setHydrated(true);
        }
      },
    }
  )
);

/**
 * Hook to resolve location from API
 */
export async function resolveLocation(
  params: { address: string } | { lat: number; lng: number }
): Promise<LocationZone> {
  const response = await fetch('/api/shipping/resolve-location', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to resolve location');
  }

  return data.locationZone;
}

